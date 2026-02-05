-- Fix Foreign Keys for Double Verification
-- The previous migration referenced auth.users, but the application queries public.users
-- This script changes the references to public.users so joins work correctly.

BEGIN;

-- 1. Drop the incorrect constraints (if they exist with default names or explicit names)
-- attempting to drop by likely generated names
ALTER TABLE public.daily_reports 
    DROP CONSTRAINT IF EXISTS daily_reports_approved_by_spv_fkey,
    DROP CONSTRAINT IF EXISTS daily_reports_approved_by_manager_fkey;

-- 2. Add the correct constraints referencing public.users
ALTER TABLE public.daily_reports
    ADD CONSTRAINT daily_reports_approved_by_spv_fkey 
    FOREIGN KEY (approved_by_spv) REFERENCES public.users(id),
    
    ADD CONSTRAINT daily_reports_approved_by_manager_fkey 
    FOREIGN KEY (approved_by_manager) REFERENCES public.users(id);

-- 3. Ensure indexes exist (from previous migration, but good to ensure)
CREATE INDEX IF NOT EXISTS idx_reports_approved_spv ON public.daily_reports(approved_by_spv);
CREATE INDEX IF NOT EXISTS idx_reports_approved_manager ON public.daily_reports(approved_by_manager);

COMMIT;
