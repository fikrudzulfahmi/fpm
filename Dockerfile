FROM backupmate/laravel-frankenphp:8.4

WORKDIR /app
ENV SERVER_NAME=":80"
ENV CADDY_GLOBAL_OPTIONS="auto_https off"
EXPOSE 80
