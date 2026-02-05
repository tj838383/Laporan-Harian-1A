-- 1. Confirm ALL emails (bypass verification)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email IN ('staff@demo.com', 'spv@demo.com', 'manager@demo.com', 'owner@demo.com');

-- 2. Update Roles in Public Users table
-- Staff
UPDATE public.users 
SET role = 'Staff', is_approved = true 
WHERE email = 'staff@demo.com';

-- Supervisor
UPDATE public.users 
SET role = 'Supervisor', is_approved = true 
WHERE email = 'spv@demo.com';

-- Manager
UPDATE public.users 
SET role = 'Manager', is_approved = true 
WHERE email = 'manager@demo.com';

-- Owner
UPDATE public.users 
SET role = 'Owner', is_approved = true 
WHERE email = 'owner@demo.com';

-- Check results
SELECT email, role, is_approved FROM public.users WHERE email LIKE '%@demo.com';
