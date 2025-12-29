@extends('layouts.app')

@section('content')
<div class="main-container">
    <!-- Sidebar: search, basemap, controls, legend -->
    <aside class="sidebar">
        <div class="search-box">
            <input id="searchInput" type="text" placeholder="Cari nama lahan atau produktivitas...">
            <button id="searchButton">Cari</button>
        </div>

        <div style="margin: 12px 0; text-align: center;">
            <button id="drawLahanBtn" style="background:#2376d4;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;">✏️ Gambar Lahan</button>
            <div style="font-size:12px;color:#666;margin-top:6px;">Gambar polygon pada peta, lalu isi data & tekan <strong>Generate Prediksi</strong>.</div>
        </div>

        <div class="control-section">
            <h3>Hasil Pencarian</h3>
            <div id="searchResults" class="search-results"></div>
        </div>

        <div class="control-section">
            <h3>Basemap</h3>
            <div class="basemap-selector">
                <label><input type="radio" name="basemap" value="streets"> Streets</label>
                <label><input type="radio" name="basemap" value="satellite"> Satellite</label>
                <label><input type="radio" name="basemap" value="hybrid" checked> Hybrid</label>
            </div>
        </div>

        <div class="control-section">
            <h3>Layer</h3>
            <label><input id="landLabelToggle" type="checkbox" checked> Tampilkan label</label>
            <label><input id="boundaryToggle" type="checkbox" checked> Tampilkan boundary</label>
        </div>

        <div class="control-section">
            <h3>Legend</h3>
            <div class="legend-item"><div class="legend-color" style="background:#4caf50"></div> Sangat Tinggi</div>
            <div class="legend-item"><div class="legend-color" style="background:#8bc34a"></div> Tinggi</div>
            <div class="legend-item"><div class="legend-color" style="background:#ffc107"></div> Sedang</div>
            <div class="legend-item"><div class="legend-color" style="background:#ff9800"></div> Rendah</div>
            <div class="legend-item"><div class="legend-color" style="background:#d32f2f"></div> Sangat Rendah</div>
        </div>


    </aside>

    <main class="map-area">
        <div id="mapid"></div>
        <div class="map-info-box">
            <span id="lokasiInfo">[Klik lahan untuk detail]</span><br>
            Lat: <span id="latInfo">-8.2520</span>, Lon: <span id="lonInfo">114.0010</span>
        </div>
    </main>
</div>

<!-- Modal untuk Tambah Lahan (draw-first workflow) -->
<div id="tambahLahanModal" class="modal" style="display:none;">
    <div class="modal-content">
        <h3>Tambah Lahan</h3>
        <div class="help-text">Polygon lahan sudah tergambar pada peta. Isi data lingkungan lalu tekan <strong>Generate Prediksi</strong>.</div>
        <form id="tambahLahanForm" class="form-grid">
            <div class="form-row">
                <div class="form-col">
                    <label class="field-label">Nama Lahan <span class="required-star">*</span></label>
                    <input id="lahanNama" name="nama" type="text" class="field-input" required>
                    <div id="namaError" class="field-error small" style="display:none;" aria-live="polite"></div>
                </div>
                <div class="form-col">
                    <label class="field-label">Luas (m²)</label>
                    <div class="field-with-note">
                        <input id="lahanLuas" name="luas" type="text" class="field-input" readonly placeholder="Terisi otomatis" aria-readonly="true">
                        <div class="note small" id="luasHectare">—</div>
                    </div>
                </div>
            </div>

            <hr class="divider" />

            <div class="form-row">
                <div class="form-col">
                    <label class="field-label">Elevasi (m) <span class="required-star">*</span></label>
                    <input id="lahanElevasi" name="elevasi" type="number" step="0.1" class="field-input" required>
                </div>
                <div class="form-col">
                    <label class="field-label">Suhu (°C) <span class="required-star">*</span></label>
                    <input id="lahanSuhu" name="suhu" type="number" step="0.1" class="field-input" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-col">
                    <label class="field-label">Curah Hujan (mm/day) <span class="required-star">*</span></label>
                    <input id="lahanHujan" name="curah_hujan" type="number" step="0.1" class="field-input" required>
                </div>
                <div class="form-col">
                    <label class="field-label">Pola Tanam <span class="required-star">*</span></label>
                    <select id="lahanPola" name="pola_tanam" class="field-input" required>
                        <option value="">-- Pilih pola tanam --</option>
                        <option value="monokultur">monokultur</option>
                        <option value="polikultur">polikultur</option>
                    </select>
                </div>
            </div>

            <div class="form-row small-row">
                <div class="form-col">
                    <label class="field-label">Lat (centroid)</label>
                    <input id="latInput" name="lat" type="text" class="field-input" readonly>
                </div>
                <div class="form-col">
                    <label class="field-label">Lon (centroid)</label>
                    <input id="lonInput" name="lon" type="text" class="field-input" readonly>
                </div>
            </div>

            <div class="form-row generate-row">
                <div class="form-col">
                    <button type="button" id="generatePredBtn" class="btn btn-warning">⚡ Generate Prediksi</button>
                </div>
                <div class="form-col" style="display:flex;align-items:center;">
                    <div id="predResult" class="pred-result">—</div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-col">
                    <label class="field-label">Prediksi (kg) <span class="required-star">*</span></label>
                    <input id="lahanProduktivitas" name="produktivitas" type="text" class="field-input" readonly required>
                </div>
            </div>

            <div class="form-row actions">
                <div style="flex:1"></div>
                <div style="display:flex;gap:8px;">
                    <button type="button" id="closeTambahLahanBtn" class="btn btn-secondary">Batal</button>
                    <button type="submit" id="saveLahanBtn" disabled class="save-btn save-disabled btn btn-primary" aria-disabled="true">Simpan</button>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- Toast container -->
<div id="toastContainer" aria-live="polite" aria-atomic="true"></div>

<script>
    // Konfigurasi global
    window.appConfig = {
        apiUrl: '{{ url("/api") }}',
        fastapiUrl: 'http://127.0.0.1:8001/predict',
        csrfToken: '{{ csrf_token() }}'
    };

    // Disable browser autofill/persistence on this form
    window.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('tambahLahanForm');
        if (form) {
            form.setAttribute('autocomplete', 'off');
            form.reset();
        }
        // Ensure save button disabled
        const saveBtn = document.getElementById('saveLahanBtn');
        if (saveBtn) saveBtn.disabled = true;
    });
</script>
@endsection
