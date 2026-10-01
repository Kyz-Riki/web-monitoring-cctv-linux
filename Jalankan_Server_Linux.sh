#!/bin/bash
# Pindah ke direktori tempat script ini berada
cd "$(dirname "$0")"

# Pastikan binary go2rtc bisa dieksekusi
chmod +x go2rtc_linux_amd64

echo "================================================="
echo "        SERVER CCTV VIDEO WALL (go2rtc)          "
echo "================================================="
echo "Server sedang berjalan..."
echo "Tutup jendela terminal ini untuk mematikan server."
echo "================================================="

# Buka browser setelah 2 detik (berjalan di background)
(sleep 2 && xdg-open http://localhost:1984 2>/dev/null) &

# Jalankan server go2rtc di foreground
./go2rtc_linux_amd64
