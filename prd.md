# Product Requirements Document (PRD)
# CCTV Video Wall Management System

**Version:** 2.0.0  
**Status:** Draft  
**Product Type:** Internal Web Application  
**Primary Goal:** Live CCTV monitoring dengan custom layout dan manajemen video wall multi-monitor, menggunakan arsitektur ultra-ringan.

---

## 1. Product Overview

### 1.1 Product Name

CCTV Video Wall Management System

### 1.2 Background

Saat ini terdapat 32 kamera CCTV yang terhubung dan dapat dipantau melalui NVR Dahua. Pemantauan menggunakan aplikasi bawaan atau aplikasi bridge yang tersedia memiliki beban penggunaan yang relatif tinggi, sementara kebutuhan utama operator hanya melihat live feed CCTV.

Jumlah kamera diperkirakan akan terus bertambah. Selain itu, sistem monitoring akan menggunakan dua monitor yang membutuhkan susunan kamera berbeda sesuai area atau kebutuhan operasional.

Diperlukan sebuah aplikasi web internal yang **sangat ringan**, fleksibel, mudah dikonfigurasi, dan mampu mengelola live stream CCTV dalam bentuk video wall — **tanpa overhead backend server, database, atau framework frontend yang berat**.

### 1.3 Problem Statement

Sistem monitoring yang ada memiliki beberapa keterbatasan:

- Penggunaan aplikasi monitoring yang terlalu berat untuk kebutuhan live view.
- Konfigurasi dan pemilihan kamera kurang fleksibel.
- Layout monitoring perlu disesuaikan dengan area tertentu.
- Belum tersedia mekanisme saved layout atau preset yang mudah digunakan.
- Kebutuhan dua monitor memerlukan pengaturan tampilan yang terpisah.
- Jumlah kamera akan bertambah sehingga sistem harus scalable.
- Konfigurasi stream CCTV sebaiknya tidak memerlukan perubahan source code.

### 1.4 Product Vision

Membangun aplikasi web monitoring CCTV yang **ultra-ringan** dan modular, dengan arsitektur seminimal mungkin — hanya media server dan static frontend — sehingga operator dapat mengelola layout, menyimpan preset, serta menerapkan preset ke monitor tertentu dengan mudah.

### 1.5 Prinsip Arsitektur

1. **Minimal moving parts** — hanya go2rtc sebagai satu-satunya server process.
2. **No backend API** — tidak ada server aplikasi terpisah.
3. **No database** — konfigurasi disimpan dalam file statis, preferensi pengguna disimpan di browser.
4. **No heavy framework** — gunakan vanilla HTML/CSS/JS atau framework ultra-ringan.
5. **Zero transcoding** — NVR dikonfigurasi untuk output H.264 yang kompatibel dengan browser.
6. **Browser-native** — manfaatkan fitur bawaan browser (HTML5 Video, CSS Grid, localStorage).

---

## 2. Goals and Objectives

### 2.1 Primary Goals

1. Menyediakan live monitoring CCTV melalui web browser.
2. Mendukung minimal 32 kamera pada tahap awal.
3. Memungkinkan penambahan kamera dengan hanya mengubah file konfigurasi.
4. Menyediakan custom layout untuk menyusun kamera sesuai kebutuhan.
5. Menyediakan fitur penyimpanan layout sebagai preset.
6. Memungkinkan preset diterapkan ke Monitor 1 atau Monitor 2.
7. Mengoptimalkan penggunaan resource komputer dan jaringan secara maksimal.
8. **Menjalankan sistem dengan satu server process saja (go2rtc).**
9. **Menghindari overhead backend API, database, dan framework frontend berat.**

### 2.2 Secondary Goals

- Mendukung jumlah kamera yang lebih besar di masa depan.
- Menyediakan monitoring status kamera.
- Mendukung pergantian layout dengan cepat.
- Menyediakan layout berbeda untuk tiap monitor.
- Menyediakan pengelolaan kamera berdasarkan area.
- Memungkinkan pengembangan fitur auto-rotate layout.

### 2.3 Non-Goals

Fitur berikut tidak menjadi fokus MVP:

- Perekaman video CCTV.
- Playback rekaman historis.
- Pencarian kejadian berdasarkan rekaman.
- Analitik AI atau deteksi objek.
- Face recognition.
- Sistem alarm dan notifikasi keamanan kompleks.
- Pengelolaan konfigurasi NVR secara langsung.
- Penggantian fungsi NVR.
- Transcoding stream.
- Backend API server.
- Database server.

---

## 3. Target Users

### 3.1 Monitoring Operator

Bertugas memantau live CCTV melalui satu atau dua monitor.

Kebutuhan:

- Melihat banyak kamera sekaligus.
- Menggunakan preset layout yang sudah tersedia.
- Mengganti layout dengan cepat.
- Melihat status kamera.
- Membuka satu kamera dalam ukuran besar.

### 3.2 System Administrator

Bertugas mengelola konfigurasi aplikasi.

Kebutuhan:

- Menambahkan kamera baru melalui file konfigurasi.
- Mengubah nama dan area kamera melalui file konfigurasi.
- Mengelola stream path melalui konfigurasi go2rtc.
- Membuat dan mengubah preset layout melalui UI atau file konfigurasi.
- Mengatur konfigurasi monitor.

---

## 4. Product Scope

### 4.1 MVP Scope

MVP wajib menyediakan:

- Konfigurasi kamera berbasis file statis (JSON).
- Konfigurasi stream berbasis file statis (go2rtc YAML).
- Live CCTV Monitoring.
- Custom Grid Layout.
- Saved Layout Presets (via localStorage dan/atau file JSON).
- Monitor Assignment.
- Dukungan minimal dua monitor.
- Status koneksi kamera.
- Auto-reconnect stream.
- Responsive interface untuk desktop monitoring.

### 4.2 Future Scope

- Freeform layout dengan drag dan resize.
- Slot kamera dengan ukuran berbeda.
- Layout rotation otomatis.
- Pengelompokan kamera berdasarkan area.
- Dukungan multi-NVR.
- Dukungan lebih dari dua monitor.
- Health monitoring media server.
- Optional backend API jika kebutuhan meningkat.
- Optional database jika data perlu dikelola secara lebih kompleks.

---

## 5. Functional Requirements

## FR-001 — Camera Configuration

### Description

Sistem harus menyediakan mekanisme untuk mendaftarkan dan mengelola kamera CCTV yang tersedia melalui file konfigurasi statis.

### Requirements

