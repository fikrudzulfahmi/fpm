# Roadmap & Status — FPM (Festival Pelajar Muslim)

Target: `https://fpm.backupmate.biz.id` (Caddy → `staging-fpm:80`, Cloudflare Tunnel).
Stack: Laravel 12 + Inertia React 19 + Tailwind v4 + FrankenPHP 8.4, MariaDB `staging_fpm`, queue worker `staging-fpm-queue`, Gemini Vision untuk verifikasi surat.

Status per fase (diverifikasi lewat `php artisan test` + skrip E2E `.e2e*.py` di direktori ini):

## Fase 1 — Fondasi & Identitas Visual — SELESAI
- Skeleton Laravel + Inertia + React, Tailwind v4, komponen shell (AppLayout/GuestLayout).
- Model inti: `events`, `event_settings`, `competitions`, `schools`, `users`, `registrations`, `participants`, `scores`.
- Tema dinamis dari `event_settings` (warna primer/sekunder/aksen + font) disuntik ke CSS variable, tampil di halaman publik dan admin.
- Landing publik: hero, daftar lomba, CTA, info kontak panitia.
- Bukti: `PublicPagesTest` (4 tes) + `.e2e3.py` (landing & `/lomba` render tanpa auth).

## Fase 2 — Akun Sekolah & Pendaftaran — SELESAI
- Klaim akun sekolah via `/klaim` (cek NPSN 8 digit → daftar akun, kunci baris `schools` saat transaksi).
- Formulir `/daftar`: pilih lomba, data pendamping, baris peserta dinamis (individu 1 baris; grup min/max dari konfigurasi lomba).
- Validasi NISN 10 digit, anti-dobel dalam formulir, anti-dobel lintas lomba dalam event yang sama, cek duplikat realtime via `GET /api/nisn-check`.
- Kuota global + kuota per sekolah ditegakkan di server; pendaftaran berstatus `rejected` tidak memakan kuota.
- Unggah surat rekomendasi: hanya `pdf/jpg/png`, ukuran dibatasi, nama file diacak, disimpan di disk privat.
- Bukti: `RegistrationGuardTest` (13 tes, 30 asersi) + `.e2e5.py` (klaim → daftar → pending → approve/reject).

## Fase 3 — Panel Admin & Verifikasi — SELESAI
- CRUD event (aktifkan event, setelan tema/kontak), CRUD cabang lomba (kuota, tipe kategori, min/max anggota, buka-tutup).
- Daftar & detail pendaftaran dengan filter status/lomba, aksi setujui, tolak + alasan, verifikasi ulang AI.
- AI verifikasi surat (Gemini Vision): status `valid` / `mismatch` / `error`, fallback rantai model + timeout terpisah, kegagalan model tidak memblokir alur.
- Surat rekomendasi hanya bisa diunduh pemilik dan admin (`/storage/*` tidak publik).
- Bukti: `.e2e.py` (admin 8 langkah) + `.e2e2.py` (nilai & publikasi) + `.e2e5.py` (privasi surat, tolak beralasan).

## Fase 4 — Penilaian, Publikasi, Sertifikat — SELESAI
- Input nilai per lomba (babak/juri), simpan massal, publikasi hasil sebagai saklar event.
- Papan skor publik hanya menampilkan nilai setelah publikasi dinyalakan.
- Sertifikat peserta & piagam juara (PDF) — piagam menolak registrasi tanpa peringkat (422).
- Bukti: `.e2e.py` langkah 6–7, `.e2e2.py`, `.e2e4.py` (skor tersembunyi saat publikasi mati).

## Fase 5 — Hardening & Serah Terima — SELESAI (butuh 1 keputusan bisnis)
- Rate limit login & NISN check, CSRF pada semua POST, otorisasi per peran (guest/school/admin), hardening nama file unggahan.
- Suite tes: 19 tes / 97 asersi hijau; 5 skrip E2E hijau; tidak ada `ERROR` di `storage/logs/laravel.log` sejak perbaikan.
- Sisa keputusan: apakah NISN boleh ikut lebih dari satu cabang lomba dalam satu event (saat ini ditolak). Jika panitia ingin mengizinkan, ubah `RegistrationGuard::checkNisnBatch()` + sesuaikan tes.
- Data uji (`Tim Uji`, `Peserta Uji`, akun `e2e*`) masih ada di DB staging dan perlu dibersihkan sebelum demo ke panitia.

## Langkah manual tersisa
1. Bersihkan data uji: hapus registrasi/akun `e2e*` + sekolah hasil klaim uji, lalu reset `ai_status` agar dashboard bersih.
2. Ganti kredensial seed admin (`panitia` / `fpm2026admin`) dan hapus akun contoh sebelum publikasi.
3. Putuskan aturan NISN lintas lomba (Fase 5) dan konfirmasi format piagam (nama penandatangan, logo).
4. Uji tampilan di HP asli (formulir peserta grup dengan 6 baris) — belum diuji di perangkat fisik.
