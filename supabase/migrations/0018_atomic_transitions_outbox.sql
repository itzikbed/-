-- 0018_atomic_transitions_outbox.sql
-- Make every meaningful cat status transition a single transaction, and move
-- outbound mail onto a durable queue.
--
-- Before this migration `markAsAdopted`/`archive` called closeSiblings() in the
-- application FIRST — rejecting every pending request and dispatching their
-- rejection mail — and only then attempted the cat update behind a status guard.
-- A lost race or a failed update left adopters rejected on a cat that was still
-- published, with the mail already gone and no way to take it back.
--
-- The sibling closure could not simply be handed to the existing after-trigger:
-- guard_request_update() rejects any non-admin write to adoption_requests, so a
-- publisher closing their own cat would have raised. That is why closeSiblings()
-- ran through the service role. This migration fixes the root cause instead: the
-- cat's owner is now allowed to close pending requests on a cat that is already
-- out of circulation, which is exactly the legitimate case and nothing more.

-- ---------------------------------------------------------------------------
-- 1. Durable mail queue
-- ---------------------------------------------------------------------------
-- Rows are written inside the business transaction; delivery happens after it
-- commits. No recipient address is stored — only the user id, resolved at send
-- time — so the queue holds no mail PII, matching email_log's design.

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  -- One row per real-world event. Re-running a transition cannot enqueue a
  -- second copy of the same message.
  dedupe_key text not null unique,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  cat_id uuid references public.cats(id) on delete set null,
  request_id uuid references public.adoption_requests(id) on delete set null,
  conversation_id uuid references public.support_conversations(id) on delete set null,
  -- queued    — waiting for a worker
  -- sending   — claimed by a worker
  -- accepted  — the provider took the message. NOT proof of delivery.
  -- delivered — confirmed by a provider webhook (not wired yet)
  -- failed    — provider refused; will be retried while attempts remain
  -- abandoned — attempts exhausted; needs a human
  status text not null default 'queued'
    check (status in ('queued','sending','accepted','delivered','failed','abandoned')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_outbox_text_lengths check (
    char_length(template) <= 100
    and (last_error is null or char_length(last_error) <= 2000)
    and char_length(dedupe_key) <= 200
  )
);

create index if not exists email_outbox_due_idx
  on public.email_outbox (next_attempt_at)
  where status = 'queued';

drop trigger if exists trg_email_outbox_updated on public.email_outbox;
create trigger trg_email_outbox_updated before update on public.email_outbox
  for each row execute function public.set_updated_at();

alter table public.email_outbox enable row level security;

drop policy if exists email_outbox_select on public.email_outbox;
create policy email_outbox_select on public.email_outbox for select using (public.is_admin());

-- email_log keeps its history. 'sent' is the pre-0018 vocabulary and is left
-- valid so existing rows stay readable; new writes use the queue's vocabulary.
alter table public.email_log drop constraint if exists email_log_status_check;
alter table public.email_log add constraint email_log_status_check
  check (status in ('sent','queued','accepted','delivered','failed','abandoned'));

-- ---------------------------------------------------------------------------
-- 2. Allow a publisher to close requests on their own withdrawn cat
-- ---------------------------------------------------------------------------
create or replace function public.guard_request_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_cat_status text;
begin
  if public.is_admin() then
    return new;
  end if;

  -- The cat's owner may close a pending request, but only once the cat itself
  -- is already out of circulation, and only by writing the decision fields.
  -- Anything else still falls through to the rules below.
  select c.owner_id, c.status into v_owner, v_cat_status
  from public.cats c where c.id = old.cat_id;

  if auth.uid() is not null
     and v_owner = auth.uid()
     and v_cat_status in ('adopted', 'archived')
     and old.status = 'pending' and new.status = 'rejected'
     and new.id is not distinct from old.id
     and new.cat_id is not distinct from old.cat_id
     and new.adopter_id is not distinct from old.adopter_id
     and new.message is not distinct from old.message
     and new.decided_by is not distinct from old.decided_by
     and new.created_at is not distinct from old.created_at then
    return new;
  end if;

  -- Non-admins can only change status from 'pending' to 'withdrawn'
  if not (old.status = 'pending' and new.status = 'withdrawn') then
    raise exception 'invalid request update status transition';
  end if;

  -- All other columns must remain unchanged
  if new.id is distinct from old.id
     or new.cat_id is distinct from old.cat_id
     or new.adopter_id is distinct from old.adopter_id
     or new.message is distinct from old.message
     or new.admin_note is distinct from old.admin_note
     or new.decided_by is distinct from old.decided_by
     or new.decided_at is distinct from old.decided_at
     or new.created_at is distinct from old.created_at then
    raise exception 'non-admin update cannot modify other request fields';
  end if;

  return new;