- Daftar kamera didefinisikan dalam file JSON statis (`cameras.json`).
- Setiap kamera memiliki identitas unik.
- Setiap kamera dapat dikategorikan berdasarkan area.
- Kamera memiliki informasi channel NVR.
- Kamera memiliki referensi ke stream ID pada go2rtc.
- Kamera memiliki status enabled atau disabled.
- Penambahan kamera dilakukan dengan mengedit file konfigurasi dan konfigurasi go2rtc.
- Frontend membaca file konfigurasi saat aplikasi dimuat.

### Camera Fields

| Field | Type | Required | Description |
|---|---|---|---|
| id | String | Yes | Identitas unik kamera |
| name | String | Yes | Nama kamera |
| area | String | Yes | Area lokasi kamera |
| channel | Integer | Yes | Nomor channel NVR |
| stream_id | String | Yes | ID stream pada go2rtc |
| enabled | Boolean | Yes | Status aktif kamera |
| description | String | No | Keterangan tambahan |

### Contoh cameras.json

```json
{
  "cameras": [
    {
      "id": "cam-001",
      "name": "Gerbang Utama",
      "area": "Gerbang",
      "channel": 1,
      "stream_id": "cam-001",
      "enabled": true,
      "description": "Kamera utama gerbang masuk"
    },
    {
      "id": "cam-002",
      "name": "Parkiran Depan",
      "area": "Parkiran",
      "channel": 2,
      "stream_id": "cam-002",
      "enabled": true,
      "description": ""
    }
  ]
}
```

### Acceptance Criteria

- Kamera yang didefinisikan dalam file JSON muncul pada daftar kamera di frontend.
- Kamera yang ditandai `enabled: false` tidak ditampilkan sebagai kamera aktif.
- Kamera dapat dipilih pada editor layout.
- Penambahan kamera cukup dengan mengedit `cameras.json` dan `go2rtc.yaml`, lalu refresh browser.

---

## FR-002 — Stream Configuration

### Description

Sistem harus memisahkan konfigurasi sumber stream CCTV menggunakan go2rtc sebagai media server.

### Requirements

- Stream dikonfigurasi pada file `go2rtc.yaml`.
- go2rtc menerima RTSP dari NVR Dahua dan menyediakan WebRTC ke browser.
- Tidak ada transcoding — go2rtc melakukan passthrough.
- NVR Dahua harus dikonfigurasi agar substream menggunakan codec H.264.
- URL RTSP dan kredensial hanya ada di file `go2rtc.yaml` di sisi server.
- Frontend tidak menyimpan atau mengetahui URL RTSP.
- Frontend hanya mengetahui stream ID untuk memanggil WebRTC endpoint go2rtc.
- Substream digunakan untuk tampilan grid.
- Mainstream digunakan untuk tampilan kamera besar (opsional).

### Contoh go2rtc.yaml

```yaml
streams:
  cam-001: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=1
  cam-002: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=2&subtype=1
  cam-003: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=3&subtype=1
  # ... sampai cam-032
  
  # Opsional: mainstream untuk zoom view
  cam-001-main: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0
```

Keterangan RTSP Dahua:

- `channel=N`: channel kamera pada NVR.
- `subtype=0`: mainstream (resolusi tinggi).
- `subtype=1`: substream (resolusi rendah, ringan).

### Konfigurasi NVR Dahua yang Direkomendasikan

| Setting | Substream (Grid) | Mainstream (Zoom) |
|---|---|---|
| Codec | H.264 | H.264 |
| Resolution | D1 (704×576) atau CIF (352×288) | 1080p atau 720p |
| Bitrate | 512 Kbps – 1 Mbps | 2 – 4 Mbps |
| Frame Rate | 15 fps | 25 fps |

> **Penting:** H.264 wajib digunakan agar browser dapat decode secara native tanpa transcoding. H.265 akan menyebabkan transcoding di go2rtc yang sangat membebani CPU.

### Acceptance Criteria

- go2rtc dapat menerima RTSP dari NVR Dahua.
- go2rtc menyediakan WebRTC endpoint tanpa transcoding.
- Frontend dapat memutar stream melalui WebRTC.
- Kredensial NVR tidak terekspos ke browser.
- Penggunaan CPU go2rtc minimal saat passthrough.

---

## FR-003 — Live CCTV Monitoring

### Description

Sistem harus menyediakan halaman utama untuk menampilkan live feed CCTV.

### Requirements

- Sistem dapat menampilkan banyak kamera secara bersamaan dalam grid.
- Sistem mendukung minimal 32 kamera yang terdaftar.
- Setiap kamera ditampilkan dalam sebuah video tile.
- Setiap tile menampilkan nama kamera.
- Setiap tile menampilkan status koneksi.
- Operator dapat memilih kamera untuk tampilan lebih besar (fullscreen tile).
- Operator dapat mengembalikan kamera ke tampilan grid.
- Stream yang gagal harus memiliki mekanisme reconnect otomatis.
- Kamera offline tidak boleh menyebabkan seluruh halaman monitoring gagal.
- Sistem harus mendukung tampilan fullscreen browser.
- Sistem harus menyediakan indikator loading saat stream dimuat.
- Video harus menggunakan atribut `muted`, `autoplay`, dan `playsinline`.

### Acceptance Criteria

- Operator dapat membuka halaman monitoring.
- Kamera yang aktif dapat ditampilkan dalam grid.
- Kamera yang gagal terhubung ditandai offline.
- Kegagalan satu stream tidak menghentikan stream lain.
- Operator dapat memperbesar satu kamera.
- Stream dapat melakukan reconnect secara otomatis.
- Tidak ada audio yang diputar secara default.

---

## FR-004 — Custom Layout Designer

### Description

Sistem harus menyediakan editor layout yang memungkinkan operator atau administrator menyusun kamera sesuai kebutuhan.

### Requirements

- Pengguna dapat memilih jumlah kolom.
- Pengguna dapat memilih jumlah baris.
- Pengguna dapat memilih kamera untuk setiap slot dari daftar kamera.
- Pengguna dapat mengganti kamera pada slot tertentu.
- Pengguna dapat menghapus kamera dari slot.
- Pengguna dapat memindahkan kamera antar-slot.
- Pengguna dapat melihat preview layout sebelum menyimpan.
- Sistem harus mencegah penempatan kamera duplikat dalam satu preset (default MVP).
- Sistem harus menyediakan validasi terhadap slot kosong dan kamera tidak tersedia.
- Editor dibangun menggunakan vanilla HTML/CSS/JS.

### MVP Layout Mode

MVP menggunakan CSS Grid dengan jumlah baris dan kolom yang dapat disesuaikan.

Contoh:

