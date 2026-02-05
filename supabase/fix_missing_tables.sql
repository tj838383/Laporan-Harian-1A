-- =============================================
-- FIX DATABASE SCHEMA - CONSOLIDATED SCRIPT
-- Run this to ensure all features work correctly
-- =============================================

-- 1. Create Tomorrow Plans Table (if not exists)
CREATE TABLE IF NOT EXISTS public.report_tomorrow_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
    plan_description TEXT NOT NULL,
    responsible_person TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Tomorrow Plans
ALTER TABLE public.report_tomorrow_plans ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'report_tomorrow_plans' AND policyname = 'Users can manage tomorrow plans on their reports') THEN
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
    END IF;
END $$;

-- 2. Add PJ for Tomorrow (column in daily_reports)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_reports' AND column_name = 'tomorrow_plan_pj') THEN
        ALTER TABLE public.daily_reports ADD COLUMN tomorrow_plan_pj TEXT;
    END IF;
END $$;

-- 3. Create Task Attachments Table (if not exists)
CREATE TABLE IF NOT EXISTS public.report_task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.report_tasks(id) ON DELETE CASCADE,
    file_type TEXT CHECK (file_type IN ('image', 'document', 'link')),
    file_url TEXT NOT NULL,
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Attachments
ALTER TABLE public.report_task_attachments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'report_task_attachments' AND policyname = 'Users can manage attachments on their reports') THEN
        CREATE POLICY "Users can manage attachments on their reports"
        ON public.report_task_attachments FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.report_tasks rt
                JOIN public.daily_reports dr ON rt.report_id = dr.id
                WHERE rt.id = task_id AND (
                    dr.creator_id = auth.uid() OR
                    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Supervisor', 'Manager', 'Owner'))
                )
            )
        );
    END IF;
END $$;

-- 4. Create Storage Bucket for Attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload attachments') THEN
        CREATE POLICY "Authenticated users can upload attachments"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'attachments');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public access to attachments') THEN
        CREATE POLICY "Public access to attachments"
        ON storage.objects FOR SELECT TO public
        USING (bucket_id = 'attachments');
    END IF;
END $$;
