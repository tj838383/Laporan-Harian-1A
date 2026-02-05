-- =============================================
-- LAPORAN HARIAN - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. USERS TABLE (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    fullname TEXT NOT NULL,
    role TEXT CHECK (role IN ('Staff', 'Supervisor', 'Manager', 'Owner')) DEFAULT 'Staff',
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES public.users(id),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LOCATIONS TABLE
CREATE TABLE public.locations (
    id SERIAL PRIMARY KEY,
    location_name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed locations
INSERT INTO public.locations (location_name) VALUES
    ('Kantor Pusat'),
    ('Sumut-Aceh'),
    ('Hub Medan'),
    ('Aceh Tamiang'),
    ('Aceh Timur'),
    ('Aceh Utara');

-- 3. DEPARTMENTS TABLE
CREATE TABLE public.departments (
    id SERIAL PRIMARY KEY,
    dept_name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed departments
INSERT INTO public.departments (dept_name) VALUES
    ('Posko'),
    ('Gudang'),
    ('Distribusi'),
    ('Transportasi'),
    ('Media Online'),
    ('Media Sosial'),
    ('Proyek');

-- 4. PROJECT TYPES TABLE
CREATE TABLE public.project_types (
    id SERIAL PRIMARY KEY,
    project_name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed project types
INSERT INTO public.project_types (project_name) VALUES
    ('Meunasah'),
    ('Perahu'),
    ('Sosio-Healing'),
    ('Kerjasama'),
    ('Ekonomi'),
    ('Pendidikan'),
    ('Meugang'),
    ('Buka/Sahur Bersama'),
    ('Pesantren Kilat');

-- 5. DAILY REPORTS TABLE
CREATE TABLE public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.users(id),
    location_id INTEGER NOT NULL REFERENCES public.locations(id),
    dept_id INTEGER NOT NULL REFERENCES public.departments(id),
    project_type_id INTEGER REFERENCES public.project_types(id),
    tomorrow_plan TEXT,
    important_notes TEXT,
    
    -- Status tracking
    status TEXT CHECK (status IN ('draft', 'submitted', 'read', 'verified')) DEFAULT 'draft',
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMPTZ,
    
    -- Read tracking
    read_by UUID[] DEFAULT '{}',
    
    footer_text TEXT DEFAULT 'Tj & Team',
    report_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_date ON public.daily_reports(report_date DESC);
CREATE INDEX idx_reports_creator ON public.daily_reports(creator_id);
CREATE INDEX idx_reports_status ON public.daily_reports(status);

-- 6. REPORT TASKS TABLE
CREATE TABLE public.report_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    responsible_person TEXT,
    status TEXT CHECK (status IN ('Selesai', 'Dalam Proses', 'Bermasalah')) DEFAULT 'Dalam Proses',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_report ON public.report_tasks(report_id);

-- 7. REPORT MATERIALS TABLE
CREATE TABLE public.report_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materials_report ON public.report_materials(report_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_materials ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all approved users"
ON public.users FOR SELECT
USING (is_approved = TRUE OR auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Master data policies (everyone can read)
CREATE POLICY "Anyone can view locations"
ON public.locations FOR SELECT TO authenticated
USING (is_active = TRUE);

CREATE POLICY "Anyone can view departments"
ON public.departments FOR SELECT TO authenticated
USING (is_active = TRUE);

CREATE POLICY "Anyone can view project types"
ON public.project_types FOR SELECT TO authenticated
USING (is_active = TRUE);

-- Reports policies
CREATE POLICY "Users can view relevant reports"
ON public.daily_reports FOR SELECT
USING (
    creator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Supervisor', 'Manager', 'Owner'))
);

CREATE POLICY "Users can create reports"
ON public.daily_reports FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creator can update own draft reports"
ON public.daily_reports FOR UPDATE
USING (
    (creator_id = auth.uid() AND status = 'draft') OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Supervisor', 'Manager', 'Owner'))
);

-- Tasks policies
CREATE POLICY "Users can manage tasks on their reports"
ON public.report_tasks FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.daily_reports 
        WHERE id = report_id AND (
            creator_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Supervisor', 'Manager', 'Owner'))
        )
    )
);

-- Materials policies
CREATE POLICY "Users can manage materials on their reports"
ON public.report_materials FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.daily_reports 
        WHERE id = report_id AND (
            creator_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Supervisor', 'Manager', 'Owner'))
        )
    )
);

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================

-- Enable realtime for reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_reports;

-- =============================================
-- TRIGGER: Auto-create user profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, fullname)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'fullname', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
