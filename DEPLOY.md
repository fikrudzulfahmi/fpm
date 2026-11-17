# Deployment Report — FPM Staging 1

**Date:** Nov 16, 2026 13:25 UTC  
**Environment:** staging (`fpm.backupmate.biz.id`)  
**Status:** ✅ **Deploy Success** — Backend + Worker Operational

## Components Verified
| Component | Status | Detail |
|-----------|--------|--------|
| Backend (Laravel + FrankenPHP) | ✅ | Build + serve OK, PHP lint clean |
| Database + Migrations | ✅ | 8 tabelas core, seeder 10 schools + events |
| Queue Worker (FrankenPHP) | ✅ | `VerifyLetterJob` processando Gemini Vision API |
| CDN Vite Assets | ✅ | CSS/JS build + manifest OK, load 200 |
| Docker Compose | ✅ | `staging-fpm` + `staging-fpm-queue` up + healthy |

## E2E Test Summary
```
  ✅ 20/27 checks passed
  🛑 7 expected checks não executáveis (features pendentes)
```

### Passing Tests
- Health + asset delivery (Vite CSS/JS)
- Login admin + school (autentikasi OK)
- Dashboard admin (stats + registrations)
- Admin pages (pendaftaran index, nilai index, event index)
- Registration list pagination + detail
- Claim school (NPSN check, create account)
- School dashboard + competition list
- Submit registration (individual + group, multipart)
- NISN duplicate detection (conflict validation)
- Gemini Vision AI verification (job queue processed, mismatch detected)
- Admin score input + ranking calculation
- Score publish toggle
- PDF generation `/admin/piagam/{registration}` (DomPDF)
- Logout

### Expected Failures (Not Yet Implemented)
| Feature | Reason |
|---------|--------|
| Landing page `/` → `Public/Home` | Route pendente (redirect a `/login` para guest) |
| Route `/lomba` → `Public/Competitions` | Route pendente |
| Route `/admin/pendaftaran/{id}/verifikasi` | Implementado como `/setujui` e `/tolak` separados |
| PDF per-participant `/admin/piagam/{reg}/peserta/{pid}` | Endpoint pendente |

## Bugs Fixed Durante Deploy
1. **PDF streamDownload error** — `DomPDF` não tem `streamDownload()`, trocado para `download()`
2. **NPSN validation 10 → 8 digits** — NPSN Indonesia = 8 digits (backend rule + frontend regex + UI labels)

## Outstanding Work (Não-Blocker)
1. Public landing pages (guest harus ver info evento antes de klaim)
2. Route consolidation (verify endpoint + per-participant piagam)
3. Seed letter_path fix (seeder antigo deix NULL, não afeta nova registrasi)

## Next Steps
1. [ ] Implementar Public Landing (routes `/`, `/lomba` tanpa auth)
2. [ ] Endpoint piagam per-participant (individual certificate)
3. [ ] Verifikasi batch manual di admin + re-verify AI
4. [ ] Deployment production checklist

## Deployment Commands Reprodução
```bash
cd /opt/homelab/staging/fpm
bash deploy.sh  # ~3min: npm build + composer install + migrate + optimize + restart
```

## Health Check
```bash
curl -sS https://fpm.backupmate.biz.id/up
# HTTP 200 {"status":"ok"}
```

---
**Deployed by:** Hermes Agent  
**E2E Test:** `/opt/homelab/staging/fpm/.e2e*.py`
