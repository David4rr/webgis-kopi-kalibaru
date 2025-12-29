// Variabel global
let mymap;
let currentBasemap;
let boundaryLayers = [];
let landLabels = [];
let boundaryLayersMap = {};
let LAHAN_CONFIG = {};
// Drawing state (promoted to globals so other functions can access)
let drawnItems = null;
let currentDrawLayer = null;
let currentDrawCoords = null;
// When editing an already-saved lahan, store its id here
let currentEditingLahanId = null;

// Fungsi untuk load data dari JSON
async function loadLahanData() {
    try {
        // Pakai API Laravel, bukan file JSON
        const response = await fetch("/api/lahan");
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        // Konversi ke format yang diharapkan
        LAHAN_CONFIG = {};
        data.forEach((lahan, index) => {
            LAHAN_CONFIG[`lahan${index + 1}`] = {
                id: lahan.id,
                name: lahan.nama,
                totalProductivity: parseFloat(lahan.produktivitas),
                luas: parseFloat(lahan.luas),
                boundary: lahan.koordinat, // sudah array dari database
            };
        });

        console.log("Data lahan berhasil dimuat dari API:", LAHAN_CONFIG);
        return true;
    } catch (error) {
        console.error("Error loading lahan data:", error);
        return false;
    }
}

// Fungsi untuk simpan lahan baru
async function saveNewLahan(lahanData) {
    try {
        const response = await fetch("/api/lahan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify(lahanData),
        });

        if (!response.ok) {
            let msg = `HTTP ${response.status}`;
            try {
                const j = await response.json();
                msg = j.message || JSON.stringify(j);
            } catch (e) {
                try {
                    msg = await response.text();
                } catch (e2) {}
            }
            console.error("Error menyimpan lahan:", response.status, msg);
            showToast("Gagal menyimpan lahan: " + msg, "error");
            return null;
        }

        const result = await response.json();
        console.log("Lahan berhasil disimpan:", result);
        return result;
    } catch (error) {
        console.error("Error menyimpan lahan:", error);
        return null;
    }
}

