# Dokumentasi CCTV Video Wall Management System

Aplikasi **CCTV Video Wall Management System** adalah sebuah aplikasi web internal berarsitektur ultra-ringan yang dirancang khusus untuk live monitoring kamera CCTV. Aplikasi ini menyelesaikan masalah monitoring konvensional yang berat dengan menghilangkan kebutuhan akan server backend kompleks, database, maupun framework frontend yang membebani sistem.

---

## 🌟 Fungsi Utama Aplikasi

1. **Live CCTV Monitoring Ringan (WebRTC)**
   Menampilkan puluhan kamera CCTV secara bersamaan di dalam browser web dengan beban memori dan CPU yang sangat rendah berkat teknologi WebRTC (langsung dari RTSP tanpa transcoding berat).

2. **Custom Layout Designer**
   Pengguna dapat mendesain sendiri grid tata letak kamera (misal: 2x2, 3x3, 4x4) dan bebas menempatkan kamera spesifik di kotak mana pun yang diinginkan.

3. **Manajemen Preset Layout (Penyimpanan Pola)**
   Susunan layout yang sudah dibuat dapat disimpan sebagai "Preset". Preset ini tersimpan di browser (`localStorage`) dan dapat dipanggil kapan saja, diubah, maupun di-backup/di-export. Terdapat juga preset bawaan dari sistem (`presets.json`).

4. **Multi-Monitor Assignment**
   Sistem mendukung minimal dua layar (Monitor 1 dan Monitor 2). Operator dapat dengan mudah menerapkan preset A ke Monitor 1 dan preset B ke Monitor 2 secara bersamaan dari satu dashboard.

5. **Pergantian Layout Real-time (Remote Control)**
   Apabila halaman monitoring sedang terbuka (fullscreen) di layar eksternal, admin dapat mengganti preset layout untuk layar tersebut melalui dashboard utama, dan layar monitor akan otomatis menyesuaikan diri (auto-refresh/sinkronisasi).

6. **Konfigurasi Kamera Mudah Tanpa Coding**
   Kamera baru dapat ditambahkan hanya dengan mengedit dua file teks (`go2rtc.yaml` untuk link RTSP NVR, dan `cameras.json` untuk informasi nama kamera di tampilan web).

---

## 🔄 Alur (Flow) Sistem

### 1. Alur Arsitektur Data (Sistem)
Sistem ini menggunakan **go2rtc** sebagai satu-satunya "jantung" aplikasi (media server sekaligus web server ringan).
- **Dahua NVR (Sumber):** Mengirimkan stream video ringan (H.264 Substream) melalui protokol RTSP.
- **go2rtc (Server):** Menerima protokol RTSP tersebut dan langsung mengubahnya menjadi WebRTC (tanpa proses *transcoding* sehingga sangat hemat CPU). `go2rtc` juga menyajikan file-file HTML/CSS/JS ke browser.
- **Web Browser (Klien):** Menerima WebRTC dan memutarnya melalui tag `<video>` HTML5 standar. Tampilan dibangun menggunakan Vanilla HTML/JS dan CSS Grid. Konfigurasi tersimpan di file statis JSON dan preferensi user disimpan di *localStorage* browser.

### 2. Alur Penggunaan (User Flow)
1. **Menghidupkan Server:** Pengguna menjalankan file `go2rtc.exe`. Sebuah jendela terminal (Command Prompt) akan terbuka dan berjalan di *background*.
2. **Mengakses Dashboard:** Pengguna membuka browser (Chrome/Edge) ke URL `http://localhost:1984` untuk masuk ke halaman Dashboard Utama.
3. **Mendesain Layout (Opsional):** Di tab *Layout Designer*, pengguna membuat susunan kamera (contoh: Pos & Gerbang) lalu menyimpannya sebagai Preset Baru.
4. **Menerapkan ke Monitor:** Di tab *Monitor Control*, pengguna memilih preset yang diinginkan untuk **Monitor 1** atau **Monitor 2**.
5. **Membuka Layar Monitoring:** Pengguna mengklik tombol "Buka Monitoring" untuk tiap monitor. Sebuah pop-up atau tab window baru akan muncul.
6. **Menata Jendela Layar:** Window baru tersebut digeser oleh pengguna ke Layar fisik 1 atau 2, lalu ditekan tombol **F11** agar *Fullscreen*.
7. **Pergantian Cepat:** Sewaktu-waktu operator ingin mengubah tampilan Monitor 1 dari "Gerbang" ke "Gudang", ia cukup membuka Dashboard utama dan mengklik tombol "Terapkan ke Monitor 1" pada preset "Gudang". Tampilan fullscreen di monitor fisik 1 akan langsung berganti tanpa harus menyentuh layar tersebut.

---

## 📁 File Penting
- `go2rtc.exe` : Program inti yang menjalankan server video dan server web.
- `go2rtc.yaml` : File konfigurasi yang menyimpan URL RTSP sensitif ke NVR.
- `web/config/cameras.json` : Daftar identitas kamera, nama area, yang dibaca oleh web (hanya info publik).
- `web/config/presets.json` : Default layout bawaan dari sistem.