- 1 × 1.
- 2 × 2.
- 3 × 3.
- 4 × 4.
- 5 × 5.
- Custom rows dan columns.

### Future Layout Mode

Freeform layout:

- Drag-and-drop kamera.
- Resize tile.
- Kamera berukuran 2 × 2.
- Kamera utama berukuran besar.
- Posisi kamera bebas dalam grid.

### Acceptance Criteria

- Pengguna dapat membuat layout baru.
- Pengguna dapat memilih kamera dari daftar yang tersedia.
- Pengguna dapat memindahkan kamera.
- Preview sesuai dengan susunan yang dipilih.
- Layout dapat disimpan sebagai preset.
- Seluruh interaksi layout berjalan di browser tanpa request ke backend.

---

## FR-005 — Saved Layout Presets

### Description

Sistem harus memungkinkan pengguna menyimpan konfigurasi layout untuk digunakan kembali.

### Requirements

- Preset disimpan di browser localStorage.
- Preset default dapat didefinisikan dalam file JSON statis (`presets.json`).
- Pengguna dapat membuat preset baru.
- Pengguna dapat memberi nama preset.
- Pengguna dapat mengubah preset.
- Pengguna dapat menduplikasi preset.
- Pengguna dapat menghapus preset.
- Pengguna dapat melihat daftar preset.
- Pengguna dapat melihat jumlah kamera pada preset.
- Pengguna dapat melihat konfigurasi grid.
- Preset harus menyimpan referensi camera ID, bukan URL stream.
- Preset harus tetap valid meskipun jumlah kamera bertambah.
- Kamera yang sudah tidak tersedia harus ditandai pada preset.
- Pengguna dapat mengekspor preset sebagai file JSON.
- Pengguna dapat mengimpor preset dari file JSON.

### Penyimpanan Preset

```
Layer 1: presets.json          → Preset default yang didistribusikan bersama aplikasi
Layer 2: localStorage          → Preset yang dibuat/diedit oleh pengguna (override layer 1)
```

Logika loading:
1. Muat preset dari `presets.json`.
2. Muat preset dari `localStorage`.
3. Preset localStorage menimpa preset dengan ID yang sama dari `presets.json`.
4. Gabungkan keduanya sebagai daftar preset yang tersedia.

### Contoh presets.json

```json
{
  "presets": [
    {
      "id": "preset-luar",
      "name": "Area Luar Gedung",
      "columns": 4,
      "rows": 4,
      "slots": [
        { "position": 0, "camera_id": "cam-001" },
        { "position": 1, "camera_id": "cam-002" },
        { "position": 2, "camera_id": "cam-003" },
        { "position": 3, "camera_id": "cam-004" }
      ]
    },
    {
      "id": "preset-dalam",
      "name": "Area Dalam Gedung",
      "columns": 4,
      "rows": 4,
      "slots": [
        { "position": 0, "camera_id": "cam-017" },
        { "position": 1, "camera_id": "cam-018" }
      ]
    }
  ]
}
```

### Contoh localStorage Structure

```
Key: "cctv_presets"
Value: JSON string berisi array preset yang dibuat pengguna

Key: "cctv_monitor_1_preset"
Value: preset ID yang aktif di Monitor 1

Key: "cctv_monitor_2_preset"
Value: preset ID yang aktif di Monitor 2
```

### Acceptance Criteria

- Preset dapat disimpan dan dipanggil kembali.
- Preset dapat diedit tanpa menghapus preset lain.
- Preset dapat diduplikasi.
- Preset dapat diterapkan ke monitor tertentu.
- Kamera yang dihapus tidak menyebabkan aplikasi crash.
- Sistem memberi informasi jika preset memiliki kamera yang tidak tersedia.
- Preset tetap tersedia setelah browser ditutup dan dibuka kembali (localStorage persisten).
- Preset default dari `presets.json` dapat di-restore jika localStorage dihapus.
- Preset dapat diekspor dan diimpor sebagai file JSON.

---

## FR-006 — Monitor Assignment

### Description

Sistem harus memungkinkan preset layout diterapkan ke monitor tertentu.

### Requirements

- Sistem harus mendukung minimal dua monitor.
- Setiap monitor memiliki identitas unik (Monitor 1, Monitor 2).
- Setiap monitor dapat memiliki layout aktif yang tersimpan di localStorage.
- Pengguna dapat memilih preset untuk Monitor 1.
- Pengguna dapat memilih preset untuk Monitor 2.
- Monitor 1 dan Monitor 2 dapat menggunakan preset berbeda.
- Pengguna dapat mengganti preset yang sedang aktif.
- Pengaturan layout monitor disimpan di localStorage.
- Sistem tidak boleh mengubah layout monitor lain ketika satu monitor diperbarui.
- Sistem menyediakan mode untuk membuka tampilan monitoring khusus pada monitor tertentu melalui URL parameter.

### URL Routing

```
/monitor.html?id=1    → Tampilan monitoring Monitor 1
/monitor.html?id=2    → Tampilan monitoring Monitor 2
/                     → Halaman utama (dashboard/admin)
```

### Acceptance Criteria

- Pengguna dapat memilih Monitor 1.
- Pengguna dapat menerapkan preset ke Monitor 1.
- Pengguna dapat memilih Monitor 2.
- Pengguna dapat menerapkan preset berbeda ke Monitor 2.
- Pengaturan tiap monitor tetap terpisah di localStorage.
- Layout yang aktif dapat dipulihkan saat halaman monitor dibuka kembali.

---

## FR-007 — Multi-Window Monitoring

### Description

Sistem harus menyediakan cara untuk menampilkan monitoring pada dua window browser yang berbeda.

### Requirements

- Pengguna dapat membuka tampilan Monitor 1 di satu window/tab.
- Pengguna dapat membuka tampilan Monitor 2 di window/tab lain.
- Setiap window memiliki identitas monitor berdasarkan URL parameter.
- Setiap window dapat menampilkan preset yang berbeda.
- Window monitoring memiliki mode fullscreen.
- Window monitoring tidak menampilkan menu administrasi secara default.
- Dari halaman utama, pengguna dapat membuka window monitor melalui tombol yang membuka tab/window baru.
- Sistem harus memberikan petunjuk penempatan window pada monitor fisik.

### Acceptance Criteria

- Pengguna dapat membuka dua tampilan monitoring.
- Setiap tampilan dapat ditempatkan pada monitor berbeda.
- Masing-masing tampilan memiliki layout yang sesuai.
- Tampilan monitoring tetap berfungsi setelah masuk fullscreen.

---

## FR-008 — Camera Area and Grouping

### Description

