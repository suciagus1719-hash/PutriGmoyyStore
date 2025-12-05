# Putri Gmoyy Sosmed (Versi Midtrans QRIS / GoPay)

Proyek ini berisi dua folder:

- `docs/` -> untuk **GitHub Pages** (static website).
- `backend/` -> untuk **Vercel** (API ke panel & Midtrans).

## 1. Frontend (GitHub Pages)

1. Buat repository baru di GitHub.
2. Upload isi folder `docs/` (folder ini sudah berisi website statis).
3. Aktifkan GitHub Pages dari branch `main` (atau `gh-pages`).
4. Edit file `docs/index.html`:
   - Ubah `window.API_BASE_URL = "https://your-vercel-app.vercel.app";`
     menjadi URL API Vercel kamu.

## 2. Backend (Vercel)

1. Buat project baru di Vercel.
2. Deploy folder `backend/` sebagai project.
3. Di menu **Settings -> Environment Variables**, tambahkan:

   - `SMM_PANEL_API_URL`
   - `SMM_PANEL_API_KEY`
   - `SMM_PANEL_SECRET`
   - `MIDTRANS_SERVER_KEY` (server key Midtrans kamu)
   - `MIDTRANS_SNAP_BASE_URL` (optional, default: `https://app.sandbox.midtrans.com`)
   - `PUBLIC_FRONTEND_URL` (optional, tidak wajib)

4. Sesuaikan file berikut dengan dokumentasi panel & Midtrans:

   - `backend/api/_smmClient.js`
   - `backend/api/categories.js`
   - `backend/api/services.js`
   - `backend/api/service.js`
   - `backend/api/create-order.js`
   - `backend/api/midtrans-notify.js`
   - `backend/api/register-reseller.js`

5. Di dashboard Midtrans:

   - Atur **Server Key** sesuai ENV.
   - Set **Notification URL** ke:

     `https://YOUR-VERCEL-DOMAIN/api/midtrans-notify`

   - Aktifkan metode pembayaran **QRIS** dan/atau **GoPay**.

## Alur Order

1. User pilih platform -> kategori -> layanan -> isi target & jumlah.
2. Frontend memanggil `/api/create-order` di Vercel.
3. Vercel membuat transaksi Snap ke Midtrans dan mengembalikan `redirectUrl`.
4. User diarahkan ke halaman Snap Midtrans (akan menampilkan QR dinamis & jumlah).
5. Setelah pembayaran sukses, Midtrans mengirim HTTP Notification ke `/api/midtrans-notify`.
6. Endpoint notification mengirim order ke panel (`action=add`) sehingga pesanan otomatis masuk ke panel.

## Fitur Daftar Reseller

- Di bagian bawah halaman ada form **Daftar Reseller**.
- Frontend mengirim data ke `/api/register-reseller`.
- Endpoint ini contoh-nya mengirim data ke panel dengan `action=register_reseller`.
  - Sesuaikan field & action dengan API panel kamu.
  - Atau ganti logikanya (misalnya kirim email atau simpan database).
