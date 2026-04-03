# Panduan Deployment ke VPS (Docker & Cloudflare Tunnel)

Dokumen ini berisi tahapan lengkap (*step-by-step*) cara mendeploy aplikasi *Keuangan* dari lingkungan lokal ke *Virtual Private Server* (VPS) secara kokoh dan aman tanpa membuka port (Zero Trust Network Access via Cloudflare).

Arsitektur Docker kita mengemas:
1. `keuangan_web` (Nginx + React App): Menampilkan React SPA dan mengarahkan rute `/api` ke backend.
2. `keuangan_backend` (Laravel PHP-FPM): Mengolah API, kalkulasi, dll.
3. `keuangan_db` (MySQL 8): Menampung semua relasi finansial.

Sistem web (*web container*) diekspos di jaringan internal melalui port `8085`.

---

## Prasyarat VPS Utama
1. **Linux OS** (Ubuntu 20.04/22.04 ke atas disarankan).
2. **Docker & Docker Compose V2** telah terinstall.
3. **Cloudflared (Argo Tunnel)** terinstall dengan konfigurasi domain (misal: `fin.domainanda.com` menunjuk ke service `http://localhost:8085`).

---

## Langkah 1: Kloning & Pengaturan File Lingkungan

Pertama, di dalam VPS Anda, ambil *source code* aplikasi ini menggunakan Git:
```bash
git clone https://github.com/USERNAME/REPO_KEUANGAN.git
cd REPO_KEUANGAN
```

Kemudian, siapkan file `.env` khusus untuk sistem database (*master env* yang akan dibaca oleh Laravel container):
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Ubah nilai di dalam `.env` tersebut (*pastikan sesuai dengan arahan di bawah*):
```env
APP_NAME=Keuangan
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:COPIKAN_DARI_LOCAL_ANDA

# Atur agar sesuai dengan Domain Cloudflare Tunnel Anda
APP_URL=https://fin.domainanda.com
FRONTEND_URL=https://fin.domainanda.com
SANCTUM_STATEFUL_DOMAINS=fin.domainanda.com

# ----------------- DB CONFIG --------------------
# Wajib sesuai dengan docker-compose.yml 
DB_CONNECTION=mysql
DB_HOST=db 
DB_PORT=3306
DB_DATABASE=keuangan
DB_USERNAME=keuangan_user
DB_PASSWORD=keuangan_password
```

## Langkah 2: Proses "Liftoff" 🚀

Masih di dalam folder repository (di sisi yang sama dengan file `docker-compose.yml`), jalankan peluncuran kontainer massal dengan sintaks:
```bash
docker compose up -d --build
```
Proses ini mungkin memakan waktu 5–10 menit untuk pertama kali. Otomasi sistem akan melakukan tugas-tugas berat berikut dengan sendirinya:
1. Mengunduh base OS untuk container.
2. Membangun Node.js (*compile* React via Vite ke format statis).
3. Meng-install Composer dependency production-ready (tanpa package /dev).
4. Menjalankan *script entrypoint* yang berisi `php artisan migrate --force` untuk mendirikan tabel.

## Langkah 3: Verifikasi Log

Tembakkan pantauan terhadap kontainer backend untuk meyakinkan migrasi selesai:
```bash
docker compose logs -f backend
```
*(Status "Konfigurasi Laravel siap! Menyalakan PHP-FPM utama..." adalah tanda hijau keberhasilan.)*

## 🎉 Selesai!
Sekarang Anda cukup membuka browser, masukkan domain Anda (misal: `https://fin.goldendragon.id`), lalu masukkan kredensial login. Semua lalu lintas dari luar diamankan (*encrypted*) hingga berakhir ke portal lokal `8085`!
