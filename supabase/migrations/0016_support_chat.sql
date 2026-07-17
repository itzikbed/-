-- 0016_support_chat.sql
-- In-site support chat between registered users and site admins.
-- Design decisions:
--  * One OPEN conversation per user (partial unique index); closed conversations
--    are kept as history. A user who sends a message after an admin closed the
--    conversation REOPENS the same conversation (guard permits exactly the
--    closed->open transition for non-admins) — no parallel threads per user.
--  * Message bodies are immutable for everyone; only the read receipts
--    (read_by_user_at / read_by_admin_at) may change, each by its own side.
--  * Rate cap in the style of 0015: max 20 messages per hour per non-admin sender.

-- ============ tables ============
create table public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create unique index uniq_open_support_conversation
  on public.support_conversations (user_id) where status = 'open';
create index idx_support_conversations_recent
  on public.support_conversations (last_message_at desc);
alter table public.support_conversations enable row level security;

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000 and btrim(body) <> ''),
  created_at timestamptz not null default now(),
  read_by_user_at timestamptz,
  read_by_admin_at timestamptz
);
create index idx_support_messages_conversation
  on public.support_messages (conversation_id, created_at);
create index idx_support_messages_sender_recent
  on public.support_messages (sender_id, created_at);
alter table public.support_messages enable row level security;

-- ============ RLS ============
create policy support_conversations_select on public.support_conversations for select
  using (user_id = auth.uid() or public.is_admin());
create policy support_conversations_insert on public.support_conversations for insert
  with check (user_id = auth.uid() and status = 'open');
create policy support_conversations_update on public.support_conversations for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy support_messages_select on public.support_messages for select
  using (
    public.is_admin()
    or exists (select 1 from public.support_conversations c
               where c.id = conversation_id and c.user_id = auth.uid())
  );
create policy support_messages_insert on public.support_messages for insert
  with check (
    sender_id = auth.uid()
    and (
      public.is_admin()
      or exists (select 1 from public.support_conversations c
                 where c.id = conversation_id
                   and c.user_id = auth.uid()
                   and c.status = 'open')
    )
  );
create policy support_messages_update on public.support_messages for update
  using (
    public.is_admin()
    or exists (select 1 from public.support_conversations c
               where c.id = conversation_id and c.user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.support_conversations c
               where c.id = conversation_id and c.user_id = auth.uid())
  );
-- No DELETE policies on either table: chat history is append-only.

-- ============ triggers ============

-- Conversation updates: only status may change. Non-admins may only reopen
-- (closed -> open, used when a user writes into a conversation an admin closed).
-- pg_trigger_depth() > 1 means the update came from the last_message_at bump below.
create or replace function public.guard_support_conversation_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role() = 'service_role', false) then return new; end if;
  if pg_trigger_depth() > 1 then return new; end if;

  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.created_at is distinct from old.created_at
     or new.last_message_at is distinct from old.last_message_at then
    raise exception 'only conversation status may be updated';
  end if;

  if not public.is_admin() and not (old.status = 'closed' and new.status = 'open') then
    raise exception 'users may only reopen their closed conversation';
  end if;

  return new;
end; $$;

drop trigger if exists trg_support_conversation_guard on public.support_conversations;
create trigger trg_support_conversation_guard before update on public.support_conversations
  for each row execute function public.guard_support_conversation_update();

-- Message content is immutable; each side may only stamp its own read receipt.
create or replace function public.guard_support_message_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role() = 'service_role', false) then return new; end if;

  if new.id is distinct from old.id
     or new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'support message content is immutable';
  end if;

  if public.is_admin() then
    if new.read_by_user_at is distinct from old.read_by_user_at then
      raise exception 'admins may only update read_by_admin_at';
    end if;
  else
    if new.read_by_admin_at is distinct from old.read_by_admin_at then
      raise exception 'users may only update read_by_user_at';
    end if;
  end if;

  return new;
end; $$;

drop trigger if exists trg_support_message_guard on public.support_messages;
create trigger trg_support_message_guard before update on public.support_messages
  for each row execute function public.guard_support_message_update();

-- A new message is implicitly "read" by its own side, and never pre-read by the
-- other side (clients cannot forge receipts on insert).
create or replace function public.stamp_support_message_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.support_conversations where id = new.conversation_id;
  if new.sender_id = v_owner then
    new.read_by_user_at = now();
    new.read_by_admin_at = null;
  else
    new.read_by_admin_at = now();
    new.read_by_user_at = null;
  end if;
  return new;
end; $$;

drop trigger if exists trg_support_message_defaults on public.support_messages;
create trigger trg_support_message_defaults before insert on public.support_messages
  for each row execute function public.stamp_support_message_defaults();

-- Rate cap in the style of 0015: block more than 20 messages/hour per non-admin.
create or replace function public.guard_support_message_rate()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  msg_count integer;
begin
  if coalesce(auth.role() = 'service_role', false) then return new; end if;
  if public.is_admin() then return new; end if;

  -- Serialize per-sender so concurrent inserts cannot race past the cap.
  perform pg_advisory_xact_lock(hashtext('support_msg_rate:' || new.sender_id::text));

  select count(*) into msg_count
  from public.support_messages
  where sender_id = new.sender_id
    and created_at > now() - interval '1 hour';

  if msg_count >= 20 then
    raise exception 'support message rate limit reached (max 20 per hour)';
  end if;

  return new;
end; $$;

drop trigger if exists trg_support_message_rate on public.support_messages;
create trigger trg_support_message_rate before insert on public.support_messages
  for each row execute function public.guard_support_message_rate();

-- Keep the conversation sorted by activity.
create or replace function public.bump_support_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.support_conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end; $$;

drop trigger if exists trg_support_message_bump on public.support_messages;
create trigger trg_support_message_bump after insert on public.support_messages
  for each row execute function public.bump_support_conversation();

-- ============ realtime ============
alter publication supabase_realtime add table public.support_messages;

-- ============ email_log linkage (admin "new chat" email throttle) ============
alter table public.email_log add column conversation_id uuid
  references public.support_conversations(id) on delete set null;

-- ============ grants ============
-- Default privileges from 0001 already cover new tables; kept explicit for clarity.
grant select, insert, update on public.support_conversations to authenticated, service_role;
grant select, insert, update on public.support_messages to authenticated, service_role;
