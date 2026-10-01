# Panduan Operasional CCTV Video Wall

Panduan ini berisi instruksi cara menjalankan dan mengoperasikan aplikasi **CCTV Video Wall Management System** yang telah dirancang dengan arsitektur ultra-ringan.

Aplikasi ini tidak membutuhkan web server eksternal seperti Apache atau Nginx, dan tidak membutuhkan database. Semuanya ditangani oleh satu program utama yaitu **go2rtc**.

---

## 1. Persiapan Awal (Satu Kali Saja)

Sebelum menjalankan aplikasi untuk pertama kali, pastikan Anda sudah mengunduh **go2rtc**:

1. Buka [Halaman Rilis go2rtc di GitHub](https://github.com/AlexxIT/go2rtc/releases).
2. Unduh versi terbaru untuk Windows (biasanya bernama `go2rtc_win64.zip`).
3. Ekstrak file zip tersebut. Anda akan mendapatkan file `go2rtc.exe`.
4. Pindahkan `go2rtc.exe` ke dalam folder proyek CCTV ini:
   ```
   D:\IT INFRA INTERN\Project\web-cctv-monitor\
   ```
   Sehingga posisi `go2rtc.exe` sejajar dengan file `go2rtc.yaml` dan folder `web`.

---

## 2. Cara Menyalakan Sistem (Start)

Untuk mulai menjalankan live monitoring, ikuti langkah berikut:

### Langkah 1: Jalankan Server (go2rtc)
1. Buka folder `D:\IT INFRA INTERN\Project\web-cctv-monitor`.
2. Klik ganda (double-click) pada file **`go2rtc.exe`**.
3. Sebuah jendela Command Prompt (terminal hitam) akan terbuka. 
   - Biarkan jendela ini tetap terbuka. Ini adalah mesin utama yang menarik stream dari NVR Dahua dan menyediakan antarmuka web.
   - Jika muncul peringatan Windows Defender / Firewall, pilih **Allow access**.

### Langkah 2: Buka Halaman Dashboard
1. Buka web browser (disarankan Google Chrome atau Microsoft Edge).
2. Ketikkan alamat berikut di baris URL:
   👉 **`http://localhost:1984`**
   *(Jika Anda mengakses dari komputer lain di jaringan yang sama, ganti `localhost` dengan IP komputer tempat go2rtc berjalan, misal: `http://192.168.1.50:1984`)*
3. Anda akan melihat halaman **Dashboard CCTV Video Wall**.

---

## 3. Cara Menyiapkan Dua Monitor

Di ruangan pemantauan (monitoring room) yang memiliki 2 layar TV/Monitor, ikuti langkah berikut:

1. Buka Dashboard (`http://localhost:1984`).
2. Pergi ke tab **Monitor Control**.
3. Pastikan Monitor 1 dan Monitor 2 sudah disetel ke Preset yang Anda inginkan (misal: Monitor 1 = "Pos & Gerbang", Monitor 2 = "Gedung Office"). Jika belum, pilih dari dropdown dan klik **Terapkan**.
4. Klik tombol hijau **🔲 Buka Monitoring** pada Monitor 1. Sebuah jendela baru akan terbuka.
5. Geser jendela baru tersebut ke Layar/TV 1, lalu tekan tombol **F11** pada keyboard untuk membuatnya *Fullscreen* (layar penuh tanpa pinggiran browser).
6. Kembali ke Dashboard, lalu klik tombol **🔲 Buka Monitoring** pada Monitor 2.
7. Geser jendela yang baru terbuka ke Layar/TV 2, lalu tekan **F11** untuk *Fullscreen*.

> 💡 **Tips Cepat:** Di tab Monitor Control juga terdapat tombol biru **"🖥️🖥️ Buka Semua Monitor"** untuk langsung membuka kedua jendela sekaligus.

---

## 4. Panduan Penggunaan Halaman Dashboard

### Mengganti Layout secara Cepat (Real-time)
Jika Anda ingin mengganti tampilan yang sedang ditonton oleh operator tanpa menyentuh layar mereka:
1. Buka tab **Preset Layout**.
2. Cari preset yang ingin Anda tampilkan.
3. Klik tombol **→ M1** (Terapkan ke Monitor 1) atau **→ M2** (Terapkan ke Monitor 2).
4. Layar monitor akan otomatis berganti ke susunan kamera yang baru tanpa perlu direfresh (selama monitor dan dashboard masih terbuka).

### Membuat Layout / Preset Baru
1. Buka tab **Layout Designer**.
2. Di bagian tengah, atur ukuran grid (Baris × Kolom) sesuai kebutuhan (misal 4x4 untuk 16 kamera).
3. Di panel sebelah kiri, pilih kamera lalu klik untuk memasukkannya ke dalam kotak (*slot*) di grid.
4. Anda bisa menghapus kamera dari slot dengan meng-klik tombol `✕` merah di pojok kotak.
5. Setelah selesai menyusun, masukkan nama preset di kotak bawah (misal: "Kamera Khusus Malam").
6. Klik **💾 Simpan sebagai Baru**.
7. Preset sekarang tersedia dan bisa diterapkan ke monitor.

### Mengubah (Edit) Layout yang Sudah Ada
1. Buka tab **Preset Layout**.
2. Klik tombol **Edit** pada preset yang ingin diubah.
3. Anda akan diarahkan ke tab Layout Designer dengan susunan kamera yang sudah terisi.
4. Ubah susunan kameranya.
5. Klik **💾 Simpan**.
   *(Catatan: Jika preset ini sedang tampil di layar Monitor, layarnya akan langsung *reload* otomatis menampilkan susunan yang baru Anda ubah!)*

### Mencadangkan (Backup) Preset
Karena preset buatan pengguna disimpan di *browser* (localStorage), ada baiknya Anda rutin mencadangkannya.
1. Di tab **Preset Layout**, klik tombol **📥 Export Semua**.
2. Sebuah file JSON akan terunduh. Simpan file ini di tempat aman.
3. Jika sewaktu-waktu komputer di-reset, Anda cukup klik **📤 Import** lalu pilih file JSON tersebut untuk mengembalikan semua layout Anda.

---

## 5. Cara Mengubah Konfigurasi Kamera (Lanjutan / Admin)

Jika di kemudian hari ada penambahan kamera baru di NVR Dahua, Anda harus memperbarui konfigurasi tanpa menyentuh *source code*.

### A. Menambahkan Stream ke go2rtc
1. Buka file **`go2rtc.yaml`** menggunakan Notepad / VS Code.
2. Tambahkan baris baru di bawah area yang sesuai.
   Format:
   `ID-KAMERA: rtsp://username:password@IP_NVR:554/cam/realmonitor?channel=NOMOR_CHANNEL&subtype=1`
   Contoh:
   `cam-033: rtsp://admin:admin123@192.168.1.200:554/cam/realmonitor?channel=33&subtype=1`
3. Simpan file tersebut, lalu tutup dan jalankan ulang `go2rtc.exe`.

### B. Menambahkan Kamera ke Dashboard
1. Buka folder `web\config\` lalu edit file **`cameras.json`**.
2. Tambahkan satu *block* informasi kamera baru di dalam array `"cameras": [...]`.
   Contoh:
   ```json
   {
     "id": "cam-033",
     "name": "Area Baru",
     "area": "Gedung Factory",
     "channel": 33,
     "stream_id": "cam-033",
     "enabled": true,
     "description": ""
   }
   ```
   *(Pastikan `stream_id` sama persis dengan yang Anda tulis di `go2rtc.yaml`)*
3. Simpan file tersebut, lalu *refresh* (F5) halaman Dashboard di browser. Kamera baru siap digunakan di Layout Designer.

---

## 6. Menghentikan Sistem (Stop)

Untuk mematikan sistem CCTV web ini:
1. Buka jendela hitam (Command Prompt) tempat `go2rtc` berjalan.
2. Tekan **Ctrl + C** pada keyboard, atau cukup klik tombol **Silang (X)** di pojok kanan atas jendela tersebut.
3. Tutup browser Anda. 