Sistem harus memungkinkan kamera dikelompokkan berdasarkan area atau lokasi.

### Requirements

- Area didefinisikan secara implisit dari field `area` pada setiap kamera di `cameras.json`.
- Pengguna dapat memfilter kamera berdasarkan area pada layout designer.
- Pengguna dapat memilih seluruh kamera pada area tertentu.
- Pengguna dapat membuat layout berdasarkan area.
- Daftar area diekstrak secara otomatis dari data kamera.

### Contoh Area

- Gerbang Utama.
- Parkiran.
- Gudang.
- Kantor.
- Lobi.
- Koridor.
- Loading Area.

### Acceptance Criteria

- Kamera dapat difilter berdasarkan area.
- Pengguna dapat menemukan kamera dengan cepat.
- Kamera dari area tertentu dapat dipilih untuk layout.

---

## FR-009 — Camera Status Monitoring

### Description

Sistem harus menyediakan informasi status koneksi setiap kamera.

### Status

- Online — stream berhasil dimuat.
- Offline — stream gagal dimuat.
- Connecting — stream sedang dimuat pertama kali.
- Reconnecting — stream sedang mencoba reconnect.
- Disabled — kamera dinonaktifkan di konfigurasi.

### Requirements

- Sistem menampilkan status pada setiap video tile.
- Sistem membedakan stream offline dan stream yang sedang loading.
- Sistem melakukan reconnect secara otomatis dengan backoff.
- Status kamera tidak boleh memblokir kamera lain.
- Status ditentukan di frontend berdasarkan event WebRTC connection.

### Acceptance Criteria

- Status kamera dapat dilihat pada monitoring.
- Kamera offline memiliki indikator yang jelas.
- Kamera yang kembali online dapat dimuat kembali.
- Sistem tetap responsif saat terdapat kamera offline.

---

## 6. Non-Functional Requirements

## NFR-001 — Performance

- Antarmuka harus ultra-ringan — hanya HTML, CSS, dan vanilla JavaScript.
- Tidak menggunakan framework frontend berat (React, Vue, Angular).
- Menggunakan native HTML5 `<video>` element untuk playback.
- Tidak ada virtual DOM atau reconciliation overhead.
- CSS `contain: strict` diterapkan pada setiap video tile untuk isolasi rendering.
- Kamera yang tidak terlihat tidak boleh memuat stream secara aktif.
- Substream wajib digunakan untuk tampilan multi-kamera.
- Mainstream hanya digunakan untuk tampilan kamera besar (opsional).
- Tidak ada transcoding — go2rtc melakukan passthrough.
- Tidak ada backend API yang perlu diakses untuk data kamera atau layout.
- File konfigurasi dimuat sekali saat aplikasi dibuka.

### Target Performa

- Halaman monitoring dapat dibuka dalam waktu kurang dari 2 detik pada jaringan lokal.
- UI tetap responsif (60 fps) ketika 16 tile ditampilkan per window.
- Kegagalan satu kamera tidak memengaruhi kamera lain.
- go2rtc menggunakan kurang dari 100 MB RAM untuk 32 stream passthrough.
- Total CPU usage (go2rtc + browser) harus diuji pada perangkat monitoring yang sebenarnya.
- Tidak ada transcoding yang terjadi selama operasi normal.

> Target performa final harus ditentukan setelah pengujian menggunakan spesifikasi PC, resolusi monitor, codec video, dan bitrate stream yang sebenarnya.

---

## NFR-002 — Scalability

- Kamera baru ditambahkan dengan mengedit `cameras.json` dan `go2rtc.yaml`.
- Tidak ada perubahan source code yang diperlukan.
- go2rtc mendukung banyak stream secara simultan.
- Layout menggunakan camera ID sebagai referensi.
- Sistem dapat dikembangkan untuk lebih dari dua monitor.
- Jika kebutuhan meningkat secara signifikan, arsitektur dapat di-upgrade ke model dengan backend API tanpa mengubah frontend secara drastis.

---

## NFR-003 — Security

- Kredensial RTSP hanya ada di file `go2rtc.yaml` di sisi server.
- URL RTSP tidak pernah dikirim ke browser.
- Browser hanya mengetahui stream ID dan WebRTC endpoint go2rtc.
- File `go2rtc.yaml` harus memiliki permission yang ketat (readable hanya oleh service user).
- go2rtc sebaiknya hanya accessible dari jaringan lokal.
- Jika diperlukan, go2rtc dapat dikonfigurasi dengan basic auth.
- Sistem tidak boleh mengekspos NVR secara langsung ke internet.

---

## NFR-004 — Usability

- Operator dapat memahami fungsi utama tanpa pelatihan panjang.
- Nama kamera harus mudah dibaca.
- Layout preset mudah ditemukan.
- Proses menerapkan preset ke monitor maksimal terdiri dari beberapa langkah sederhana.
- Status kamera harus jelas secara visual.
- Tampilan harus dioptimalkan untuk desktop dan dua monitor.
- Mode monitoring harus minim distraksi.
- Administrator dapat menambahkan kamera dengan mengedit file konfigurasi — tanpa memerlukan tools khusus.

---

## NFR-005 — Reliability

- Stream yang gagal harus dapat reconnect otomatis dengan exponential backoff.
- Satu kamera offline tidak boleh menghentikan seluruh sistem.
- Konfigurasi layout (localStorage) harus persisten antar sesi browser.
- Preset default dari `presets.json` dapat di-restore kapan saja.
- go2rtc harus dikonfigurasi untuk auto-restart jika crash.
- Sistem harus menyediakan log error di browser console untuk troubleshooting.

---

## NFR-006 — Simplicity

- Total server-side process yang berjalan hanya **satu** (go2rtc).
- Frontend terdiri dari file statis yang dapat di-serve oleh go2rtc atau web server ringan (nginx/caddy).
- Tidak ada build step yang kompleks — file HTML/CSS/JS langsung siap pakai.
- Konfigurasi seluruh sistem hanya melibatkan dua file: `cameras.json` dan `go2rtc.yaml`.
- Deployment hanya memerlukan satu binary (go2rtc) dan satu folder file statis.

---

## 7. Technical Architecture

### 7.1 High-Level Architecture

```text
+----------------------+
| Dahua NVR            |
| 32+ CCTV Channels    |
+----------+-----------+
           |
           | RTSP (H.264 substream, no transcoding)
           v
+----------------------+
| go2rtc               |
| RTSP → WebRTC        |
| + Static File Server |
+----------+-----------+
           |
           | WebRTC + Static HTML/JS/CSS
           v
+----------------------+
| Browser              |
| Vanilla HTML/JS      |
| CSS Grid Layout      |
| localStorage         |
+----------+-----------+
           |
       +---+---+
       |       |
       v       v
+----------+ +----------+
| Monitor 1| | Monitor 2|
| Window 1 | | Window 2 |
| Layout A | | Layout B |
+----------+ +----------+
```

