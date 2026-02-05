-- Create a new table for task attachments
CREATE TABLE public.report_task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.report_tasks(id) ON DELETE CASCADE,
    file_type TEXT CHECK (file_type IN ('image', 'document', 'link')),
    file_url TEXT NOT NULL,
    file_name TEXT, -- Original filename or link title
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.report_task_attachments ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
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

-- Create storage bucket for attachments if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Public access to attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'attachments');
