-- =============================================
-- DIAGNOSTIC SCRIPT
-- Check what's actually in the database
-- =============================================

-- 1. Check if users exist in auth.users
SELECT 
    id, 
    email, 
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email LIKE '%@demo.com'
ORDER BY email;

-- 2. Check if users exist in public.users
SELECT 
    id,
    email,
    fullname,
    role,
    is_approved
FROM public.users 
WHERE email LIKE '%@demo.com'
ORDER BY email;
