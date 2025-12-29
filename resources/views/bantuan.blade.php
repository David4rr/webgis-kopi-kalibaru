@extends('layouts.app')

@section('title','Bantuan — WebGIS Kopi Kalibaru')

@section('content')
<div class="main-container" style="grid-template-columns: 1fr; padding: 28px;">
    <div style="max-width:900px; margin:0 auto;">
        <h2>Bantuan & Panduan</h2>
        <p class="lead">Halaman ini berisi panduan singkat cara menggunakan aplikasi, FAQ, serta kontak jika Anda membutuhkan bantuan lebih lanjut.</p>

        <section class="card" style="padding:18px; margin-top:14px;">
            <h3>Langkah cepat menambah lahan</h3>
            <ol>
                <li>Klik tombol <strong>Gambar Lahan</strong> lalu gambar polygon pada peta.</li>
                <li>Isikan data lingkungan (Elevasi, Suhu, Curah Hujan, Pola Tanam).</li>
                <li>Klik <strong>Generate Prediksi</strong> untuk memanggil model dan mendapatkan estimasi produktivitas (kg).</li>
                <li>Jika prediksi muncul, klik <strong>Simpan</strong> untuk menyimpan lahan ke database.</li>
            </ol>
        </section>

        <section class="card" style="padding:18px; margin-top:14px;">
            <h3>FAQ</h3>
            <div class="faq-item">
                <strong>Apa yang harus saya lakukan jika Generate Prediksi gagal?</strong>
                <p>Periksa Console & Network pada browser untuk melihat error. Pastikan server prediksi (FastAPI) berjalan dan alamat pada pengaturan `fastapiUrl` benar. Jika error CORS muncul, pastikan backend mengizinkan origin aplikasi.</p>
            </div>
            <div class="faq-item" style="margin-top:8px;">
                <strong>Bagaimana menghitung luas lahan?</strong>
                <p>Luas dihitung otomatis setelah Anda menggambar polygon. Nilai disajikan dalam meter persegi dan hektar.</p>
            </div>
            <div class="faq-item" style="margin-top:8px;">
                <strong>Mengapa tombol Simpan tidak aktif?</strong>
                <p>Pastikan semua field wajib telah diisi dan Anda sudah melakukan Generate Prediksi. Nama lahan juga harus unik.</p>
            </div>
        </section>

        <section class="card" style="padding:18px; margin-top:14px;">
            <h3>Dokumentasi singkat</h3>
            <ul>
                <li>Endpoint penyimpanan lahan: <code>/api/lahan</code> (POST)</li>
                <li>Endpoint model prediksi: diatur pada variable `window.appConfig.fastapiUrl`</li>
            </ul>
        </section>

        <div style="display:flex; gap:12px; margin-top:16px;">
            <a class="btn btn-primary" href="/kontak">Hubungi Tim</a>
            <a class="btn btn-secondary" href="/">Kembali ke Peta</a>
        </div>
    </div>
</div>
@endsection
