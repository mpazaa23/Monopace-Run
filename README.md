# MONOPACE // OS

Dashboard produktivitas dan kalkulator *pace* lari bergaya **Swiss Monochrome** yang dirancang untuk rutinitas aktif harian. Seluruh data berjalan secara *offline-first* langsung di browser menggunakan `localStorage` tanpa perlu login atau koneksi server.

---

## ✨ Fitur Utama

- **01 // Running Pace & Race Predictor**
  - Menghitung *average pace* (`/km`) dan kecepatan (`km/h`) secara *real-time* lengkap dengan tombol preset cepat (`3K Shakeout`, `5K Parkrun`, `10K Race`, `21.1K HM`).
  - Klasifikasi zona latihan otomatis mulai dari **Zone 2 (Easy / Kalcer Run)** hingga **Zone 5 (VO2 Max)**.
  - Estimasi catatan waktu finis `5K`, `10K`, `Half Marathon`, dan `Marathon` menggunakan **Rumus Riegel** ($T_2 = T_1 \times (D_2 / D_1)^{1.06}$).
- **02 // Deep Lock-In Timer**
  - Timer fokus dengan pilihan mode `25m Pomodoro`, `50m Lock-In`, dan `10m Cool Down`.
  - Dilengkapi penghitung sesi selesai dan notifikasi nada sintesis bawaan browser (*Web Audio API*) tanpa membutuhkan file audio eksternal.
- **03 // Weekly Mileage Tracker**
  - Pencatatan log riwayat lari langsung dari kalkulator dengan target jarak mingguan yang dapat diubah sesuai kebutuhan serta *progress bar* otomatis.
- **04 // Gen-Z Weekly Habit Matrix**
  - Matriks pelacak konsistensi *habit* harian (Senin–Minggu) yang mendukung penambahan *custom habit* baru.
- **Offline-First & Adaptive Theme**
  - Sinkronisasi otomatis ke `localStorage` browser serta dukungan tema terang dan gelap (*Light / Dark Mode*).

---

## 🛠️ Tech Stack

- **Frontend:** React (JavaScript / `.jsx`)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Storage & Native API:** Browser `localStorage` & Web Audio API

---

## 📁 Struktur Folder

```text
monopace/
├── public/
├── src/
│   ├── utils/
│   │   └── paceUtils.js    # Logika kalkulasi pace, zona lari, & rumus Riegel
│   ├── App.jsx             # Komponen utama Bento Grid & manajemen state
│   ├── index.css           # Konfigurasi Tailwind CSS
│   └── main.jsx            # Entry point aplikasi
├── index.html
├── package.json
└── tailwind.config.js
```

---

## 🚀 Cara Menjalankan Aplikasi

1. **Kloning repositori**
   ```bash
   git clone [https://github.com/mpazaa23/monopace.git](https://github.com/mpazaa23/monopace.git)
   cd monopace
   ```

2. **Instal dependencies**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173` di browser untuk mulai menggunakan aplikasi.

---

## 👤 Author

**Mafaza Efendi** — [@mpazaa23](https://github.com/mpazaa23)