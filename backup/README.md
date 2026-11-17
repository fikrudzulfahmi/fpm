# Backup berkas sebelum perubahan

Folder ini menyimpan salinan berkas asli sebelum diubah, supaya perubahan bisa
dibatalkan kapan saja tanpa bergantung pada riwayat git.

## Struktur

```
backup/
├─ backup-file.sh              skrip pencadang
├─ 2026-11-17_093700/          satu folder per sesi perubahan
│  ├─ resources/js/Pages/Guest/Landing.jsx
│  └─ app/Models/Event.php
```

Path di dalam folder sesi sama persis dengan path di proyek, jadi rollback
cukup menyalin balik:

```bash
cp -r backup/2026-11-17_093700/. .
```

## Mencadangkan berkas baru

```bash
bash backup/backup-file.sh resources/js/Pages/Guest/Lomba.jsx app/Http/Controllers/AuthController.php
```

Semua berkas dalam satu pemanggilan masuk ke folder sesi yang sama
(`BACKUP_STAMP=nama-folder` bisa dipakai untuk menentukannya sendiri).

## Catatan

- Folder ini ikut ter-commit supaya cadangan tetap ada di server/klon lain.
- Berkas yang belum pernah ada (mis. middleware baru) tidak perlu dicadangkan;
  rollback-nya cukup dihapus.
