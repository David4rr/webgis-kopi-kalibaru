<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'WebGIS Kopi Kalibaru')</title>

    <!-- CSS -->
    <link href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

    <!-- Custom CSS dari proyek lama -->
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">

    @stack('styles')
</head>
<body>
    <!-- Header Sederhana -->
    <header class="header">
        <div class="header-content">
            <img src="{{ asset('images/LOGO WEBGIS.png') }}" alt="Logo" width="50">
            <h1>Prediksi Produktivitas Kopi Kalibaru</h1>
        </div>
        <nav class="main-nav">
            <ul>
                <li><a href="/">Beranda</a></li>
                <li><a href="/tentang">Tentang</a></li>
                <li><a href="/bantuan">Bantuan</a></li>
                <li><a href="/kontak">Kontak</a></li>
            </ul>
        </nav>
    </header>

    <!-- Main Content -->
    <main>
        @yield('content')
    </main>

    <!-- Footer -->
    <footer class="footer">
        <p>&copy; {{ date('Y') }} WebGIS Produktivitas Kopi Kalibaru</p>
    </footer>

    <!-- Scripts -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

    <!-- Copy file map.js dari proyek lama -->
    <script src="{{ asset('js/map.js') }}"></script>
    
    @stack('scripts')
</body>
</html>
