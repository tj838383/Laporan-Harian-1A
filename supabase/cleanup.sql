-- CLEANUP SCRIPT
-- Run this to remove the broken demo users
DELETE FROM public.users WHERE email LIKE '%@demo.com';
DELETE FROM auth.users WHERE email LIKE '%@demo.com';
