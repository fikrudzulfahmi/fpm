<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @php($theme = $page['props']['theme'] ?? [])
    @php($eventName = $page['props']['event']['event_name'] ?? 'Festival Pelajar Muslim')
    <title inertia>{{ $eventName }}</title>
    <meta name="description" content="Festival Pelajar Muslim XII — SMKS Islam 1 Kota Blitar. Ruang bertemu, berlomba, dan bertumbuh bagi pelajar SMP/MTs dan SMA/SMK.">
    <meta name="theme-color" content="{{ $theme['primary'] ?? '#064b3d' }}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $eventName }}">
    <meta property="og:description" content="Ruang bertemu, berlomba, dan bertumbuh bagi pelajar. Diselenggarakan SMKS Islam 1 Kota Blitar.">
    <meta property="og:image" content="{{ asset('branding/og-image.png') }}">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="icon" href="{{ asset('favicon.ico') }}" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('branding/favicon-32.png') }}">
    <link rel="icon" type="image/png" sizes="192x192" href="{{ asset('branding/favicon-192.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('branding/apple-touch-icon.png') }}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">

    {{-- Tema dinamis: warna primer/sekunder disuntik dari theme_config event. --}}
    <style>
        :root {
            --primary-color: {{ $theme['primary'] ?? '#064b3d' }};
            --secondary-color: {{ $theme['secondary'] ?? '#f3d95b' }};
        }
    </style>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="h-full bg-slate-50 text-slate-900 antialiased">
    @inertia
</body>
</html>
