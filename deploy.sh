#!/usr/bin/env bash
# Deploy staging FPM ke container staging-fpm (Caddy wildcard -> staging-{subdomain}:80).
set -euo pipefail

cd "$(dirname "$0")"

echo "== 1/6 build image =="
docker compose build

echo "== 2/6 build aset frontend (Vite) =="
if [ ! -d node_modules ]; then
  docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/app" -w /app node:22-alpine \
    sh -c "npm install --no-audit --no-fund"
fi
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/app" -w /app node:22-alpine \
  sh -c "npm run build"

echo "== 3/6 migrate + seed (idempoten) =="
docker compose run --rm --no-deps app php artisan migrate --force
docker compose run --rm --no-deps app php artisan db:seed --force || true

echo "== 4/6 cache config/route/view =="
docker compose run --rm --no-deps app php artisan optimize:clear
docker compose run --rm --no-deps app php artisan config:cache
docker compose run --rm --no-deps app php artisan route:cache
docker compose run --rm --no-deps app php artisan view:cache

echo "== 5/6 storage link + permission =="
docker compose run --rm --no-deps app php artisan storage:link || true
docker compose run --rm --no-deps app sh -c "chown -R www-data:www-data storage bootstrap/cache || true"

echo "== 6/6 up =="
docker compose up -d

sleep 6
docker compose ps
echo "== health =="
curl -fsS -o /dev/null -w "http %{http_code}\n" https://fpm.backupmate.biz.id/up || true
