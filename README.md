# Keuangan - Aplikasi Manajemen Finansial Keluarga Modern 🚀

Aplikasi **Keuangan** adalah platform manajemen keuangan premium yang didesain secara spesifik untuk memonitor arus kas rumah tangga dengan berbagai fitur cerdas dan analitik masa depan seperti penghitung otomatis rasio rasional 50/30/20, serta proyektor kalender bebas cicilan (DTI Analyzer).

Aplikasi ini dibangun menggunakan arsitektur modern SPA:
- **Frontend**: React.js + Vite (JavaScript)
- **Backend / APIGateway**: Laravel 11 (PHP 8.2+)
- **Database**: MySQL (Produksi) / SQLite (Pengembangan)
- **Deployment**: Docker + Nginx + Cloudflare Tunnel

---

## 🔥 Fitur Unggulan

1. **Dashboard Eksekutif**: Tampilan visual perbandingan pendapatan vs pengeluaran langsung saat aplikasi dibuka.
2. **Kalkulator Magic 50/30/20**: Membantu menghitung saku wajar harian (discretionary daily budget) yang aman tanpa mengorbankan masa depan atau telat bayar cicilan/tagihan.
3. **Analisis Kredit & DTI Ratio**: Menghitung secara otomatis kapasitas Anda jika ingin mengambil cicilan baru di *bulan proyeksi manapun*, dengan ambang batas rasio sehat 35%.
4. **Kalender Bebas Cicilan**: Tanggal jatuh tempo lunasnya semua cicilan akan tergambar visual seperti *loading bar*.
5. **Timeline Perkembangan Anak**: Fitur catatan penting fase kehidupan emas balita berdasarkan umur dengan notifikasi masuk sekolah (PAUD, TK).

---

## 💻 Struktur Folder

- `/frontend` - Kode sumber React UI. Berisi komponen, page interaktif, dan library charting.
- `/backend` - Logika *server-side*, RESTful API controller, *middleware* dan model *database* relasional.

---

## 🛠️ Menjalankan Lingkungan Lokal (*Development*)

Aplikasi ini menggunakan environment dev yang terbelah: Backend di `port 8000` dan frontend Vite di `port 5173`.

### Backend:
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Deployment ke Server Cloud / VPS
Jika Anda ingin menerbitkan aplikasi ini secara daring, proyek ini sudah siap-Docker (lengkap dengan skrip Nginx API Reverse Proxy dan *auto-build* front-end). 

👉 Silakan merujuk ke panduan komplitnya di **[`DEPLOYMENT.md`](DEPLOYMENT.md)**.