### 7.2 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript | UI monitoring dan layout |
| Styling | CSS Grid + CSS Custom Properties | Layout dan theming |
| Video | HTML5 `<video>` + WebRTC | Live stream playback |
| Media Server | go2rtc | RTSP → WebRTC passthrough |
| Data Storage | JSON files + localStorage | Konfigurasi dan preferensi |
| Deployment | Server lokal | Operasional internal |

### 7.3 Stream Flow

```text
Dahua NVR
   |
   | RTSP (H.264, substream)
   v
go2rtc (passthrough, zero transcode)
   |
   | WebRTC
   v
Browser <video>
```

### 7.4 Data Flow

```text
cameras.json ──→ Frontend (fetch on load) ──→ Render camera list
presets.json ──→ Frontend (fetch on load) ──→ Merge with localStorage presets
localStorage ──→ Frontend (read on load)  ──→ User presets + monitor config

User Action ──→ Frontend (update state) ──→ Save to localStorage
```

### 7.5 File Structure

```text
web-cctv-monitor/
├── index.html              # Halaman utama (dashboard/admin)
├── monitor.html            # Halaman monitoring (per monitor window)
├── css/
│   ├── main.css            # Styling utama
│   └── monitor.css         # Styling halaman monitoring
├── js/
│   ├── app.js              # Logic halaman utama
│   ├── monitor.js          # Logic halaman monitoring
│   ├── webrtc.js           # WebRTC connection ke go2rtc
│   ├── layout.js           # Layout designer logic
│   ├── presets.js          # Preset management (localStorage)
│   └── config.js           # Load cameras.json dan presets.json
├── config/
│   ├── cameras.json        # Daftar kamera
│   └── presets.json        # Preset default
└── go2rtc.yaml             # Konfigurasi go2rtc (di luar web root)
```

### 7.6 go2rtc Configuration

```yaml
# go2rtc.yaml

api:
  listen: ":1984"

webrtc:
  listen: ":8555"

streams:
  # Substream (untuk grid monitoring)
  cam-001: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=1
  cam-002: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=2&subtype=1
  cam-003: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=3&subtype=1
  cam-004: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=4&subtype=1
  # ... sampai cam-032

  # Opsional: Mainstream (untuk zoom/fullscreen view)
  cam-001-main: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0
  # ...
```

### 7.7 Streaming Constraints

- Browser modern tidak dapat memutar RTSP secara langsung.
- go2rtc mengkonversi RTSP ke WebRTC tanpa transcoding (passthrough).
- H.264 dengan konfigurasi yang kompatibel wajib digunakan.
- H.265 **tidak boleh** digunakan karena akan memaksa transcoding.
- Bandwidth dan kemampuan decoding harus diuji dengan 32 stream aktif.
- WebRTC dipilih karena memiliki latency terendah dibanding HLS/DASH.

---

## 8. Data Model

Data disimpan dalam file JSON statis dan localStorage browser. Tidak menggunakan database.

## 8.1 Camera (cameras.json)

```json
{
  "cameras": [
    {
      "id": "cam-001",
      "name": "Gerbang Utama",
      "area": "Gerbang",
      "channel": 1,
      "stream_id": "cam-001",
      "enabled": true,
      "description": "Kamera utama pintu masuk"
    }
  ]
}
```

## 8.2 Layout Preset (presets.json / localStorage)

```json
{
  "presets": [
    {
      "id": "preset-001",
      "name": "Area Luar Gedung",
      "columns": 4,
      "rows": 4,
      "slots": [
        { "position": 0, "camera_id": "cam-001" },
        { "position": 1, "camera_id": "cam-002" },
        { "position": 2, "camera_id": "cam-003" },
        { "position": 3, "camera_id": "cam-004" }
      ]
    }
  ]
}
```

## 8.3 Monitor State (localStorage)

```json
{
  "monitor_1": {
    "active_preset_id": "preset-001"
  },
  "monitor_2": {
    "active_preset_id": "preset-002"
  }
}
```

## 8.4 User Presets (localStorage)

```json
{
  "user_presets": [
    {
      "id": "user-preset-001",
      "name": "Custom Layout Malam",
      "columns": 3,
      "rows": 3,
      "slots": [
        { "position": 0, "camera_id": "cam-005" },
        { "position": 1, "camera_id": "cam-010" }
      ],
      "created_at": "2026-09-15T00:00:00Z",
      "updated_at": "2026-09-15T00:00:00Z"
    }
  ]
}
```

---

## 9. WebRTC Integration with go2rtc

### 9.1 Connection Flow

```text
Browser                          go2rtc
   |                                |
   |  POST /api/webrtc?src=cam-001  |
   |  Body: { sdp: offer }         |
   |------------------------------->|
   |                                |
   |  Response: { sdp: answer }     |
   |<-------------------------------|
   |                                |
   |  WebRTC Media Stream           |
   |<==============================>|
   |                                |
   |  Attach to <video> element     |
   |                                |
```

### 9.2 WebRTC Client Implementation

Frontend harus mengimplementasikan WebRTC client yang:

1. Membuat `RTCPeerConnection`.
2. Menambahkan transceiver untuk video.
3. Membuat SDP offer.
4. Mengirim offer ke go2rtc API (`POST /api/webrtc?src={stream_id}`).
5. Menerima SDP answer dari go2rtc.
6. Set remote description.
7. Menangani ICE candidates.
8. Attach media stream ke `<video>` element.
9. Menangani connection failure dan reconnect.

### 9.3 go2rtc API Endpoints yang Digunakan

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/webrtc?src={stream_id}` | WebRTC signaling (SDP exchange) |
| GET | `/api/streams` | Daftar stream yang tersedia (opsional, untuk debugging) |

> Catatan: Ini adalah API bawaan go2rtc, bukan API custom. Frontend hanya perlu berinteraksi dengan dua endpoint ini.

---

## 10. User Flows

## 10.1 Add New Camera (Administrator)

```text
Administrator
    |
    v
Edit go2rtc.yaml → tambah stream baru
    |
    v
Edit cameras.json → tambah entry kamera baru
    |
    v
Restart go2rtc (atau reload config)
    |
    v
Refresh browser
    |
    v
Kamera baru muncul di daftar kamera
```

## 10.2 Create Saved Layout (Operator)

```text
Operator
    |
    v
