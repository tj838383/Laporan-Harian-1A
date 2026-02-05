-- Create a new table for structured Tomorrow Plans
CREATE TABLE public.report_tomorrow_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
    plan_description TEXT NOT NULL,
    responsible_person TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.report_tomorrow_plans ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (COPY FROM report_tasks)
CREATE POLICY "Users can manage tomorrow plans on their reports"
ON public.report_tomorrow_plans FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.daily_reports 
        WHERE id = report_id AND (
            creator_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Supervisor', 'Manager', 'Owner'))
        )
    )
);

-- Index for performance
CREATE INDEX idx_tomorrow_plans_report ON public.report_tomorrow_plans(report_id);
