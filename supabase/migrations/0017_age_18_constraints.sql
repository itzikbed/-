-- 0017_age_18_constraints.sql — tighten the DB age floor from 16 to 18.
-- The app has enforced 18+ since 2026-07-18 (legal review); this closes the
-- defense-in-depth gap at the database. Go-forward (`not valid`) per the
-- 0008 pattern: new writes are enforced, existing rows are not re-checked
-- (the app never allowed <18, so none should exist).
-- PROD: apply manually in the Supabase SQL editor (migrations never run on deploy).

alter table public.profiles
  drop constraint if exists profiles_age_check;
alter table public.profiles
  add constraint profiles_age_check
  check (age between 18 and 120) not valid;

alter table public.adopter_profiles
  drop constraint if exists adopter_profiles_age_check;
alter table public.adopter_profiles
  add constraint adopter_profiles_age_check
  check (age between 18 and 120) not valid;