end; $$;

-- ---------------------------------------------------------------------------
-- 3. Replace the silent auto-close trigger with a deferred invariant
-- ---------------------------------------------------------------------------
-- The old trigger closed sibling requests itself, duplicating the application
-- and losing the per-cat wording. It also could not run for a publisher. It is
-- replaced by an assertion checked at COMMIT: a cat may not leave circulation
-- while pending requests remain. Any path that forgets fails loudly instead of
-- half-completing.

drop trigger if exists trg_cat_status_transition on public.cats;
drop function if exists public.handle_cat_status_transition();

create or replace function public.assert_no_pending_requests()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_pending int;
begin
  if new.status in ('adopted', 'archived') then
    select count(*) into v_pending
    from public.adoption_requests
    where cat_id = new.id and status = 'pending';

    if v_pending > 0 then
      raise exception 'cat % left circulation with % pending request(s)', new.id, v_pending
        using errcode = 'integrity_constraint_violation';
    end if;
  end if;
  return null;
end; $$;

drop trigger if exists trg_cat_no_pending_on_exit on public.cats;
create constraint trigger trg_cat_no_pending_on_exit
  after update on public.cats
  deferrable initially deferred
  for each row execute function public.assert_no_pending_requests();

-- ---------------------------------------------------------------------------
-- 4. The one transactional entry point for cat status changes
-- ---------------------------------------------------------------------------
-- Status, sibling closure, decision stamps, the moderation record and the
-- queued notifications all commit together or not at all.
--
-- p_sibling_note carries the user-facing wording from the application so that
-- Hebrew copy stays in content/he/ui.json and out of the database.

