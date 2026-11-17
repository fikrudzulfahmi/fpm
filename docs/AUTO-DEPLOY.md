# Auto-deploy staging FPM

Setiap `git push` ke branch `main` di `https://github.com/fikrudzulfahmi/fpm` otomatis
masuk ke server staging `https://fpm.backupmate.biz.id` dalam <= 60 detik.

## Alur

1. Server menarik `origin/main` tiap 60 detik (`fpm-deploy.timer`).
2. Bila ada commit baru: `reset --hard`, `composer install` (kalau `composer.json/lock` berubah),
   `npm run build`, `php artisan migrate --force`, `optimize:clear`, `storage:link`, restart container.
3. File runtime tidak tersentuh: `.env`, `storage/`, `public/build`, `public/uploads`, `vendor/`, `node_modules/`.

## Batasan

- Hanya branch `main` yang dideploy. Push ke branch lain tidak mengubah staging.
- Migrasi dijalankan otomatis: tulis migrasi yang idempoten/backward-compatible.
- Kalau build gagal, container lama tetap jalan dan error tercatat di log.

## Cek status

```bash
tail -n 20 /opt/homelab/staging/fpm-watch/deploy.log
systemctl --user list-timers fpm-deploy.timer
systemctl --user start fpm-deploy.service   # deploy manual sekarang
```
