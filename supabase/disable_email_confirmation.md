# Cara Nonaktifkan Email Confirmation di Supabase

Ini adalah cara termudah untuk mengatasi masalah login:

## Langkah-langkah:

1. Buka **Supabase Dashboard** → project Anda
2. Klik menu **Authentication** di sidebar kiri
3. Klik tab **Providers**  
4. Scroll ke bagian **Email**
5. **NONAKTIFKAN** opsi **"Confirm email"**
6. Klik **Save**

Setelah ini, akun yang dibuat **tidak perlu konfirmasi email** lagi dan bisa langsung login.

## Setelah setting diubah:

Jalankan script berikut di SQL Editor untuk "reset" semua akun demo:

```sql
-- Hapus akun lama yang rusak
DELETE FROM public.users WHERE email LIKE '%@demo.com';
DELETE FROM auth.users WHERE email LIKE '%@demo.com';
```

Lalu klik **"⚡ Auto-Create Demo Users"** di aplikasi lagi.
Sekarang seharusnya bisa langsung login tanpa konfirmasi email.