// Update existing lahan via PUT
async function updateLahan(id, lahanData) {
    try {
        const tokenMeta = document.querySelector('meta[name="csrf-token"]');
        const headers = { "Content-Type": "application/json" };
        if (tokenMeta) headers["X-CSRF-TOKEN"] = tokenMeta.content;
        const response = await fetch(`/api/lahan/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(lahanData),
        });

        if (!response.ok) {
            let msg = `HTTP ${response.status}`;
            try {
                const j = await response.json();
                msg = j.message || JSON.stringify(j);
            } catch (e) {
                try {
                    msg = await response.text();
                } catch (e2) {}
            }
            console.error("Error updating lahan:", response.status, msg);
            showToast("Gagal memperbarui lahan: " + msg, "error");
            return null;
        }

        const result = await response.json();
        console.log("Lahan berhasil diperbarui:", result);
        return result;
    } catch (error) {
        console.error("Error updating lahan:", error);
        showToast("Gagal memperbarui lahan. Cek console.", "error");
        return null;
    }
}

// Fungsi untuk mendapatkan warna berdasarkan total produktivitas (kg)
function getColorByProductivity(totalKg) {
    if (totalKg >= 3000) return "#4caf50"; // Sangat Tinggi
    if (totalKg >= 2000) return "#8bc34a"; // Tinggi
    if (totalKg >= 1000) return "#ffc107"; // Sedang
    if (totalKg >= 500) return "#ff9800"; // Rendah
    return "#d32f2f"; // Sangat Rendah
}

// Fungsi untuk mendapatkan kategori berdasarkan total produktivitas (kg)
function getCategoryByProductivity(totalKg) {
    if (totalKg >= 3000) return "Sangat Tinggi";
    if (totalKg >= 2000) return "Tinggi";
    if (totalKg >= 1000) return "Sedang";
    if (totalKg >= 500) return "Rendah";
    return "Sangat Rendah";
}

// Inisialisasi peta
function initMap() {
    mymap = L.map("mapid", {
        preferCanvas: true,
        scrollWheelZoom: true,
        wheelPxPerZoomLevel: 600,
    }).setView([-8.252, 114.001], 13);

    // Improve scroll behavior: require Ctrl key to zoom and debounce wheel events
    try {
        // Disable default high-sensitivity handler and implement custom handler
        mymap.scrollWheelZoom.disable();
        const container = mymap.getContainer();
        let wheelAccum = 0;
        let wheelTimer = null;
        const WHEEL_THRESHOLD = 120; // pixels of wheel delta before zoom
        container.addEventListener(
            "wheel",
            function (ev) {
                // Only zoom when Ctrl is held to avoid accidental zooms while scrolling page
                if (!ev.ctrlKey) return;
                ev.preventDefault();
                wheelAccum += ev.deltaY;
                if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
                    const step = wheelAccum > 0 ? -1 : 1;
                    try {
                        const point = L.point(ev.offsetX, ev.offsetY);
                        const latlng = mymap.containerPointToLatLng(point);
                        mymap.setZoomAround(latlng, mymap.getZoom() + step);
                    } catch (e) {
                        mymap.setZoom(mymap.getZoom() + step);
                    }
                    wheelAccum = 0;
                }
                if (wheelTimer) clearTimeout(wheelTimer);
                wheelTimer = setTimeout(() => (wheelAccum = 0), 250);
            },
            { passive: false }
        );
    } catch (e) {
        console.warn("Custom wheel handler failed, falling back to default", e);
    }

    const osmLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "&copy; OpenStreetMap",
            maxZoom: 20,
        }
    );

    const satelliteLayer = L.tileLayer(
        "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        {
            attribution: "&copy; Google",
            maxZoom: 20,
            subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }
    );

    const hybridLayer = L.layerGroup([
        L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
            maxZoom: 20,
            subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }),
        L.tileLayer("https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}", {
            maxZoom: 20,
            opacity: 0.8,
            subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }),
    ]);
    // Make hybrid the default basemap
    hybridLayer.addTo(mymap);
    currentBasemap = hybridLayer;

    // Basemap switcher
    document.querySelectorAll('input[name="basemap"]').forEach((radio) => {
        radio.addEventListener("change", function () {
            mymap.removeLayer(currentBasemap);
            currentBasemap =
                this.value === "streets"
                    ? osmLayer
                    : this.value === "satellite"
                    ? satelliteLayer
                    : hybridLayer;
            mymap.addLayer(currentBasemap);
        });
    });

    // Mouse move event untuk koordinat
    mymap.on("mousemove", (e) => {
        document.getElementById("latInfo").textContent =
            e.latlng.lat.toFixed(6);
        document.getElementById("lonInfo").textContent =
            e.latlng.lng.toFixed(6);
    });

    // Klik peta untuk cepat isi koordinat centroid ketika modal terbuka (tetapi preferred adalah menggambar polygon)
    mymap.on("click", (e) => {
        lastClickedLatLng = e.latlng;
        const latEl = document.getElementById("latInput");
        const lonEl = document.getElementById("lonInput");
        if (latEl) latEl.value = e.latlng.lat.toFixed(6);
        if (lonEl) lonEl.value = e.latlng.lng.toFixed(6);
    });

    // Inisialisasi fitur menggambar (Leaflet.draw)
    drawnItems = new L.FeatureGroup();
    mymap.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        draw: {
            polygon: {
                allowIntersection: false,
                showArea: true,
                shapeOptions: { color: "#2376d4" },
            },
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
        },
        edit: { featureGroup: drawnItems },
    });

    mymap.addControl(drawControl);

    // Ketika user menekan tombol 'Gambar Lahan', aktifkan mode menggambar
    const drawBtn = document.getElementById("drawLahanBtn");
    if (drawBtn) {
        drawBtn.addEventListener("click", () => {
            // enable polygon draw
            new L.Draw.Polygon(
                mymap,
                drawControl.options.draw.polygon
            ).enable();
        });
    }

    // Handle selesai menggambar (currentDrawLayer/currentDrawCoords are globals)

    mymap.on(L.Draw.Event.CREATED, function (e) {
        const layer = e.layer;
        // hapus layer sebelumnya
        if (currentDrawLayer) {
            try {
                drawnItems.removeLayer(currentDrawLayer);
            } catch (er) {}
        }
        drawnItems.addLayer(layer);
        currentDrawLayer = layer;

        // ambil koordinat polygon (as array of latlngs)
        const latlngs = layer.getLatLngs()[0] || [];
        currentDrawCoords = latlngs.map((p) => [p.lng, p.lat]);

        // Hitung luas (m²) dan isi field Luas otomatis
        try {
            const areaM2 = computePolygonAreaSqMeters(latlngs);
            const luasEl = document.getElementById("lahanLuas");
            if (luasEl) luasEl.value = areaM2 ? areaM2.toFixed(2) : "";
        } catch (err) {
            console.warn("Gagal menghitung luas polygon", err);
        }

        // centroid untuk prefill lat/lon
        const center = layer.getBounds().getCenter();
        lastClickedLatLng = center;
        const latEl = document.getElementById("latInput");
        const lonEl = document.getElementById("lonInput");
        if (latEl) latEl.value = center.lat.toFixed(6);
        if (lonEl) lonEl.value = center.lng.toFixed(6);

        // buka modal form setelah menggambar
        openTambahModal();
        // re-validate form now that polygon exists
        validateForm();

        // allow clicking the drawn polygon to re-open the modal for editing
        try {
            layer.on("click", function () {
                // set centroid as last clicked for modal fields
                const center = layer.getBounds().getCenter();
                lastClickedLatLng = center;
                const latEl = document.getElementById("latInput");
                const lonEl = document.getElementById("lonInput");
                if (latEl) latEl.value = center.lat.toFixed(6);
                if (lonEl) lonEl.value = center.lng.toFixed(6);
                openTambahModal();
                validateForm();
            });
            layer.bindTooltip("Klik untuk edit lahan", { permanent: false });
        } catch (err) {}
    });

    // Update state when a drawn polygon is edited via the edit toolbar
    mymap.on(L.Draw.Event.EDITED, function (e) {
        try {
            e.layers.eachLayer(function (layer) {
                // If the edited layer is the current drawn layer, refresh coords
                if (currentDrawLayer && layer && layer === currentDrawLayer) {
                    const latlngs = layer.getLatLngs()[0] || [];
                    currentDrawCoords = latlngs.map((p) => [p.lng, p.lat]);

                    // update centroid and luas display
                    try {
                        const center = layer.getBounds().getCenter();
                        lastClickedLatLng = center;
                        const latEl = document.getElementById("latInput");
                        const lonEl = document.getElementById("lonInput");
                        if (latEl) latEl.value = center.lat.toFixed(6);
                        if (lonEl) lonEl.value = center.lng.toFixed(6);
                        const areaM2 = computePolygonAreaSqMeters(latlngs);
                        const luasEl = document.getElementById("lahanLuas");
                        const luasHaEl = document.getElementById("luasHectare");
                        if (luasEl)
                            luasEl.value = areaM2 ? areaM2.toFixed(2) : "";
                        if (luasHaEl)
                            luasHaEl.textContent = areaM2
                                ? (areaM2 / 10000).toFixed(4) + " ha"
                                : "—";
                    } catch (err) {
                        console.warn(
                            "Failed updating centroid/area after edit",
                            err
                        );
                    }

                    // Clear prediction because geometry changed — require regenerate
                    const pInput =
                        document.getElementById("lahanProduktivitas");
                    const predEl = document.getElementById("predResult");
                    if (pInput) pInput.value = "";
                    if (predEl) predEl.textContent = "—";
                    // disable save until new prediction generated
                    const saveBtn = document.getElementById("saveLahanBtn");
                    if (saveBtn) {
                        saveBtn.disabled = true;
                        saveBtn.classList.add("save-disabled");
                    }
                    // re-validate
                    validateForm();
                }
            });
        } catch (e) {
            console.warn("draw:edited handler error", e);
        }
    });

    // Pastikan peta mengisi ukuran kontainer setelah layout siap
    setTimeout(() => {
        try {
            mymap.invalidateSize();
        } catch (e) {
            console.warn(e);
        }
    }, 200);
    window.addEventListener("resize", () => mymap.invalidateSize());
}

// Load semua lahan ke peta
function loadAllLands() {
    boundaryLayers.forEach((l) => mymap.removeLayer(l));
    landLabels.forEach((l) => mymap.removeLayer(l));
    boundaryLayers = [];
    landLabels = [];
    boundaryLayersMap = {};

    const allBounds = [];

    Object.entries(LAHAN_CONFIG).forEach(([key, land]) => {
        const landColor = getColorByProductivity(land.totalProductivity);
        const landCategory = getCategoryByProductivity(land.totalProductivity);

        // Boundary polygon
        const boundaryLayer = L.polygon(
            land.boundary.map((c) => [c[1], c[0]]),
            {
                color: landColor,
                weight: 5,
                fillColor: landColor,
                fillOpacity: 0.3,
            }
        );

        // Popup
        boundaryLayer.bindPopup(
            `<div style="font-family: Arial; min-width: 220px;">
                <h3 style="margin: 0 0 10px 0; color: #2376d4;">${
                    land.name
                }</h3>
                <div style="background-color: ${landColor}; color: white; padding: 6px; border-radius: 5px; text-align: center; font-weight: bold; margin-bottom: 10px;">
                    ${landCategory}
                </div>
                <p><strong>☕ Total Produktivitas:</strong> ${
                    land.totalProductivity
                } kg</p>
                <p><strong>📐 Luas:</strong> ${land.luas.toFixed(2)} m²</p>
                        <div style="margin-top:8px; text-align:right; display:flex; gap:8px; justify-content:flex-end;">
                                <button onclick="window.handleEditLahan && window.handleEditLahan(${
                                    land.id
                                })" style="background:#1976d2;color:#fff;border:none;padding:6px 8px;border-radius:4px;cursor:pointer;">Edit</button>
                                <button onclick="window.handleDeleteLahan && window.handleDeleteLahan(${
                                    land.id
                                }, '${escapeHtml(
                land.name
            )}')" style="background:#c62828;color:#fff;border:none;padding:6px 8px;border-radius:4px;cursor:pointer;">Hapus</button>
                        </div>
            </div>`
        );

        // attach id to layer for easy lookup
        boundaryLayer._lahanId = land.id;

        boundaryLayer.addTo(mymap);
        boundaryLayers.push(boundaryLayer);
        boundaryLayersMap[key] = boundaryLayer;
        allBounds.push(boundaryLayer.getBounds());

        // Label
        const center = boundaryLayer.getBounds().getCenter();
        const landLabel = L.marker(center, {
            icon: L.divIcon({
                className: "land-label",
                html: `
          ${land.name}
          <span class="kg-value">${land.totalProductivity} kg</span>
          <span class="kategori-badge" style="background-color: ${landColor};">${landCategory}</span>
        `,
                iconSize: [160, 80],
            }),
        });

        if (document.getElementById("landLabelToggle").checked) {
            landLabel.addTo(mymap);
        }
        landLabels.push(landLabel);
    });

    if (allBounds.length > 0) {
        const group = L.featureGroup(boundaryLayers);
        mymap.fitBounds(group.getBounds());
        // Pastikan ukuran peta diperbarui setelah fitBounds
        setTimeout(() => {
            try {
                mymap.invalidateSize();
            } catch (e) {
                console.warn(e);
            }
        }, 200);
    }
}

// Escapes single quotes/newlines for safe embedding into HTML attributes
function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/'/g, "\\'").replace(/\n/g, " ");
}

// Delete handler exposed to popup buttons
window.handleDeleteLahan = async function (id, name) {
    try {
        if (!id) return;
        const ok = confirm(
            `Hapus lahan \"${name}\"? Tindakan ini tidak dapat dibatalkan.`
        );
        if (!ok) return;
        const tokenMeta = document.querySelector('meta[name="csrf-token"]');
        const headers = { "Content-Type": "application/json" };
        if (tokenMeta) headers["X-CSRF-TOKEN"] = tokenMeta.content;
        const resp = await fetch(`/api/lahan/${id}`, {
            method: "DELETE",
            headers,
        });
        if (!resp.ok) {
            let msg = `HTTP ${resp.status}`;
            try {
                const j = await resp.json();
                msg = j.message || JSON.stringify(j);
            } catch (e) {
                try {
                    msg = await resp.text();
                } catch (_) {}
            }
            showToast("Gagal menghapus lahan: " + msg, "error");
            return;
        }
        showToast("Lahan berhasil dihapus.", "success");
        // reload data and layers
        await loadLahanData();
        loadAllLands();
    } catch (e) {
        console.error("Delete lahan error", e);
        showToast("Gagal menghapus lahan. Cek console.", "error");
    }
};

