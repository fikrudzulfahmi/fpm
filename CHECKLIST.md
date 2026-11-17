# FPM - Checklist Post-Deploy

After `bash deploy.sh` finishes, verify each step below (automated verification runs inside the deploy script; manual checks confirm the app is live and functional end-to-end).

## 1. Health & Container State
- [ ] `docker ps -a | grep staging-fpm` → containers `staging-fpm` and `staging-fpm-queue` up and healthy
- [ ] `curl -fsS https://fpm.backupmate.biz.id/up` → HTTP 200 + `{"status":"ok"}`

## 2. Frontend Assets
- [ ] `ls -1 /opt/homelab/staging/fpm/public/build/assets/ | wc -l` → at least 5 files (manifest.json + versioned CSS/JS)
- [ ] Open browser → `https://fpm.backupmate.biz.id` → no blank page, no Vite dev mode banner, layout and CSS load normally

## 3. Auth & Login Flow
- [ ] Visit `https://fpm.backupmate.biz.id/login`
- [ ] Login as admin: email `admin@fpm.test`, password `fpm2026admin`
- [ ] Redirect to `/dashboard` → no 403, no 404, page title "Dashboard" or similar, navigation links visible (Pendaftaran, Nilai, Event)
- [ ] Logout → redirect back to login

## 4. Claim School Account
- [ ] Logout if authenticated; visit `/klaim`
- [ ] Input NPSN `20514401` → server returns JSON with `"status":"available"` or form step 2 appears
- [ ] If available, fill: email `sekolah1@test.com`, username `sekolah1`, password `test1234`, password_confirmation `test1234`, whatsapp `08123456789`
- [ ] Submit → redirect to `/dashboard`, now logged in as school

## 5. Registration Form (School Role)
- [ ] Navigate to `/daftar`
- [ ] Select a competition from dropdown → category_type `individual` or `group` determines participant row behavior
- [ ] For individual: form shows exactly 1 participant row (NISN, full_name, gender, birth_date)
- [ ] For group: form shows add/remove controls; enforce min/max members from competition config
- [ ] NISN validation on blur: input a valid 10-digit NISN → inline warning if duplicate is found (or no warning if unique)
- [ ] Upload letter (PDF or image), fill companion_name, companion_phone
- [ ] Submit → redirect to `/pendaftaran/{id}` or `/dashboard`, registration record created

## 6. Admin Registration Management
- [ ] Login as admin (`admin@fpm.test` / `fpm2026admin`)
- [ ] Navigate to `/admin/pendaftaran`
- [ ] Filter by status `pending` → pending registrations appear in table
- [ ] Click Lihat on a row → detail page `/admin/pendaftaran/{id}` shows participants, AI status, rejection reason (if any)
- [ ] Approve or reject → status badge updates, flash message confirms

## 7. AI Verification Trigger (Queue Job)
- [ ] Create a new registration via `/daftar` (logged in as school)
- [ ] Watch queue worker log: `docker logs -f staging-fpm-queue`
- [ ] Job `App\Jobs\VerifyLetterWithGemini` appears in log, runs, updates `ai_status` field in DB
- [ ] Refresh admin detail page → AI badge shows `valid`, `warning`, `mismatch`, `error`, or `fallback`

## 8. Score Input & Publish
- [ ] Admin → `/admin/nilai`
- [ ] Select a competition tab/dropdown → table lists approved registrations for that competition
- [ ] Input a score (0-100) for one registration, click Save per row → success message
- [ ] Toggle "Publikasi Nilai" button → `publish_scores` flag flips
- [ ] Visit school dashboard as school account → when publish_scores is on, score and rank appear in registration card

## 9. Certificate PDF Export
- [ ] Admin → `/admin/piagam/{registration_id}` → PDF downloads (mPDF-generated certificate)
- [ ] School → `/sertifikat/{registration_id}` (when `enable_certificates` is on) → same PDF structure, participant certificate type
- [ ] Open PDF → logo, event name, participant name, score/rank (if published), signature placeholder

## 10. Event & Theme Config
- [ ] Admin → `/admin/event`
- [ ] Create new event: event_name "FPM 2027", year 2027, theme primary color #ff5722, secondary #03a9f4
- [ ] Activate the new event → `is_active` flag sets, other events deactivate
- [ ] Refresh any frontend page → event name in header updates, CSS vars reflect new theme colors (inspect element → `--primary-color`, `--secondary-color`)

## 11. Route & URL Mapping
Verify that frontend page components match backend route names:

| Frontend Page                        | Backend Route Name          | URL Path                          |
|--------------------------------------|-----------------------------|-----------------------------------|
| `Auth/Login`                         | `login`                     | `/login`                          |
| `Claim/Index`                        | `klaim.index`               | `/klaim`                          |
| `School/Dashboard`                   | `dashboard`                 | `/dashboard`                      |
| `School/Register`                    | `pendaftaran.create`        | `/daftar`                         |
| `School/RegistrationDetail`          | `pendaftaran.show`          | `/pendaftaran/{id}`               |
| `Admin/Dashboard`                    | `dashboard`                 | `/admin/dashboard` (note: same route key, different guard logic) |
| `Admin/Registration/Index`           | `admin.pendaftaran.index`   | `/admin/pendaftaran`              |
| `Admin/Registration/Show`            | `admin.pendaftaran.show`    | `/admin/pendaftaran/{id}`         |
| `Admin/Score/Index`                  | `admin.nilai.index`         | `/admin/nilai`                    |
| `Admin/Event/Index`                  | `admin.events.index`        | `/admin/event`                    |

Manually navigate to each URL; ensure no 404, no "Component not found" errors.

## 12. Env & Config Sanity
- [ ] `docker exec staging-fpm php artisan config:cache` → no errors
- [ ] `docker exec staging-fpm php artisan route:list | grep admin.pendaftaran.index` → route present
- [ ] `docker exec staging-fpm php artisan tinker --execute='echo config("services.gemini.model");'` → prints `gemini-3.5-flash` or similar

## Notes
- **AI verification requires valid `GEMINI_API_KEY`** in `.env`; if missing, the job will fail silently or mark AI status as `error`.
- **CSS theme vars** are injected from shared Inertia prop `theme` (primary, secondary) in `AppLayout.jsx`.
- **All route URLs must match backend Laravel route definitions** (no English `/register`, `/admin/registrations` — backend uses Indonesian names `/daftar`, `/admin/pendaftaran`).
- **NISN validation endpoint** is `/api/nisn-check?nisn=X&competition_id=Y` (GET, throttled).
- **Session domain** is `.fpm.backupmate.biz.id` (cookie shares across `fpm.backupmate.biz.id` and any future subdomains).
