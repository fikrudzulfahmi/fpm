<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @php($theme = $page['props']['theme'] ?? [])
    @php($eventName = $page['props']['event']['event_name'] ?? 'Festival Pelajar Muslim XII')
    @php($siteUrl = 'https://fpm.smkislam1blitar.sch.id')
    @php($ogImagePath = public_path('branding/og-image.png'))
    @php($ogImage = $siteUrl.'/branding/og-image.png?v='.(file_exists($ogImagePath) ? filemtime($ogImagePath) : '1'))
    @php($pageUrl = $siteUrl.request()->getPathInfo())
    @php($description = 'Festival Pelajar Muslim XII untuk pelajar SMP/MTs se-Karesidenan Kediri di SMKS Islam 1 Kota Blitar. Enam cabang lomba, pendaftaran gratis 20 November 2026 – 22 Januari 2027, pelaksanaan 30 Januari 2027.')
    <title inertia>{{ $eventName }}</title>
    <meta name="description" content="{{ $description }}">
    <meta name="theme-color" content="{{ $theme['primary'] ?? '#064b3d' }}">
    <link rel="canonical" href="{{ $pageUrl }}">

    {{-- Open Graph: pratinjau tautan di WhatsApp, Facebook, Telegram. --}}
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="FPM XII · SMKS Islam 1 Kota Blitar">
    <meta property="og:locale" content="id_ID">
    <meta property="og:url" content="{{ $pageUrl }}">
    <meta property="og:title" content="{{ $eventName }} — SMP/MTs se-Karesidenan Kediri">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:image" content="{{ $ogImage }}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Poster Festival Pelajar Muslim XII, enam cabang lomba, pelaksanaan 30 Januari 2027 di SMKS Islam 1 Kota Blitar">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $eventName }} — SMP/MTs se-Karesidenan Kediri">
    <meta name="twitter:description" content="{{ $description }}">
    <meta name="twitter:image" content="{{ $ogImage }}">

    <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'Event',
            'name' => $eventName,
            'description' => $description,
            'url' => $siteUrl,
            'image' => [$ogImage],
            'startDate' => '2027-01-30T07:00:00+07:00',
            'endDate' => '2027-01-30T16:00:00+07:00',
            'eventStatus' => 'https://schema.org/EventScheduled',
            'eventAttendanceMode' => 'https://schema.org/OfflineEventAttendanceMode',
            'location' => [
                '@type' => 'Place',
                'name' => 'SMKS Islam 1 Kota Blitar',
                'address' => [
                    '@type' => 'PostalAddress',
                    'streetAddress' => 'Jl. Musi No. 6',
                    'addressLocality' => 'Kota Blitar',
                    'addressRegion' => 'Jawa Timur',
                    'postalCode' => '66117',
                    'addressCountry' => 'ID',
                ],
            ],
            'organizer' => [
                '@type' => 'Organization',
                'name' => 'SMKS Islam 1 Kota Blitar',
                'url' => 'https://smkislam1blitar.sch.id',
            ],
            'offers' => [
                '@type' => 'Offer',
                'price' => '0',
                'priceCurrency' => 'IDR',
                'availability' => 'https://schema.org/InStock',
                'validFrom' => '2026-11-20T00:00:00+07:00',
                'url' => $siteUrl.'/klaim',
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) !!}
    </script>

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
