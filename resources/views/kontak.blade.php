@extends('layouts.app')

@section('title','Kontak — WebGIS Kopi Kalibaru')

@section('content')
<div class="main-container" style="grid-template-columns: 1fr; padding: 28px;">
    <div style="max-width:900px; margin:0 auto;">
        <h2>Kontak & Dukungan</h2>
        <p class="lead">Hubungi kami jika Anda memerlukan bantuan teknis atau ingin melaporkan masalah.</p>

        <section class="card" style="padding:18px; margin-top:14px; display:flex; gap:20px; flex-wrap:wrap;">
            <div style="flex:1; min-width:260px;">
                <h4>Tim Pengembang</h4>
                <p><strong>Email:</strong> <a href="mailto:support@example.com">support@example.com</a></p>
                <p><strong>Telepon / WA:</strong> +62 812-3456-7890</p>
            </div>
            <div style="flex:1; min-width:260px;">
                <h4>Alamat</h4>
                <p>Jl. Contoh No.1, Kalibaru, Banyuwangi</p>
            </div>
        </section>

        <section class="card" style="padding:18px; margin-top:14px;">
            <h3>Formulir Kontak</h3>
            <form id="contactForm">
                <label class="field-label">Nama</label>
                <input class="field-input" id="contactName" placeholder="Nama lengkap">
                <label class="field-label">Email</label>
                <input class="field-input" id="contactEmail" placeholder="email@domain.com">
                <label class="field-label">Pesan</label>
                <textarea class="field-input" id="contactMessage" rows="5" placeholder="Tuliskan pertanyaan atau laporan masalah"></textarea>
                <div style="margin-top:10px; display:flex; gap:8px;">
                    <button type="button" id="sendContact" class="btn btn-primary">Kirim</button>
                    <button type="button" id="resetContact" class="btn btn-secondary">Bersihkan</button>
                </div>
            </form>
        </section>

    </div>
</div>

@push('scripts')
<script>
document.getElementById('sendContact')?.addEventListener('click', function(){
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const msg = document.getElementById('contactMessage').value.trim();
    if(!name||!email||!msg){
        alert('Harap isi semua field sebelum mengirim.');
        return;
    }
    // For now just show a toast and clear form (no backend endpoint)
    alert('Terima kasih, pesan Anda telah dikirim (simulasi).');
    document.getElementById('contactForm').reset();
});
document.getElementById('resetContact')?.addEventListener('click', function(){
    document.getElementById('contactForm').reset();
});
</script>
@endpush

@endsection