Buka Layout Designer
    |
    v
Pilih ukuran Grid (rows × columns)
    |
    v
Pilih kamera untuk setiap slot
    |
    v
Preview layout
    |
    v
Simpan sebagai preset → tersimpan di localStorage
    |
    v
Preset muncul di daftar preset
```

## 10.3 Apply Layout to Monitor (Operator)

```text
Operator
    |
    v
Buka daftar Layout Presets
    |
    v
Pilih preset
    |
    v
Pilih target monitor (Monitor 1 atau Monitor 2)
    |
    v
Klik Apply
    |
    v
localStorage diperbarui
    |
    v
Window monitor memuat layout baru
```

## 10.4 Start Two-Monitor Monitoring (Operator)

```text
Operator
    |
    v
Buka halaman utama
    |
    v
Klik "Open Monitor 1" → membuka /monitor.html?id=1
    |
    v
Klik "Open Monitor 2" → membuka /monitor.html?id=2
    |
    v
Pindahkan setiap window ke monitor fisik yang sesuai
    |
    v
Klik fullscreen pada setiap window
    |
    v
Monitoring aktif pada dua monitor
```

## 10.5 Export/Import Presets (Administrator)

```text
Administrator
    |
    v
Buka halaman utama
    |
    v
Klik "Export Presets" → download file JSON
    |
    v
(Di komputer lain atau setelah reset browser)
    |
    v
Klik "Import Presets" → pilih file JSON
    |
    v
Preset dimuat ke localStorage
```

---

## 11. UI/UX Requirements

### 11.1 Halaman Utama (index.html)

Navigasi dan fungsi:

- Layout Presets — daftar dan kelola preset.
- Layout Designer — buat atau edit layout.
- Monitor Control — assign preset ke monitor dan buka window monitoring.
- Daftar Kamera — lihat kamera yang terdaftar (read-only, data dari `cameras.json`).
- Export/Import — backup dan restore preset.

### 11.2 Halaman Monitoring (monitor.html)

Komponen:

- Video wall (CSS Grid).
- Camera tile (`<video>` element per tile).
- Camera name overlay.
- Camera status indicator.
- Active layout name.
- Monitor identifier.
- Fullscreen control.
- Layout switcher (dropdown preset).
- Reconnect action per tile.

Prinsip:

- Halaman monitoring harus **seminimal mungkin** — fokus pada video.
- Tidak ada sidebar, menu kompleks, atau elemen yang tidak diperlukan.
- Informasi status dan nama kamera ditampilkan sebagai overlay yang tidak mengganggu.
- Warna latar belakang gelap (dark theme) untuk mengurangi distraksi dan kenyamanan mata.

### 11.3 Layout Designer (dalam index.html)

Komponen:

- Camera list (dari `cameras.json`).
- Search camera.
- Filter berdasarkan area.
- Grid size control (rows × columns).
- Grid preview dengan slot.
- Camera assignment (pilih kamera per slot).
- Save preset.
- Reset changes.

### 11.4 Theme

- Dark theme sebagai default — sesuai untuk ruang monitoring.
- Warna aksen untuk status: hijau (online), merah (offline), kuning (connecting/reconnecting), abu-abu (disabled).

---

## 12. Layout Behavior Rules

### 12.1 Camera Assignment

- Satu kamera dapat digunakan pada beberapa preset berbeda.
- Satu kamera dapat muncul pada Monitor 1 dan Monitor 2 secara bersamaan.
- Default MVP: satu kamera hanya muncul satu kali dalam satu preset.
- Kamera yang ditandai `enabled: false` tidak dapat ditambahkan ke layout baru.
- Kamera yang dihapus dari `cameras.json` ditandai sebagai unavailable pada preset lama.

### 12.2 Grid Behavior

- Slot kosong diperbolehkan.
- Slot kosong menampilkan placeholder (ikon kamera atau teks "Empty").
- Perubahan ukuran grid tidak boleh menghapus preset secara otomatis.
- Sistem harus memberikan peringatan jika perubahan grid menyebabkan slot di luar area.
- Pengguna dapat menyimpan perubahan sebagai preset baru.

### 12.3 Monitor Behavior

- Setiap monitor memiliki layout aktif sendiri (disimpan di localStorage).
- Mengubah layout Monitor 1 tidak mengubah Monitor 2.
- Saat window monitoring dibuka, sistem memuat layout aktif monitor tersebut dari localStorage.
- Jika preset tidak tersedia, sistem menampilkan fallback (grid kosong dengan pesan).

### 12.4 Cross-Tab Communication

- Jika operator mengubah preset di halaman utama, window monitoring harus dapat mendeteksi perubahan.
- Gunakan `StorageEvent` pada localStorage untuk sinkronisasi antar tab/window.
- Atau gunakan `BroadcastChannel` API untuk komunikasi antar window.

---

## 13. Performance Strategy

### 13.1 Stream Strategy

- Gunakan substream H.264 untuk seluruh grid monitoring.
- Gunakan mainstream H.264 ketika kamera diperbesar (opsional).
- **Tidak ada transcoding** — go2rtc hanya melakukan passthrough.
- Terapkan reconnect dengan exponential backoff (1s, 2s, 4s, 8s, max 30s).
- Jangan memuat stream kamera yang tidak ada di layout aktif.
- Batasi jumlah stream aktif per window — maksimal 16 tile per window direkomendasikan.

### 13.2 Frontend Strategy

- Gunakan vanilla JavaScript — tidak ada framework overhead.
- Gunakan CSS Grid untuk layout — native browser, sangat efisien.
- Gunakan `contain: strict` pada setiap video tile — isolasi rendering.
- Gunakan `will-change: auto` — hindari premature optimization yang justru membebani GPU.
- Gunakan `<video muted autoplay playsinline>` — hindari audio decode.
- Gunakan `Intersection Observer` untuk lazy loading stream jika jumlah tile besar.
- Minimize DOM manipulation — update hanya elemen yang berubah.
- Gunakan `requestAnimationFrame` untuk animasi, bukan `setInterval`.
- Gunakan event delegation untuk event handling.

### 13.3 Resource Estimation

| Komponen | RAM Estimasi | CPU Estimasi |
|---|---|---|
| go2rtc (32 stream, passthrough) | 30 – 80 MB | < 5% |
| Browser (16 video tiles, substream) | 200 – 500 MB | 10 – 30% |
| Browser (32 video tiles, substream) | 400 – 800 MB | 20 – 50% |
| Total (worst case, 32 tiles) | 500 – 900 MB | 25 – 55% |

> Estimasi ini untuk substream H.264 D1 resolution. Angka sebenarnya harus divalidasi melalui pengujian.

### 13.4 Bandwidth Estimation

| Mode | Per Stream | 16 Streams | 32 Streams |
|---|---|---|---|
| Substream (D1, 512 Kbps) | 0.5 Mbps | 8 Mbps | 16 Mbps |
| Substream (D1, 1 Mbps) | 1 Mbps | 16 Mbps | 32 Mbps |
| Mainstream (1080p, 4 Mbps) | 4 Mbps | 64 Mbps | 128 Mbps |

> Jaringan lokal gigabit (1 Gbps) cukup untuk seluruh skenario di atas.

---

## 14. Security

### 14.1 Credential Protection

- Kredensial RTSP (username/password NVR) hanya ada di `go2rtc.yaml`.
- `go2rtc.yaml` tidak boleh berada di dalam folder yang di-serve ke browser.
- File permission `go2rtc.yaml` harus dibatasi (read-only untuk service user).
- Browser hanya mengetahui stream ID (misalnya `cam-001`), bukan URL RTSP.

### 14.2 Network Security

- go2rtc dan web server hanya accessible dari jaringan lokal.
- NVR tidak boleh diekspos ke internet.
- Jika perlu akses remote, gunakan VPN.
- Firewall harus membatasi port yang terbuka.

### 14.3 Authentication (Opsional untuk MVP)

- MVP dapat berjalan tanpa autentikasi jika hanya digunakan di jaringan internal yang terbatas.
- Jika diperlukan, gunakan basic auth pada web server (nginx/caddy) yang menyajikan file statis.
- go2rtc mendukung konfigurasi basic auth pada API-nya.

---

## 15. Deployment

### 15.1 Deployment Architecture

```text
Local Network
    |
    +-- Dahua NVR (192.168.1.100)
    |     └── 32 CCTV Channels (RTSP, H.264 substream)
    |
    +-- Monitoring Server / PC
          |
          +-- go2rtc (binary)
          |     ├── Listen :1984 (API + WebRTC signaling)
          |     ├── Listen :8555 (WebRTC media)
          |     └── go2rtc.yaml (stream config)
          |
          +-- Static Files (served by go2rtc / nginx / simple HTTP server)
          |     ├── index.html
          |     ├── monitor.html
          |     ├── css/
          |     ├── js/
          |     └── config/
          |           ├── cameras.json
          |           └── presets.json
          |
          +-- Browser (Chrome / Edge)
                ├── Monitor 1 Window → /monitor.html?id=1
                └── Monitor 2 Window → /monitor.html?id=2