// Edit handler: fetch lahan details and populate modal for editing
window.handleEditLahan = async function (id) {
    try {
        if (!id) return;
        const resp = await fetch(`/api/lahan/${id}`);
        if (!resp.ok) {
            showToast("Gagal mengambil data lahan untuk edit.", "error");
            return;
        }
        const lahan = await resp.json();

        // Remove any existing drawn edit layer
        try {
            if (currentDrawLayer) {
                drawnItems.removeLayer(currentDrawLayer);
            }
        } catch (e) {}

        // Remove the displayed boundary layer for this lahan so editing layer is clear
        try {
            boundaryLayers.forEach((bl, idx) => {
                if (bl && bl._lahanId && bl._lahanId === id) {
                    try {
                        mymap.removeLayer(bl);
                    } catch (e) {}
                }
            });
        } catch (e) {}

        // Create editable polygon and add to drawnItems so it can be edited via draw toolbar
        const coords = lahan.koordinat || lahan.boundary || [];
        const latlngs = coords.map((c) => [c[1], c[0]]);
        const editLayer = L.polygon(latlngs, { color: "#2376d4" });
        drawnItems.addLayer(editLayer);
        currentDrawLayer = editLayer;
        currentDrawCoords = coords.map((c) => [c[0], c[1]]);
        currentEditingLahanId = id;

        // Populate form fields
        try {
            document.getElementById("lahanNama").value = lahan.nama || "";
            document.getElementById("lahanElevasi").value = lahan.elevasi || "";
            document.getElementById("lahanSuhu").value = lahan.suhu || "";
            document.getElementById("lahanHujan").value =
                lahan.curah_hujan || "";
            document.getElementById("lahanPola").value = lahan.pola_tanam || "";
            const pInput = document.getElementById("lahanProduktivitas");
            if (pInput) pInput.value = lahan.produktivitas || "";
            const latEl = document.getElementById("latInput");
            const lonEl = document.getElementById("lonInput");
            const center = editLayer.getBounds().getCenter();
            if (latEl) latEl.value = center.lat.toFixed(6);
            if (lonEl) lonEl.value = center.lng.toFixed(6);
            const areaM2 = computePolygonAreaSqMeters(
                editLayer.getLatLngs()[0] || []
            );
            const luasEl = document.getElementById("lahanLuas");
            const luasHaEl = document.getElementById("luasHectare");
            if (luasEl) luasEl.value = areaM2 ? areaM2.toFixed(2) : "";
            if (luasHaEl)
                luasHaEl.textContent = areaM2
                    ? (areaM2 / 10000).toFixed(4) + " ha"
                    : "—";
            const predEl = document.getElementById("predResult");
            if (predEl)
                predEl.textContent = lahan.produktivitas
                    ? `Prediksi: ${lahan.produktivitas} kg`
                    : "—";
        } catch (e) {
            console.warn("Failed populating edit form", e);
        }

        openTambahModal();
        validateForm();
        showToast(
            "Mode edit lahan aktif. Gunakan tombol edit pada toolbar peta untuk mengubah geometri.",
            "info",
            4000
        );
    } catch (e) {
        console.error("handleEditLahan error", e);
        showToast("Gagal memulai mode edit lahan.", "error");
    }
};

