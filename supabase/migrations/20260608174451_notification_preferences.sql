-- Add notification_preferences JSONB column to profiles
-- Stores per-user notification toggle state so settings survive page refresh.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb
  NOT NULL
  DEFAULT '{"emailNotifications":true,"fileMovementAlerts":true,"overdueReminders":true,"weeklyDigest":false}'::jsonb;
