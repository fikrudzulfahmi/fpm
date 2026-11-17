# FPM (Festival Pelajar Muslim) - Staging

Laravel 12 + Inertia React + FrankenPHP 8.4  
Event: registrasi lomba, scoring, sertifikat, AI verifikasi surat.

## Stack
- **Backend**: Laravel 12, MySQL 8, Queue worker  
- **Frontend**: Inertia.js 3, React 19, Tailwind CSS v4, Vite 8  
- **Runtime**: FrankenPHP 8.4 (container `staging-fpm` + `staging-fpm-queue`)  
- **Storage**: MariaDB `staging_fpm` di container `shared-mysql`  
- **Routing**: Caddy wildcard `fpm.backupmate.biz.id` → `staging-fpm:80`  
- **AI**: Gemini Vision (`gemini-3.5-flash` + fallback chain) untuk verifikasi surat  

## Deploy
```bash
cd /opt/homelab/staging/fpm
bash deploy.sh
```

Proses:
1. Build image `staging-fpm-app`
2. Build frontend assets via Node 22 Alpine (Vite)
3. Migrate + seed database
4. Cache config/route/view
5. Link storage + set permission
6. Docker Compose up app + queue

Cek health: `curl -fsS https://fpm.backupmate.biz.id/up`

## Env penting
```bash
APP_URL=https://fpm.backupmate.biz.id
DB_HOST=shared-mysql
DB_DATABASE=staging_fpm
SESSION_DOMAIN=.fpm.backupmate.biz.id
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash
GEMINI_FALLBACK_MODELS=gemini-3.5-flash,gemini-3.1-flash-lite,gemini-3.8-flash
```

## Akun pertama
Claim sekolah via `/claim` (input NPSN → isi email/username/password). Backend cek `schools` dari seeder NPSN Dinas.

## Fitur backend sudah ada
- Auth: login sekolah + admin
- Registrations: CRUD, NISN validation + conflict check, AI verification letter, multi-status (pending/approved/rejected), file upload
- Scores: input nilai per peserta, publish toggle, rank calculation
- Events: CRUD event, switch active event, theme config (primary/secondary color)
- Certificates: PDF generator via mPDF, logo + signature placement, templating

## Frontend pages (Inertia React)
- Auth: `Auth/Login`
- Claim: `Claim/Index` (NPSN cek → form claim account)
- School: `School/Dashboard`, `School/Register` (dynamic participant rows, NISN validation), `School/RegistrationDetail`
- Admin: `Admin/Dashboard`, `Admin/Registration/Index` + `Show`, `Admin/Score/Index`, `Admin/Event/Index`

## Batasan resource
- App container: 256MB RAM
- Queue worker: 128MB RAM
- Image base: `backupmate/laravel-frankenphp:8.4` (PHP 8.4 + ext: pdo_mysql, gd, intl, zip, opcache, bcmath, pcntl)

## Logs
```bash
docker logs -f staging-fpm
docker logs -f staging-fpm-queue
```

## Stop
```bash
docker compose down
```
