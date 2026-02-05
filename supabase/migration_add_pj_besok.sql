-- Add tomorrow_plan_pj column to daily_reports table
ALTER TABLE public.daily_reports 
ADD COLUMN IF NOT EXISTS tomorrow_plan_pj TEXT;