// Fungsi pencarian
function performSearch(query) {
    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = "";

    if (!query || query.trim() === "") {
        return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const results = [];

    Object.entries(LAHAN_CONFIG).forEach(([key, land]) => {
        const nameMatch = land.name.toLowerCase().includes(lowerQuery);
        const productivityMatch = land.totalProductivity
            .toString()
            .includes(lowerQuery);

        if (nameMatch || productivityMatch) {
            results.push({ key, land });
        }
    });

    if (results.length === 0) {
        searchResults.innerHTML =
            '<div class="no-results">Tidak ada hasil ditemukan</div>';
    } else {
        results.forEach(({ key, land }) => {
            const color = getColorByProductivity(land.totalProductivity);
            const category = getCategoryByProductivity(land.totalProductivity);

            const resultItem = document.createElement("div");
            resultItem.className = "search-result-item";
            resultItem.innerHTML = `
        <div class="land-name">${land.name}</div>
        <div class="land-productivity">☕ ${land.totalProductivity} kg</div>
        <span class="land-category" style="background-color: ${color};">${category}</span>
      `;

            resultItem.addEventListener("click", () => {
                const layer = boundaryLayersMap[key];
                if (layer) {
                    mymap.fitBounds(layer.getBounds(), { padding: [50, 50] });
                    layer.openPopup();
                }
                layer.setStyle({ weight: 8, opacity: 1 });
                setTimeout(() => {
                    layer.setStyle({ weight: 5, opacity: 1 });
                }, 2000);
            });

            searchResults.appendChild(resultItem);
        });
    }
}

// Small state for add-lahan flow
let lastClickedLatLng = null;
// Guard for concurrent Generate requests
let isGenerating = false;

// Simple toast utility
function showToast(message, type = "info", timeout = 4000, tag = null) {
    const container = document.getElementById("toastContainer");
    if (!container) {
        console.warn("Toast container not found");
        alert(message);
        return;
    }
    // If tag provided, remove existing toast with same tag to avoid duplicates
    if (tag) {
        const existing = container.querySelector(`[data-toast-tag="${tag}"]`);
        if (existing) existing.remove();
    }
    const toast = document.createElement("div");
    toast.className = "toast " + (type || "info");
    toast.textContent = message;
    if (tag) toast.setAttribute("data-toast-tag", tag);
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, timeout);
}

