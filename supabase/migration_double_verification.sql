-- Add separate verification columns for Supervisor and Manager

ALTER TABLE public.daily_reports
ADD COLUMN IF NOT EXISTS approved_by_spv UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at_spv TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by_manager UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at_manager TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_approved_spv ON public.daily_reports(approved_by_spv);
CREATE INDEX IF NOT EXISTS idx_reports_approved_manager ON public.daily_reports(approved_by_manager);

-- Update RLS if needed (existing "Supervisor", "Manager" roles should already have access via previous policies)
-- ensuring they can UPDATE the report to set these fields.

-- Note: We will keep the original 'status' column for general state, 
-- but might update it to 'verified_spv', 'verified_manager', or 'completed' based on logic.
