# Cara Membuat User Manual dari Supabase Dashboard

## Langkah-langkah:

1. **Buka Supabase Dashboard** → Project Anda
2. Klik menu **Authentication** di sidebar
3. Klik tombol **Add user** → **Create new user**
4. Isi form:
   - **Email**: `manager@demo.com`
   - **Password**: `123456`
   - **Auto Confirm User**: ✅ **CENTANG INI** (penting!)
5. Klik **Create user**

6. Setelah user terbuat, buka **SQL Editor** dan jalankan:
   ```sql
   -- Update role dan approval
   UPDATE public.users 
   SET role = 'Manager', 
       is_approved = true,
       fullname = 'Citra Manager'
   WHERE email = 'manager@demo.com';
   ```

7. **Coba login** di aplikasi dengan:
   - Email: `manager@demo.com`
   - Password: `123456`

## Ulangi untuk user lain jika perlu:
- `staff@demo.com` → Role: 'Staff'
- `spv@demo.com` → Role: 'Supervisor'  
- `owner@demo.com` → Role: 'Owner'
