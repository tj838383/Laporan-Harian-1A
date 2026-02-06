-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to handle report events
CREATE OR REPLACE FUNCTION handle_daily_report_changes()
RETURNS TRIGGER AS $$
DECLARE
    creator_name TEXT;
    report_location TEXT;
BEGIN
    -- Get Creator Name and Location (for message context)
    SELECT fullname INTO creator_name FROM public.users WHERE id = NEW.creator_id;
    -- We can't easily get location name here without joining, simplified for now.
    
    -- Case 1: New Report Submitted (Notify Supervisors & Managers)
    IF (TG_OP = 'INSERT' AND NEW.status = 'submitted') OR 
       (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'submitted') THEN
        
        INSERT INTO public.notifications (user_id, title, message, type, link)
        SELECT id, 'Laporan Baru', creator_name || ' baru saja mengirim laporan harian.', 'info', '/report/' || NEW.id
        FROM public.users
        WHERE role IN ('Supervisor', 'Manager', 'Owner') AND id != NEW.creator_id;
    END IF;

    -- Case 2: Report Verified by SPV (Notify Creator)
    IF (TG_OP = 'UPDATE' AND OLD.approved_by_spv IS NULL AND NEW.approved_by_spv IS NOT NULL) THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (NEW.creator_id, 'Verifikasi SPV', 'Laporan Anda telah diverifikasi oleh Supervisor.', 'success', '/report/' || NEW.id);
        
        -- Also Notify Managers that it's ready for them?
        INSERT INTO public.notifications (user_id, title, message, type, link)
        SELECT id, 'Butuh Verifikasi Manager', 'Laporan dari ' || creator_name || ' menunggu verifikasi Manager.', 'warning', '/report/' || NEW.id
        FROM public.users
        WHERE role IN ('Manager', 'Owner');
    END IF;

    -- Case 3: Report Verified by Manager (Notify Creator)
    IF (TG_OP = 'UPDATE' AND OLD.approved_by_manager IS NULL AND NEW.approved_by_manager IS NOT NULL) THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (NEW.creator_id, 'Laporan Selesai', 'Laporan Anda telah selesai diverifikasi Manager.', 'success', '/report/' || NEW.id);
    END IF;

    -- Case 4: Report Rejected (Notify Creator)
    IF (TG_OP = 'UPDATE' AND OLD.status != 'rejected' AND NEW.status = 'rejected') THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (NEW.creator_id, 'Laporan Ditolak', 'Laporan Anda ditolak. Silakan cek catatan penting.', 'error', '/report/' || NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_daily_report_changes ON public.daily_reports;
CREATE TRIGGER on_daily_report_changes
    AFTER INSERT OR UPDATE ON public.daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION handle_daily_report_changes();
