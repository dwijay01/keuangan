FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Bersihkan APT cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Ekstensi PHP utama untuk Laravel
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Download dan inject composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory ke struktur standard
WORKDIR /var/www/html

# Salin seluruh kode backend
COPY . /var/www/html

# Hapus folder vendor lama (jika ada) dan install deps baru khusus production
RUN rm -rf vendor
RUN composer install --no-dev --optimize-autoloader

# Pastikan folder vital bisa ditulis oleh www-data (nginx worker proxy)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Pasang entrypoint script cerdas untuk automation (migrate dll)
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Script ini akan berjalan ketika container mulai, tugasnya mengeksekusi artisan commands
ENTRYPOINT ["docker-entrypoint.sh"]

# Jalankan server fpm
CMD ["php-fpm"]