```

### 15.2 Deployment Steps

1. Konfigurasi NVR Dahua — pastikan substream H.264.
2. Download go2rtc binary untuk platform yang sesuai.
3. Buat `go2rtc.yaml` dengan semua stream RTSP.
4. Siapkan file statis frontend.
5. Buat `cameras.json` dengan daftar kamera.
6. Buat `presets.json` dengan preset default (opsional).
7. Jalankan go2rtc.
8. Buka browser, akses halaman utama.
9. Buat preset layout.
10. Buka window monitoring untuk setiap monitor.

### 15.3 Serving Static Files

Opsi untuk menyajikan file statis frontend:

1. **go2rtc built-in** — go2rtc dapat menyajikan file statis dari folder tertentu.
2. **Python HTTP server** — `python -m http.server 8080` untuk development/testing.
3. **nginx** — untuk production, ringan dan efisien.
4. **caddy** — alternatif nginx dengan konfigurasi lebih mudah.

### 15.4 Auto-Start

- go2rtc sebaiknya dikonfigurasi sebagai Windows Service atau scheduled task agar otomatis berjalan saat PC dinyalakan.
- Browser dapat dikonfigurasi untuk auto-start dengan URL monitoring.

---

## 16. MVP Milestones

### Phase 1 — Foundation & Stream Testing

- [ ] Download dan setup go2rtc.
- [ ] Konfigurasi `go2rtc.yaml` dengan satu stream RTSP dari NVR Dahua.
- [ ] Pastikan substream NVR menggunakan H.264.
- [ ] Uji playback WebRTC melalui go2rtc built-in player.
- [ ] Uji latency dan kualitas stream.
- [ ] Dokumentasikan konfigurasi stream yang berhasil.
- [ ] Tambahkan seluruh 32 stream ke `go2rtc.yaml`.
- [ ] Uji 32 stream aktif secara bersamaan.

### Phase 2 — Static Frontend & Monitoring

- [ ] Buat `cameras.json` dengan seluruh kamera.
- [ ] Buat `index.html` dan `monitor.html`.
- [ ] Implementasi WebRTC client (`webrtc.js`).
- [ ] Implementasi video tile component.
- [ ] Implementasi CSS Grid layout.
- [ ] Implementasi loading dan status indicator.
- [ ] Implementasi reconnect mechanism.
- [ ] Uji tampilan grid dengan 16 tile.
- [ ] Uji tampilan grid dengan 32 tile.

### Phase 3 — Layout System

- [ ] Implementasi layout designer.
- [ ] Implementasi grid size configuration.
- [ ] Implementasi camera assignment ke slot.
- [ ] Implementasi preview layout.
- [ ] Implementasi save preset ke localStorage.
- [ ] Implementasi load preset dari localStorage dan `presets.json`.
- [ ] Implementasi edit, duplicate, delete preset.
- [ ] Implementasi export/import preset.

### Phase 4 — Multi-Monitor

- [ ] Implementasi URL parameter untuk monitor ID.
- [ ] Implementasi monitor assignment (preset → monitor).
- [ ] Implementasi multi-window mode (open Monitor 1, open Monitor 2).
- [ ] Implementasi cross-tab sync (StorageEvent / BroadcastChannel).
- [ ] Implementasi fullscreen mode.
- [ ] Implementasi restore active layout saat window dibuka.
- [ ] Uji physical two-monitor setup.

### Phase 5 — Polish & Deployment

- [ ] Implementasi camera search dan area filter.
- [ ] Implementasi dark theme.
- [ ] Uji CPU dan RAM pada PC monitoring.
- [ ] Uji network bandwidth.
- [ ] Uji reconnect saat stream terputus.
- [ ] Uji kamera offline.
- [ ] Uji browser compatibility (Chrome, Edge).
- [ ] Setup auto-start go2rtc.
- [ ] Setup auto-start browser.
- [ ] Deploy ke jaringan lokal.
- [ ] Dokumentasi operasional.

---

## 17. Acceptance Criteria

MVP dinyatakan berhasil apabila:

1. Sistem hanya menjalankan satu server process (go2rtc).
2. Tidak ada backend API atau database yang diperlukan.
3. Sistem dapat menampilkan live CCTV dari NVR Dahua melalui browser.
4. Stream menggunakan WebRTC tanpa transcoding (passthrough H.264).
5. Sistem dapat mengelola minimal 32 kamera.
6. Penambahan kamera hanya memerlukan edit `cameras.json` dan `go2rtc.yaml`.
7. Operator dapat membuat layout custom.
8. Operator dapat memilih kamera berdasarkan area.
9. Operator dapat menyimpan layout sebagai preset (localStorage).
10. Preset dapat diedit, diduplikasi, dan dihapus.
11. Preset dapat diterapkan ke Monitor 1.
12. Preset dapat diterapkan ke Monitor 2.
13. Monitor 1 dan Monitor 2 dapat menggunakan layout berbeda.
14. Sistem dapat dibuka dalam dua window monitoring.
15. Stream kamera yang offline tidak menyebabkan aplikasi crash.
16. Sistem dapat melakukan reconnect stream secara otomatis.
17. Kredensial RTSP tidak terekspos pada browser.
18. Sistem tetap responsif saat diuji dengan 32 stream.
19. Preset dapat diekspor dan diimpor sebagai file JSON.
20. Frontend ultra-ringan — vanilla HTML/CSS/JS, tanpa framework berat.
21. Sistem dapat digunakan pada jaringan lokal kantor.

---

## 18. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Codec H.265 pada NVR | High | Konfigurasi substream NVR ke H.264. Jika tidak bisa, go2rtc akan transcode (berat). |
| CPU monitoring tidak cukup untuk 32 stream | High | Gunakan substream resolusi rendah, batasi 16 tile per window, split ke 2 monitor. |
| Bandwidth jaringan tidak cukup | Medium | Turunkan bitrate substream, pastikan jaringan gigabit. |
| localStorage penuh atau hilang | Medium | Sediakan export/import preset. Preset default di `presets.json` sebagai fallback. |
| Stream sering putus | Medium | Implementasi reconnect dengan exponential backoff. |
| go2rtc crash | Medium | Konfigurasi auto-restart (Windows Service). |
| Browser window tidak berpindah otomatis ke monitor | Medium | Sediakan instruksi manual penempatan window. |
| Credential NVR bocor | High | Simpan hanya di `go2rtc.yaml` dengan file permission ketat. |
| Browser tidak support WebRTC | Low | Gunakan browser modern (Chrome/Edge). go2rtc juga support MSE/HLS sebagai fallback. |

---

## 19. Future Enhancements

- Freeform video wall editor (drag-and-drop, resize tile).
- Layout template cepat (1×1, 2×2, 3×3, 4×4, 5×5).
- Layout dengan kamera utama berukuran besar.
- Layout rotation otomatis (auto-cycle preset).
- Jadwal preset berdasarkan waktu.
- Multi-NVR management.
- Dukungan lebih dari dua monitor.
- Health monitoring go2rtc.
- Notifikasi kamera offline (visual/audio alert).
- Snapshot kamera.
- PTZ control (jika kamera mendukung).
- Optional backend API (jika kebutuhan meningkat).
- Optional database (jika data terlalu besar untuk JSON/localStorage).
- Role-based access control.
- Audit log.

---

## 20. Open Questions

Hal-hal berikut perlu dipastikan sebelum implementasi:

1. Berapa spesifikasi PC yang digunakan untuk dua monitor?
2. Berapa resolusi masing-masing monitor?
3. Apakah dua monitor terhubung ke satu PC?
4. Berapa jumlah kamera maksimum yang diperkirakan?
5. Apakah seluruh kamera berasal dari satu NVR Dahua atau beberapa NVR?
6. Apakah substream NVR sudah menggunakan H.264?
7. Apakah monitoring hanya untuk jaringan lokal?
8. Apakah diperlukan autentikasi untuk akses web?
9. Apakah go2rtc akan dijalankan pada PC monitoring atau server terpisah?
10. Apakah perlu fitur auto-rotate layout pada MVP?
11. Apakah satu kamera boleh tampil di beberapa slot dalam satu preset?
12. Apakah perlu dukungan kamera PTZ?

---

## 21. Comparison: Previous Architecture vs Ultra-Light

| Aspek | Arsitektur Sebelumnya (v1) | Ultra-Light (v2) |
|---|---|---|
| Server processes | 3 (MediaMTX + Backend + Database) | 1 (go2rtc) |
| Frontend framework | React + Vite (~50KB gzipped) | Vanilla HTML/JS (~5KB total) |
| Backend | FastAPI / Node.js | Tidak ada |
| Database | SQLite / PostgreSQL | Tidak ada |
| Media server | MediaMTX | go2rtc |
| Data storage | Database tables | JSON files + localStorage |
| Konfigurasi kamera | Via API + Database | Edit JSON file |
| Konfigurasi stream | Via API + Database | Edit YAML file |
| Layout preset | Database | localStorage + JSON file |
| Build step | npm build (Vite) | Tidak ada |
| Deployment complexity | Tinggi (4 komponen) | Rendah (1 binary + static files) |
| RAM server (estimasi) | 200 – 500 MB | 30 – 80 MB |
| Maintenance | Tinggi | Rendah |

---

## 22. Final Product Direction

CCTV Video Wall Management System v2 harus dikembangkan sebagai aplikasi monitoring internal yang mengutamakan:

1. **Ultra-Lightweight:** hanya satu server process (go2rtc), tanpa backend atau database.
2. **Zero Framework:** vanilla HTML/CSS/JS, tanpa React atau framework berat lainnya.
3. **Zero Transcoding:** H.264 passthrough dari NVR ke browser via go2rtc.
4. **Scalable:** kamera dapat bertambah dengan mengedit file konfigurasi.
5. **Configurable:** sumber stream dan metadata kamera dikelola melalui file statis.
6. **Flexible:** operator dapat membuat dan menyimpan layout sendiri.
7. **Multi-monitor:** setiap monitor memiliki preset dan layout aktif masing-masing.
8. **Reliable:** stream yang gagal tidak menghentikan keseluruhan sistem.
9. **Secure:** kredensial NVR hanya ada di file konfigurasi server, tidak pernah sampai ke browser.
10. **Simple to Deploy:** satu binary go2rtc + satu folder file statis.

**Prioritas utama MVP adalah memastikan live stream H.264 dari NVR Dahua dapat ditampilkan secara stabil di browser melalui go2rtc WebRTC, sebelum membangun fitur layout dan preset.**