// Small utility: parse number string (comma or dot)
function parseNumVal(idOrEl) {
    try {
        const el =
            typeof idOrEl === "string"
                ? document.getElementById(idOrEl)
                : idOrEl;
        if (!el) return NaN;
        const s = String(el.value || "").trim();
        if (!s) return NaN;
        return parseFloat(s.replace(/,/g, "."));
    } catch (e) {
        return NaN;
    }
}

// Compute polygon area in square meters using Web Mercator projection (approximate)
function computePolygonAreaSqMeters(latlngs) {
    if (!Array.isArray(latlngs) || latlngs.length < 3) return 0;
    const R = 6378137; // Earth radius in meters
    const pts = latlngs.map((p) => {
        const lat = p.lat !== undefined ? p.lat : p[1];
        const lon = p.lng !== undefined ? p.lng : p[0];
        const x = R * ((lon * Math.PI) / 180);
        const y =
            R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
        return { x, y };
    });
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        sum += a.x * b.y - b.x * a.y;
    }
    return Math.abs(sum) / 2;
}

// Validation helpers: check required fields + polygon + prediction
// Check whether a lahan name already exists (case-insensitive)
// optional excludeId: do not consider the lahan with this id (useful when editing)
function isNameDuplicate(name, excludeId = null) {
    if (!name) return false;
    const lower = name.trim().toLowerCase();
    return Object.values(LAHAN_CONFIG).some((l) => {
        if (!l || !l.name) return false;
        if (excludeId && l.id === excludeId) return false;
        return (l.name || "").toLowerCase() === lower;
    });
}

function isFormValid() {
    try {
        const nama = document.getElementById("lahanNama").value.trim();
        const elevasi = parseNumVal("lahanElevasi");
        const suhu = parseNumVal("lahanSuhu");
        const curah = parseNumVal("lahanHujan");
        const pola = document.getElementById("lahanPola").value;
        const prod = parseNumVal("lahanProduktivitas");

        const hasPolygon = currentDrawCoords && currentDrawCoords.length > 0;
        if (!nama) return false;
        // disallow duplicate names (allow same name when editing that record)
        if (isNameDuplicate(nama, currentEditingLahanId)) return false;
        if (isNaN(elevasi) || isNaN(suhu) || isNaN(curah)) return false;
        if (!pola) return false;
        if (isNaN(prod)) return false;
        if (!hasPolygon) return false;
        return true;
    } catch (e) {
        return false;
    }
}

