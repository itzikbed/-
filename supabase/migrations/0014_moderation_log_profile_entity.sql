-- 0014_moderation_log_profile_entity.sql
-- Allow moderation_log to record profile-level admin actions (admin promotion).

alter table public.moderation_log drop constraint moderation_log_entity_type_check;
alter table public.moderation_log add constraint moderation_log_entity_type_check
  check (entity_type in ('publisher', 'cat', 'request', 'profile'));
