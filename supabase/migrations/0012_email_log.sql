-- 0012_email_log.sql
-- Create email_log table to keep audit trails of transactional emails without storing raw email PII.

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  cat_id uuid references public.cats(id) on delete set null,
  request_id uuid references public.adoption_requests(id) on delete set null,
  status text not null check (status in ('sent', 'failed')),
  error_text text,
  created_at timestamptz not null default now()
);

-- Enable RLS and restrict select to admins only
alter table public.email_log enable row level security;

create policy email_log_select on public.email_log for select using (public.is_admin());
