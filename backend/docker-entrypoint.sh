#!/bin/bash
set -e

echo "Mengaktifkan mode optimasi Laravel untuk Produksi..."

# Jalankan migrasi database paksa (karena di Docker/Produksi)
php artisan migrate --force

# Konfigurasi Cache agar Cepat!
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Setel izin folder storage (jaga-jaga jika ter-reset)
chown -R www-data:www-data /var/www/html/storage
chmod -R 775 /var/www/html/storage

echo "Konfigurasi Laravel siap! Menyalakan PHP-FPM utama..."
# Eksekusi argumen CMD dari Dockerfile (php-fpm)
exec "$@"
