# JUKU: Revolusi Manajemen Stok Ikan untuk Pelabuhan Paotere 🐟

> *Solusi digital pertama yang dirancang khusus untuk cold storage perikanan di Makassar — sekarang dengan kekuatan AI suara.*

JUKU adalah aplikasi web progresif (PWA) inovatif yang mengoptimalkan pengelolaan inventaris ikan di fasilitas penyimpanan dingin Pelabuhan Paotere, Makassar. Dengan fokus pada **efisiensi**, **akurasi**, dan **kesegaran**, JUKU memberdayakan bisnis perikanan untuk mengambil keputusan lebih cepat dan mengurangi kerugian.

---

## Fitur Utama

### 🗣️ 1. JUKU-Vision: Input Stok Cukup dengan Suara (AI Voice Parser)

Fitur revolusioner yang mengubah cara pencatatan stok ikan. Tidak perlu lagi mengetik — cukup **bicara**, dan JUKU langsung mengerti.

- **Model AI khusus perikanan** — Dilatih secara spesifik untuk memahami kosakata perikanan Indonesia dan nama ikan lokal Makassar
- **Paham dialek lokal** — Ucapkan "Sunu" dan JUKU tahu itu Kerapu. "Bolu" → Bandeng. "Doang" → Udang. "Katombo" → Kembung.
- **Paham angka Indonesia** — "dua puluh lima kilo" → 25 kg. "setengah ton" → 500 kg. "tiga koma lima" → 3.5 kg.
- **Paham kualitas** — "super" atau "premium" → Grade A. "biasa" → Grade B. "rijek" → Grade C.
- **Koreksi otomatis** — Menangani kesalahan umum speech-to-text secara cerdas
- **Visualisasi real-time** — Gelombang suara beranimasi saat merekam, maks 30 detik
- **Review sebelum simpan** — Hasil parsing ditampilkan untuk diperiksa, bisa diedit atau langsung konfirmasi

**Contoh penggunaan:**

> 🎤 *"Cakalang dua puluh lima kilo grade A"*
>
> ✅ Jenis Ikan: **Cakalang** · Berat: **25 kg** · Grade: **A** — Terisi otomatis!

Dua mode input tersedia: **Manual** (formulir 5 langkah) atau **Suara** (bicara → review → konfirmasi).

### ⏱️ 2. Monitoring Kesegaran Real-Time

Pantau kondisi setiap stok ikan secara langsung dengan sistem 3 tingkat:

- **🟢 Segar** — Stok dalam kondisi optimal
- **🟡 Perhatian** — Mendekati batas waktu, perlu diperhatikan
- **🔴 Kritis** — Butuh tindakan segera, animasi peringatan aktif

Perhitungan otomatis berdasarkan waktu berlalu dan masa simpan per spesies. Peringatan proaktif muncul langsung di dashboard saat ada stok kritis.

### 📦 3. Pencatatan Stok yang Efisien

**Stok Masuk** — Formulir 5 langkah terpandu atau input suara:

- Mendukung **24+ spesies ikan** dengan nama lokal Makassarese
- **5 kategori**: Air Tawar, Air Payau, Air Laut, Invertebrata, Tumbuhan Laut
- Sistem penilaian kualitas: **A** (Premium), **B** (Standar), **C** (Ekonomi)
- QR Code otomatis untuk setiap entri stok
- **Swipe-to-confirm** — mencegah pencatatan tidak sengaja

**Stok Keluar** — Sistem FIFO (First In, First Out):

- Pemilik menandai item untuk dikeluarkan, Admin yang mengeksekusi
- Status kesegaran dan sisa waktu simpan ditampilkan real-time

### 📊 4. Dashboard Berbasis Peran

**Pemilik Gudang:**
- Gambaran stok lengkap dengan filter kesegaran
- Tandai item untuk dikeluarkan langsung dari dashboard
- Statistik: total stok, distribusi kesegaran, stok kritis

**Admin Gudang:**
- Ringkasan operasional harian
- Tombol cepat "Catat Ikan Masuk"
- Statistik harian dan feed aktivitas terakhir

### 👥 5. Manajemen Tim & Keamanan

- **Kode Undangan** — Pemilik membuat kode untuk mengundang Admin Gudang baru
- **Alur Persetujuan** — Anggota baru menunggu konfirmasi sebelum bisa akses
- **Autentikasi PIN 4 Digit** — Cepat, aman, tanpa kerumitan password

### ☁️ 6. Offline-First & Sinkronisasi Cloud

- **Beroperasi 100% offline** — Data tersimpan lokal di perangkat
- **Sinkronisasi otomatis** dua arah saat koneksi internet tersedia
- Ideal untuk **lingkungan pelabuhan** dengan konektivitas tidak stabil

### 📱 7. QR Code, Export & Lainnya

- Scan QR Code pada boks ikan atau auto-generate QR baru
- Export stok aktif dan riwayat lengkap ke CSV
- Riwayat transaksi dengan pencarian dan filter
- Katalog ikan kustom — tambah spesies, kategori, atur shelf life
- **PWA** — Instal langsung di smartphone, tanpa App Store

---

## Mengapa JUKU? ✨

| Masalah | Solusi JUKU |
|---------|-------------|
| Pencatatan manual lambat, tangan basah susah nulis | **AI Voice Parser** — cukup bicara, data terisi otomatis |
| AI tidak paham nama ikan lokal | Model AI dilatih khusus untuk kosakata perikanan Makassar |
| Ikan membusuk karena tidak terpantau | Sistem peringatan kesegaran 3 tingkat real-time |
| Tidak ada visibilitas stok untuk pemilik | Dashboard real-time dengan akses dari mana saja |
| Koneksi internet tidak stabil di pelabuhan | Offline-first — berfungsi penuh tanpa internet |
| Komunikasi pemilik-admin tidak efisien | Sistem peran dengan penandaan stok dan notifikasi |
| Tidak ada standar pencatatan | Grading system (A/B/C) dan FIFO otomatis |
| Nama ikan berbeda-beda tiap daerah | Katalog dengan nama lokal Makassarese |

**JUKU mengurangi kerugian, meningkatkan transparansi, dan mempercepat operasional cold storage — bahkan di area dengan konektivitas terbatas.**

---

## Sorotan Teknis

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Next.js 16 App Router + React 19 |
| State Management | Zustand + IndexedDB persistence |
| Database & Sync | Supabase (real-time) |
| AI Voice Parser | FastAPI + faster-whisper (CTranslate2) |
| Model AI | Custom fine-tuned Whisper — `juku-version-3` (HuggingFace) |
| NLP Parser | Indonesian number parser + fuzzy fish name matching |
| Styling | Tailwind CSS 4 + Figma design tokens |
| Autentikasi | PIN-based (zero-dependency, tanpa OAuth) |
| Offline | Service Worker + localforage (IndexedDB) |
| Desain | Mobile-first, responsive |

---

*JUKU — Karena setiap kilogram ikan berharga.* 🐟
