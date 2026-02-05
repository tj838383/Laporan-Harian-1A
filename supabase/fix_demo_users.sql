-- =============================================
-- FIX DEMO USERS SCRIPT
-- Run this AFTER clicking "Auto-Create" in the app
-- =============================================

-- 1. Force confirm emails (so you can login)
UPDATE auth.users 
SET email_confirmed_at = now(), generated_instance_id = null
WHERE email LIKE '%@demo.com';

-- 2. Set correct roles (because default is Staff)
UPDATE public.users SET role = 'Staff', is_approved = true WHERE email = 'staff@demo.com';
UPDATE public.users SET role = 'Supervisor', is_approved = true WHERE email = 'spv@demo.com';
UPDATE public.users SET role = 'Manager', is_approved = true WHERE email = 'manager@demo.com';
UPDATE public.users SET role = 'Owner', is_approved = true WHERE email = 'owner@demo.com';

-- 3. Verify the result
SELECT email, role, is_approved FROM public.users WHERE email LIKE '%@demo.com';
