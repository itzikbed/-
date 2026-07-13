-- 0003_cat_video.sql
-- Add video_path to cats table to support living cat cards

ALTER TABLE public.cats ADD COLUMN video_path text;