create or replace function public.transition_cat_status(
  p_cat_id uuid,
  p_to_status text,
  p_reason text default null,
  p_sibling_note text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_is_admin boolean := coalesce(public.is_admin(), false);
  v_cat public.cats;
  v_allowed_from text[];
  v_action text;
  v_owner_template text;
  v_closed_count int := 0;
  v_now timestamptz := now();
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  case p_to_status
    when 'published' then v_allowed_from := array['pending'];   v_action := 'approve';
    when 'rejected'  then v_allowed_from := array['pending'];   v_action := 'reject';
    when 'adopted'   then v_allowed_from := array['published']; v_action := 'adopt';
    when 'archived'  then
      v_action := 'archive';
      -- An admin archives a live listing; an owner may also retire one they
      -- have already marked adopted.
      v_allowed_from := case when v_is_admin then array['published']
                             else array['published','adopted'] end;
    else
      return jsonb_build_object('ok', false, 'reason', 'unsupported_status');
  end case;

  -- Moderation decisions are admin-only and must carry a reason.
  if p_to_status in ('published','rejected') and not v_is_admin then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if p_to_status = 'rejected' and coalesce(char_length(btrim(p_reason)), 0) < 10 then
    return jsonb_build_object('ok', false, 'reason', 'reason_required');
  end if;
  if p_to_status = 'archived' and v_is_admin
     and coalesce(char_length(btrim(p_reason)), 0) < 10 then
    return jsonb_build_object('ok', false, 'reason', 'reason_required');
  end if;
  if coalesce(char_length(p_reason), 0) > 2000
     or coalesce(char_length(p_sibling_note), 0) > 2000 then
    return jsonb_build_object('ok', false, 'reason', 'reason_too_long');
  end if;

  -- Serialise competing decisions on the same cat.
  select * into v_cat from public.cats where id = p_cat_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not v_is_admin and v_cat.owner_id is distinct from v_actor then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if not (v_cat.status = any(v_allowed_from)) then
    return jsonb_build_object('ok', false, 'reason', 'conflict',
                              'current_status', v_cat.status);
  end if;

  update public.cats
  set status = p_to_status,
      published_at = case when p_to_status = 'published'
                          then coalesce(published_at, v_now) else published_at end,
      adopted_at = case when p_to_status = 'adopted' then v_now else adopted_at end,
      reject_reason = case when p_to_status = 'rejected' then p_reason else reject_reason end
  where id = p_cat_id;

  -- Sibling closure runs after the cat is out of circulation, which is what
  -- makes it legal for an owner under guard_request_update above. The deferred
  -- assertion in section 3 verifies at COMMIT that none were missed.
  if p_to_status in ('adopted','archived') then
    with closed as (
      update public.adoption_requests r
      set status = 'rejected',
          admin_note = coalesce(nullif(btrim(p_sibling_note), ''), 'המודעה כבר אינה זמינה'),
          decided_at = v_now
      where r.cat_id = p_cat_id and r.status = 'pending'
      returning r.id, r.adopter_id
    ), queued as (
      insert into public.email_outbox
        (dedupe_key, template, payload, recipient_user_id, cat_id, request_id)
      select 'request_closed:' || c.id,
             'request_closed_cat_adopted',
             jsonb_build_object('catName', v_cat.name, 'catSex', v_cat.sex),
             c.adopter_id, p_cat_id, c.id
      from closed c
      on conflict (dedupe_key) do nothing
      returning 1
    )
    select count(*) into v_closed_count from closed;
  end if;

  insert into public.moderation_log (actor_id, entity_type, entity_id, action, reason)
  values (v_actor, 'cat', p_cat_id, v_action, nullif(btrim(p_reason), ''));

  -- The owner hears about a decision someone else made about their listing.
  v_owner_template := case
    when v_action = 'approve' then 'cat_approved'
    when v_action = 'reject' then 'cat_rejected'
    when v_action = 'archive' and v_is_admin then 'cat_archived_by_admin'
    else null
  end;

  if v_owner_template is not null and v_cat.owner_id is distinct from v_actor then
    insert into public.email_outbox
      (dedupe_key, template, payload, recipient_user_id, cat_id)
    values (
      v_owner_template || ':' || p_cat_id::text,
      v_owner_template,
      jsonb_build_object('catName', v_cat.name, 'catSex', v_cat.sex,
                         'catId', p_cat_id::text, 'reason', nullif(btrim(p_reason), '')),
      v_cat.owner_id, p_cat_id
    )
    on conflict (dedupe_key) do nothing;
  end if;

  return jsonb_build_object('ok', true, 'status', p_to_status,
                            'closed_requests', v_closed_count);
end; $$;

-- ---------------------------------------------------------------------------
-- 5. Queue workers
-- ---------------------------------------------------------------------------
create or replace function public.claim_email_outbox(p_limit int default 10)
returns setof public.email_outbox
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  -- A worker that died mid-send leaves a row claimed. Hand it back.
  update public.email_outbox
  set status = 'queued'
  where status = 'sending' and updated_at < now() - interval '5 minutes';

  return query
  update public.email_outbox o
  set status = 'sending', attempts = o.attempts + 1
  where o.id in (
    select id from public.email_outbox
    where status = 'queued' and next_attempt_at <= now()
    order by next_attempt_at
    for update skip locked
    limit greatest(coalesce(p_limit, 10), 0)
  )
  returning o.*;
end; $$;

create or replace function public.settle_email_outbox(
  p_id uuid,
  p_accepted boolean,
  p_provider_message_id text default null,
  p_error text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_row public.email_outbox;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select * into v_row from public.email_outbox where id = p_id for update;
  if not found then return; end if;

  if p_accepted then
    update public.email_outbox
    set status = 'accepted',
        provider_message_id = left(p_provider_message_id, 200),
        last_error = null
    where id = p_id;
  elsif v_row.attempts >= v_row.max_attempts then
    update public.email_outbox
    set status = 'abandoned', last_error = left(p_error, 2000)
    where id = p_id;
  else
    -- 1, 3, 9, 27 minutes
    update public.email_outbox
    set status = 'queued',
        last_error = left(p_error, 2000),
        next_attempt_at = now() + (interval '1 minute' * power(3, greatest(v_row.attempts - 1, 0)))
    where id = p_id;
  end if;
end; $$;

-- ---------------------------------------------------------------------------
-- 6. Least privilege
-- ---------------------------------------------------------------------------
revoke all on function public.transition_cat_status(uuid, text, text, text) from public, anon;
grant execute on function public.transition_cat_status(uuid, text, text, text) to authenticated, service_role;

revoke all on function public.claim_email_outbox(int) from public, anon, authenticated;
grant execute on function public.claim_email_outbox(int) to service_role;

revoke all on function public.settle_email_outbox(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.settle_email_outbox(uuid, boolean, text, text) to service_role;

revoke all on table public.email_outbox from anon;
