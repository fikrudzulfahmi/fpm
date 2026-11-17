#!/usr/bin/env bash
# Cadangkan berkas sebelum diubah. Struktur folder di dalam backup/ sama
# dengan struktur proyek, jadi rollback cukup menyalin balik.
#
# Pakai:
#   bash backup/backup-file.sh resources/js/Pages/Guest/Landing.jsx app/Models/Event.php
#
# Hasil: backup/<tanggal_jam>/<path asli>
set -euo pipefail

cd "$(dirname "$0")/.."

stamp="${BACKUP_STAMP:-$(date +%Y-%m-%d_%H%M%S)}"
dest="backup/${stamp}"
created=0

for src in "$@"; do
  if [ ! -f "$src" ]; then
    echo "lewat (tidak ada): $src" >&2
    continue
  fi

  target="${dest}/${src}"
  mkdir -p "$(dirname "$target")"

  # Jangan timpa cadangan pertama pada sesi yang sama.
  if [ -e "$target" ]; then
    echo "sudah ada: $target"
    continue
  fi

  cp -p "$src" "$target"
  echo "cadang: $src -> $target"
  created=$((created + 1))
done

echo "selesai: ${created} berkas di ${dest}"