function validateForm() {
    const saveBtn = document.getElementById("saveLahanBtn");
    if (!saveBtn) return;
    const valid = isFormValid();
    // Debug helper: print form state (will show in browser console)
    console.debug("validateForm", {
        nama: document.getElementById("lahanNama")?.value,
        elevasi: document.getElementById("lahanElevasi")?.value,
        suhu: document.getElementById("lahanSuhu")?.value,
        curah: document.getElementById("lahanHujan")?.value,
        pola: document.getElementById("lahanPola")?.value,
        pred: document.getElementById("lahanProduktivitas")?.value,
        hasPolygon: !!(currentDrawCoords && currentDrawCoords.length > 0),
        valid,
    });
    if (valid) {
        saveBtn.disabled = false;
        saveBtn.classList.remove("save-disabled");
        saveBtn.setAttribute("aria-disabled", "false");
    } else {
        saveBtn.disabled = true;
        saveBtn.classList.add("save-disabled");
        saveBtn.setAttribute("aria-disabled", "true");
    }

    // Mark name field if duplicate for user feedback (no toast on every input)
    const namaEl = document.getElementById("lahanNama");
    if (namaEl) {
        const isDup = isNameDuplicate(
            namaEl.value || "",
            currentEditingLahanId
        );
        if (isDup) {
            namaEl.classList.add("input-duplicate");
            namaEl.setAttribute("title", "Nama lahan sudah ada");
            const namaErr = document.getElementById("namaError");
            if (namaErr) {
                namaErr.textContent = "Nama lahan sudah digunakan.";
                namaErr.style.display = "block";
            }
        } else {
            namaEl.classList.remove("input-duplicate");
            namaEl.removeAttribute("title");
            const namaErr = document.getElementById("namaError");
            if (namaErr) {
                namaErr.textContent = "";
                namaErr.style.display = "none";
            }
        }
    }
}

function openTambahModal() {
    const modal = document.getElementById("tambahLahanModal");
    if (!modal) return;
    // reset prediksi display and disable save until prediction generated
    const predEl = document.getElementById("predResult");
    if (predEl) predEl.textContent = "—";
    const pInput = document.getElementById("lahanProduktivitas");
    if (pInput) pInput.value = "";
    // NOTE: Do NOT reset the whole form here - keep coordinates if opened after drawing

    const saveBtn = document.getElementById("saveLahanBtn");
    if (saveBtn) saveBtn.disabled = true;

    // If there's an active drawn polygon, populate centroid and luas
    try {
        if (currentDrawLayer) {
            const center = currentDrawLayer.getBounds().getCenter();
            lastClickedLatLng = center;
            const latEl = document.getElementById("latInput");
            const lonEl = document.getElementById("lonInput");
            if (latEl) latEl.value = center.lat.toFixed(6);
            if (lonEl) lonEl.value = center.lng.toFixed(6);
            const latlngs = currentDrawLayer.getLatLngs()[0] || [];
            const areaM2 = computePolygonAreaSqMeters(latlngs);
            const luasEl = document.getElementById("lahanLuas");
            const luasHaEl = document.getElementById("luasHectare");
            if (luasEl) luasEl.value = areaM2 ? areaM2.toFixed(2) : "";
            if (luasHaEl)
                luasHaEl.textContent = areaM2
                    ? (areaM2 / 10000).toFixed(4) + " ha"
                    : "—";
        } else if (currentDrawCoords && currentDrawCoords.length > 0) {
            // use coords to compute centroid/area approximately
            const pts = currentDrawCoords.map((c) => ({
                lat: c[1],
                lng: c[0],
            }));
            const bounds = L.latLngBounds(pts);
            const center = bounds.getCenter();
            lastClickedLatLng = center;
            const latEl = document.getElementById("latInput");
            const lonEl = document.getElementById("lonInput");
            if (latEl) latEl.value = center.lat.toFixed(6);
            if (lonEl) lonEl.value = center.lng.toFixed(6);
            const areaM2 = computePolygonAreaSqMeters(pts);
            const luasEl = document.getElementById("lahanLuas");
            const luasHaEl = document.getElementById("luasHectare");
            if (luasEl) luasEl.value = areaM2 ? areaM2.toFixed(2) : "";
            if (luasHaEl)
                luasHaEl.textContent = areaM2
                    ? (areaM2 / 10000).toFixed(4) + " ha"
                    : "—";
        }
    } catch (e) {
        console.warn("openTambahModal populate failed", e);
    }

    modal.style.display = "flex";
}

function closeTambahModal() {
    const modal = document.getElementById("tambahLahanModal");
    if (!modal) return;
    modal.style.display = "none";
}

