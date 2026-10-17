-- ============================================================================
-- ATTENDANCE, DOCTOR VISITS, AND SCHEDULE MANAGEMENT MIGRATION
-- Optimized for low DB bloat, high index efficiency, and geofenced verification
-- ============================================================================

-- 1. DOCTORS / CLINICS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    degrees TEXT,
    specialty TEXT,
    hospital_clinic_name TEXT,
    chamber_address TEXT,
    phone TEXT,
    email TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geofence_radius_meters INTEGER DEFAULT 180, -- 150-200m standard
    visiting_hours TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_branch_id ON public.doctors(branch_id);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON public.doctors(is_active);

-- 2. MONTHLY WORKDAY SETTINGS (Prevents heavy date calculations across ERP)
CREATE TABLE IF NOT EXISTS public.monthly_workdays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    total_calendar_days INTEGER NOT NULL,
    total_working_days INTEGER NOT NULL,
    weekend_days INTEGER DEFAULT 4,
    holiday_count INTEGER DEFAULT 0,
    holiday_dates DATE[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_branch_year_month UNIQUE (branch_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_workdays_branch_year_month ON public.monthly_workdays(branch_id, year, month);

-- 3. DOCTOR VISIT SCHEDULE (Running + up to 2 upcoming months)
CREATE TABLE IF NOT EXISTS public.doctor_visit_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    shift_time TEXT DEFAULT 'morning', -- 'morning', 'evening', 'full_day'
    priority TEXT DEFAULT 'normal', -- 'urgent', 'normal', 'follow_up'
    notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'rescheduled', 'cancelled')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_emp_doc_date_shift UNIQUE (employee_id, doctor_id, schedule_date, shift_time)
);

CREATE INDEX IF NOT EXISTS idx_schedules_emp_date ON public.doctor_visit_schedules(employee_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_branch_date ON public.doctor_visit_schedules(branch_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.doctor_visit_schedules(status);

-- 4. DAILY GENERAL ATTENDANCE (One record per employee per day)
CREATE TABLE IF NOT EXISTS public.daily_attendances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_in_lat DOUBLE PRECISION,
    check_in_lng DOUBLE PRECISION,
    check_in_address TEXT,
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_out_lat DOUBLE PRECISION,
    check_out_lng DOUBLE PRECISION,
    check_out_address TEXT,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'half_day', 'absent', 'on_leave', 'holiday')),
    work_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_emp_attendance_date UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_att_emp_date ON public.daily_attendances(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_daily_att_branch_date ON public.daily_attendances(branch_id, attendance_date);

-- 5. DOCTOR VISIT CHECK-IN VERIFICATIONS (Location-verified check-ins for each scheduled doctor)
CREATE TABLE IF NOT EXISTS public.doctor_visit_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID REFERENCES public.doctor_visit_schedules(id) ON DELETE CASCADE,
    daily_attendance_id UUID REFERENCES public.daily_attendances(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy_meters DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION, -- calculated distance from doctor coordinates
    is_within_geofence BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('verified', 'out_of_range', 'flagged', 'manual_approved')),
    remarks TEXT,
    products_discussed TEXT,
    sample_given TEXT,
    doctor_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_checkins_schedule ON public.doctor_visit_checkins(schedule_id);
CREATE INDEX IF NOT EXISTS idx_visit_checkins_emp_date ON public.doctor_visit_checkins(employee_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_visit_checkins_branch ON public.doctor_visit_checkins(branch_id, visit_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_workdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_visit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_visit_checkins ENABLE ROW LEVEL SECURITY;

-- Permissive policy for authenticated users (can be further restricted by role if desired)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.doctors;
    CREATE POLICY "Enable all for authenticated users" ON public.doctors FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.monthly_workdays;
    CREATE POLICY "Enable all for authenticated users" ON public.monthly_workdays FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.doctor_visit_schedules;
    CREATE POLICY "Enable all for authenticated users" ON public.doctor_visit_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.daily_attendances;
    CREATE POLICY "Enable all for authenticated users" ON public.daily_attendances FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.doctor_visit_checkins;
    CREATE POLICY "Enable all for authenticated users" ON public.doctor_visit_checkins FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;
