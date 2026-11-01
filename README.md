# Portfolio

Website portfolio statis dibangun dengan [Astro](https://astro.build). Data project diambil dari Google Sheets saat build, jadi menambah atau mengubah project cukup dari spreadsheet.

## Menjalankan di komputer

Butuh Node.js 22.23 atau lebih baru.

```bash
npm install
npm run dev      # buka http://localhost:4321
npm run build    # hasil ada di folder dist/
npm run preview  # cek hasil build
```

Tanpa `PROJECTS_CSV_URL`, website memakai data contoh dari `src/data/projects.sample.csv`.

## Yang perlu Anda ubah

| Apa | Di mana |
|---|---|
| Nama, peran, tagline, status, about, skill, email, link sosial | `src/data/site.ts` |
| CV | taruh file di `public/resume.pdf` |
| Daftar project | Google Sheets (lihat di bawah) |
| Gambar project | `src/assets/projects/` |
| Domain website | `site` di `astro.config.mjs` |
| Warna aksen | `--accent` di `src/styles/global.css` |

Hapus gambar contoh `contoh-*.webp` di `src/assets/projects/` setelah Anda memasukkan gambar sendiri.

## Mengelola project lewat Google Sheets

Satu baris = satu project. Kolom:

| Kolom | Wajib | Keterangan |
|---|---|---|
| `order` | ya | Angka urutan tampil (1 paling atas) |
| `slug` | ya | ID unik, huruf kecil dan tanda hubung, mis. `toko-online-umkm`. Dipakai untuk link langsung `namaanda.dev/#project-toko-online-umkm` |
| `title` | ya | Nama project |
| `type` | ya | Jenis, mis. Web app, Mobile app, Landing page |
| `year` | ya | 4 digit, mis. 2026 |
| `role` | ya | Peran Anda |
| `summary` | ya | Satu kalimat ringkasan |
| `stack` | ya | Dipisah koma, mis. `Astro, Supabase` |
| `source_url` | ya | Link repo, diawali `https://` |
| `demo_url` | tidak | Kosongkan kalau tidak ada demo; tombol Live demo otomatis disembunyikan |
| `cover` | ya | Nama file gambar utama di `src/assets/projects/` |
| `screenshots` | tidak | Nama file gambar tambahan, dipisah koma |
| `published` | ya | `TRUE` untuk tampil, `FALSE` untuk menyembunyikan tanpa menghapus |

Kalau ada data yang salah (kolom wajib kosong, link tidak valid, slug ganda), build berhenti dan menampilkan baris mana yang perlu diperbaiki. Website yang sedang tayang tidak berubah sampai datanya benar.

Gambar yang namanya tidak ditemukan di `src/assets/projects/` diganti placeholder, dengan peringatan di log build.

### Menghubungkan Google Sheets

1. Buka sheet, lalu **File → Share → Publish to web**.
2. Pilih tab yang berisi data project dan format **Comma-separated values (.csv)**, lalu klik **Publish**.
3. Salin link yang muncul (berakhiran `output=csv`).
4. Masukkan link itu sebagai environment variable `PROJECTS_CSV_URL` di hosting (lihat Deploy). Untuk mencoba di komputer, salin `.env.example` menjadi `.env` lalu isi variabelnya.

Catatan: sheet yang di-publish bisa dibaca siapa pun yang punya link-nya. Jangan taruh data pribadi di tab tersebut.

## Deploy

Contoh memakai Cloudflare Pages. Netlify dan Vercel caranya mirip.

1. Push project ini ke repo GitHub.
2. Di Cloudflare Pages, buat project baru dari repo tersebut. Build command `npm run build`, output folder `dist`.
3. Tambahkan environment variable `PROJECTS_CSV_URL` (link CSV dari langkah di atas). Jika build gagal karena versi Node, tambahkan juga `NODE_VERSION` = `22`.
4. Deploy.

### Memperbarui website setelah mengedit sheet

Website statis dibangun ulang untuk mengambil data terbaru. Dua cara:

- **Deploy hook (langsung):** buat deploy hook di pengaturan build hosting Anda. Simpan URL-nya sebagai bookmark; setiap selesai mengedit sheet, buka atau kirim POST ke URL itu. Contoh: `curl -X POST "<URL deploy hook>"`.
- **Otomatis setiap hari (GitHub Pages):** workflow `.github/workflows/deploy.yml` build dan deploy ke GitHub Pages setiap push ke `main` dan setiap pagi pukul 06.17 WIB. Simpan link CSV sebagai secret repo `PROJECTS_CSV_URL` (GitHub → Settings → Secrets and variables → Actions). Bisa juga dijalankan manual dari tab Actions.

## Struktur

```
src/
  content.config.ts      ambil + validasi data project dari Google Sheets
  data/site.ts           profil dan kontak
  data/projects.sample.csv  data contoh untuk development
  assets/projects/       gambar project
  components/            Sidebar, Projects (grid/list), ProjectDialog (panel detail)
  scripts/main.ts        tema, grid/list, animasi scroll, navigasi aktif, panel detail
  styles/global.css      warna, font, animasi dasar
```

## Fitur

- Dark/light mode, tersimpan di browser
- Tampilan project Grid atau List, dengan animasi perpindahan (View Transitions)
- Panel detail project: Esc atau klik di luar untuk menutup, panah kiri/kanan untuk pindah project, link langsung per project
- Sidebar sticky di desktop, menumpuk di atas pada layar HP
- Konten muncul halus saat di-scroll; semua animasi nonaktif untuk pengguna yang memilih reduced motion
- Gambar otomatis dikompres ke WebP dalam beberapa ukuran
