-- 0007_cats_delete_policy.sql
-- Restricts DELETE privilege on cats to owners of never-published listings in draft, pending, or rejected status.

create policy cats_delete_owner on public.cats for delete
  using (
    owner_id = auth.uid()
    and published_at is null
    and status in ('draft','pending','rejected')
  );
