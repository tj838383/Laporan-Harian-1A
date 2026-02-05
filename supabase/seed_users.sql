-- =============================================
-- SEED USERS SCRIPT
-- Run this in Supabase SQL Editor to create demo accounts
-- Password for all accounts: 123456
-- =============================================

-- Ensure pgcrypto is enabled for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function to create user if not exists
CREATE OR REPLACE FUNCTION public.create_demo_user(
    user_email text,
    user_password text,
    user_fullname text,
    user_role text
) RETURNS void AS $$
DECLARE
    new_uid uuid;
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        new_uid := gen_random_uuid();
        
        -- Insert into auth.users (Trigger will handle public.users creation)
        INSERT INTO auth.users (
            id,
            instance_id,
            role,
            aud,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            new_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            user_email,
            crypt(user_password, gen_salt('bf')),
            now(), -- Auto confirm email
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('fullname', user_fullname),
            now(),
            now()
        );

        -- Update role and approval status in public.users
        -- (Wait a bit for trigger? No, usage in same transaction might race if trigger is async, 
        -- but in PG triggers are synchronous. Let's force update.)
        UPDATE public.users 
        SET role = user_role, is_approved = TRUE 
        WHERE email = user_email;
        
    ELSE
        -- If exists, just ensure role needs update
        UPDATE public.users 
        SET role = user_role, is_approved = TRUE 
        WHERE email = user_email;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute creation
SELECT public.create_demo_user('staff@demo.com', '123456', 'Andi Staff', 'Staff');
SELECT public.create_demo_user('spv@demo.com', '123456', 'Budi Supervisor', 'Supervisor');
SELECT public.create_demo_user('manager@demo.com', '123456', 'Citra Manager', 'Manager');
SELECT public.create_demo_user('owner@demo.com', '123456', 'Pak Bos Owner', 'Owner');

-- Clean up helper function (optional)
-- DROP FUNCTION public.create_demo_user;
