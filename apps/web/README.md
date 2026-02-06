# Laporan Harian Operasional AQL

Aplikasi web Progressive Web App (PWA) untuk manajemen laporan harian operasional, mencakup tracking pekerjaan, material, verifikasi berjenjang, dan notifikasi realtime.

![AQL Logo](/public/icon-192x192.png)

## Fitur Utama

- **Laporan Harian**: Input progres pekerjaan, material, dan dokumentasi foto.
- **Workflow Persetujuan**:
  - Staff (Draft -> Submit)
  - Supervisor (Verifikasi Lapangan)
  - Manager (Verifikasi Akhir/Selesai)
- **Role-Based Access**:
  - **Staff**: Buat laporan, lihat status.
  - **Supervisor**: Verifikasi laporan staff, revisi.
  - **Manager**: Approval final, lihat dashboard statistik.
  - **Owner**: View-only dashboard eksekutif.
- **Offline Support**: Bisa dibuka tanpa internet, data tersimpan di cache.
- **Notifikasi Realtime**: Notifikasi lonceng & browser saat ada laporan baru atau status berubah.
- **Dashboard Statistik**: Grafik performa, filter berdasarkan lokasi/unit, dan pencarian.

## Tech Stack

- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **PWA**: [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Struktur Project

```
apps/web/
├── src/
│   ├── components/     # UI Components (Layout, Forms, Charts)
│   ├── hooks/          # Custom Hooks (useReports, useAuth, useNotifications)
│   ├── pages/          # Page Views (Dashboard, CreateReport, History)
│   ├── stores/         # State Management (Zustand)
│   ├── lib/            # Utilities & Supabase Client
│   └── types/          # TypeScript Definitions
├── supabase/           # SQL Migrations
└── public/             # Static Assets
```

## Cara Menjalankan (Development)

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/project.git
    cd project
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Buat file `.env.local` di folder `apps/web/` dan isi:
    ```env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```

4.  **Jalankan Server**
    ```bash
    npm run dev
    ```
    Aplikasi berjalan di `http://localhost:5173`.

## Deployment

Aplikasi ini siap dideploy ke **Vercel** atau **Netlify**. Pastikan untuk menambahkan Environment Variables di dashboard hosting.

## License

Internal Only - PT AQL