// Setup event listeners
function setupEventListeners() {
    // Search
    document.getElementById("searchButton").addEventListener("click", () => {
        const query = document.getElementById("searchInput").value;
        performSearch(query);
    });

    document.getElementById("searchInput").addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            performSearch(e.target.value);
        }
    });

    document.getElementById("searchInput").addEventListener("input", (e) => {
        performSearch(e.target.value);
    });

    // Toggle controls
    document
        .getElementById("landLabelToggle")
        .addEventListener("change", function () {
            landLabels.forEach((l) =>
                this.checked ? l.addTo(mymap) : mymap.removeLayer(l)
            );
        });

    document
        .getElementById("boundaryToggle")
        .addEventListener("change", function () {
            boundaryLayers.forEach((l) =>
                this.checked ? l.addTo(mymap) : mymap.removeLayer(l)
            );
        });

    // Open modal from button
    const openBtn = document.getElementById("openTambahLahanBtn");
    if (openBtn) {
        openBtn.addEventListener("click", () => {
            // clear form
            const form = document.getElementById("tambahLahanForm");
            if (form) form.reset();
            lastClickedLatLng = null;
            document.getElementById("latInput").value = "";
            document.getElementById("lonInput").value = ""; // ensure save disabled until valid
            validateForm();
            openTambahModal();
        });
    }

    // sidebar edit button removed; saved lahan can be edited via popup 'Edit' button

    // Close modal
    const closeBtn = document.getElementById("closeTambahLahanBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeTambahModal);
    // Live validation: watch inputs and update Save button state
    [
        "lahanNama",
        "lahanElevasi",
        "lahanSuhu",
        "lahanHujan",
        "lahanPola",
        "lahanProduktivitas",
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", validateForm);
            el.addEventListener("change", validateForm);
        }
    });
    // Generate prediction button (calls FastAPI)
    const genBtn = document.getElementById("generatePredBtn");
    if (genBtn) {
        genBtn.addEventListener("click", async () => {
            if (isGenerating) {
                showToast(
                    "Permintaan generate sedang diproses. Tunggu sebentar...",
                    "info",
                    2000,
                    "generate"
                );
                return;
            }
            isGenerating = true;
            genBtn.disabled = true;
            const _prevGenText = genBtn.textContent;
            genBtn.textContent = "...menghitung...";

            // Ambil nilai input (terima comma sebagai decimal)
            const elevasi = parseNumVal("lahanElevasi");
            const suhu = parseNumVal("lahanSuhu");
            const curah = parseNumVal("lahanHujan");
            const pola = document.getElementById("lahanPola").value;
            const predEl = document.getElementById("predResult");

            if (isNaN(elevasi) || isNaN(suhu) || isNaN(curah) || !pola) {
                showToast(
                    "Isi elevasi, suhu, curah hujan, dan pola tanam sebelum generate.",
                    "info",
                    3000,
                    "generate"
                );
                isGenerating = false;
                genBtn.disabled = false;
                genBtn.textContent = _prevGenText || "⚡ Generate Prediksi";
                return;
            }

            predEl.textContent = "...menghitung...";
            const url = window.appConfig.fastapiUrl;
            console.log("Requesting prediction from", url, {
                elevasi_mdpl: elevasi,
                suhu_c: suhu,
                curah_hujan_mm_per_day: curah,
                pola_tanam: pola,
            });

            const tryFetch = async (u) =>
                fetch(u, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        elevasi_mdpl: elevasi,
                        suhu_c: suhu,
                        curah_hujan_mm_per_day: curah,
                        pola_tanam: pola,
                    }),
                });

            try {
                let resp;
                // Coba URL persis dulu
                try {
                    resp = await tryFetch(url);
                } catch (firstErr) {
                    console.warn(
                        "First request failed, will try with trailing slash if available:",
                        firstErr
                    );
                    if (!url.endsWith("/")) {
                        try {
                            resp = await tryFetch(url + "/");
                            console.log("Retry using trailing slash succeeded");
                        } catch (secondErr) {
                            throw secondErr; // rethrow to outer catch
                        }
                    } else {
                        throw firstErr;
                    }
                }

                // Jika server mengembalikan redirect (307) untuk preflight, coba follow Location header
                if (
                    resp &&
                    resp.status === 307 &&
                    resp.headers &&
                    resp.headers.get("location")
                ) {
                    const loc = resp.headers.get("location");
                    console.log("Follow redirect to", loc);
                    resp = await tryFetch(loc);
                }

                if (!resp.ok) {
                    const text = await resp.text();
                    console.error("FastAPI returned error", resp.status, text);
                    predEl.textContent = `Error ${resp.status}: ${text.slice(
                        0,
                        200
                    )}`;
                    showToast(
                        "Gagal generate prediksi: " + resp.status,
                        "error",
                        5000,
                        "generate"
                    );
                    return;
                }

                let json;
                try {
                    json = await resp.json();
                } catch (parseErr) {
                    const text = await resp.text();
                    console.error(
                        "Failed to parse JSON from FastAPI",
                        parseErr,
                        text
                    );
                    predEl.textContent = "Invalid JSON response from FastAPI";
                    return;
                }

                const pred =
                    json.produktivitas_pred ||
                    json.produktivitas_prediksi ||
                    json.produktivitas ||
                    null;
                if (pred == null) {
                    console.error("No prediction field in response", json);
                    predEl.textContent =
                        "Response OK but no prediction returned";
                    return;
                }

                const rounded = Math.round(pred * 100) / 100;
                predEl.textContent = `Prediksi: ${rounded} kg`;
                const pInput = document.getElementById("lahanProduktivitas");
                if (pInput) pInput.value = rounded;
                // enable save button when prediction is available
                const saveBtn = document.getElementById("saveLahanBtn");
                if (saveBtn) saveBtn.disabled = false;
                showToast(
                    "Prediksi berhasil: " + rounded + " kg",
                    "success",
                    4000,
                    "generate"
                );
                // Re-validate to update button state and classes
                validateForm();
            } catch (err) {
                console.error("Generate pred error", err);
                // Explain likely causes and how to inspect further
                showToast(
                    "Gagal generate prediksi. Cek Console/Network. (CORS atau server tidak aktif)",
                    "error",
                    5000,
                    "generate"
                );
                predEl.textContent = "Gagal generate prediksi";
            } finally {
                // restore generate button
                isGenerating = false;
                genBtn.disabled = false;
                genBtn.textContent = _prevGenText || "⚡ Generate Prediksi";
            }
        });
    }

    // Submit form (Save)
    const tambahForm = document.getElementById("tambahLahanForm");
    if (tambahForm) {
        tambahForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nama = document.getElementById("lahanNama").value.trim();
            const luas = parseNumVal("lahanLuas") || null;
            // Accept comma or dot decimals when reading values
            const produktivitas = parseNumVal("lahanProduktivitas");

            // Normalize numeric inputs (accept comma or dot)
            const elevasi = parseNumVal("lahanElevasi");
            const suhu = parseNumVal("lahanSuhu");
            const curah_hujan = parseNumVal("lahanHujan");
            const pola_tanam = document
                .getElementById("lahanPola")
                .value.trim();
            const lat =
                parseFloat(document.getElementById("latInput").value) ||
                (lastClickedLatLng ? lastClickedLatLng.lat : null);
            const lon =
                parseFloat(document.getElementById("lonInput").value) ||
                (lastClickedLatLng ? lastClickedLatLng.lng : null);

            if (
                !nama ||
                produktivitas == null ||
                isNaN(elevasi) ||
                isNaN(suhu) ||
                isNaN(curah_hujan) ||
                !pola_tanam
            ) {
                showToast(
                    "Harap isi semua field yang wajib (termasuk hasil prediksi).",
                    "info"
                );
                return;
            }

            // Check duplicate name before submitting (allow same name if editing this record)
            if (isNameDuplicate(nama, currentEditingLahanId)) {
                showToast(
                    "Nama lahan sudah digunakan. Gunakan nama lain.",
                    "error"
                );
                const namaEl = document.getElementById("lahanNama");
                if (namaEl) namaEl.focus();
                const namaErr = document.getElementById("namaError");
                if (namaErr) {
                    namaErr.textContent = "Nama lahan sudah digunakan.";
                    namaErr.style.display = "block";
                }
                return;
            }

            if (!currentDrawCoords || currentDrawCoords.length === 0) {
                showToast(
                    "Polygon lahan belum digambar. Gunakan tombol Gambar Lahan dan gambar polygon pada peta.",
                    "info"
                );
                return;
            }

            const payload = {
                nama,
                luas,
                koordinat: currentDrawCoords,
                elevasi,
                suhu,
                curah_hujan,
                pola_tanam,
                produktivitas,
                kategori: document.getElementById("lahanKategori")
                    ? document.getElementById("lahanKategori").value
                    : "Unknown",
            };

            let saved = null;
            if (currentEditingLahanId) {
                // Update existing lahan
                saved = await updateLahan(currentEditingLahanId, payload);
            } else {
                saved = await saveNewLahan(payload);
            }

            if (saved) {
                // reset form and modal, then refresh data
                const form = document.getElementById("tambahLahanForm");
                if (form) form.reset();
                const predEl = document.getElementById("predResult");
                if (predEl) predEl.textContent = "—";
                const pInput = document.getElementById("lahanProduktivitas");
                if (pInput) pInput.value = "";
                const saveBtn = document.getElementById("saveLahanBtn");
                if (saveBtn) saveBtn.disabled = true;

                closeTambahModal();
                await loadLahanData();
                loadAllLands();
                // Re-validate form to pick up updated LAHAN_CONFIG (name uniqueness)
                try {
                    validateForm();
                } catch (e) {}
                showToast("Lahan berhasil ditambahkan.", "success");

                // reset drawn polygon
                if (currentDrawLayer) {
                    try {
                        drawnItems.removeLayer(currentDrawLayer);
                        currentDrawLayer = null;
                        currentDrawCoords = null;
                        const luasEl = document.getElementById("lahanLuas");
                        const luasHaEl = document.getElementById("luasHectare");
                        if (luasEl) luasEl.value = "";
                        if (luasHaEl) luasHaEl.textContent = "—";
                    } catch (er) {}
                }
                // If we were editing, clear editing state and change message
                if (currentEditingLahanId) {
                    currentEditingLahanId = null;
                    showToast("Lahan berhasil diperbarui.", "success");
                }
            } else {
                showToast(
                    currentEditingLahanId
                        ? "Gagal memperbarui lahan. Cek console untuk detail."
                        : "Gagal menyimpan lahan. Cek console untuk detail.",
                    "error"
                );
            }
        });
    }
}

// Initialize aplikasi
async function init() {
    console.log("Initializing application...");
    await loadLahanData();
    initMap();
    loadAllLands();
    setupEventListeners();
    console.log("Application ready!");
}

// Jalankan saat DOM ready
document.addEventListener("DOMContentLoaded", init);
