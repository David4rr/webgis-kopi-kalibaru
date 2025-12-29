@extends('layouts.app')

@section('title','Tentang — WebGIS Kopi Kalibaru')

@section('content')
<div class="main-container" style="grid-template-columns: 1fr; padding: 28px;">
    <div style="max-width:900px; margin:0 auto;">
        <h2>Tentang Aplikasi</h2>
        <p class="lead">Aplikasi ini bertujuan membantu petani dan manajemen perkebunan kopi untuk memperkirakan produktivitas berdasarkan kondisi lingkungan. Model prediksi dijalankan pada layanan terpisah (FastAPI) dan hasil dapat disimpan ke basis data melalui API Laravel.</p>

        <section class="card" style="padding:18px; margin-top:14px;">
            <h3>Fitur Utama</h3>
            <ul>
                <li>Gambar batas lahan pada peta dan hitung luas otomatis.</li>
                <li>Prediksi produktivitas berbasis model XGBoost (dijalankan via FastAPI).</li>
                <li>Simpan data lahan ke server dan tampilkan ringkasan produktivitas.</li>
            </ul>
        </section>

        <section class="card" style="padding:18px; margin-top:14px;">
            <h3>Catatan Teknis</h3>
            <p>Pastikan layanan model (FastAPI) berjalan dan `window.appConfig.fastapiUrl` mengarah ke alamat yang benar. Jika mengalami masalah CORS, tambahkan middleware CORS pada backend model.</p>
        </section>

        <div style="margin-top:16px; display:flex; gap:12px;">
            <a class="btn btn-primary" href="/bantuan">Bantuan</a>
            <a class="btn btn-secondary" href="/kontak">Kontak</a>
        </div>
    </div>
</div>
@endsection
