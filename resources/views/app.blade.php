<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ $page['props']['event']['event_name'] ?? 'Festival Pelajar Muslim' }}</title>
    {{-- Tema dinamis: warna primer/sekunder disuntik dari theme_config event. --}}
    @php($theme = $page['props']['theme'] ?? [])
    <style>
        :root {
            --primary-color: {{ $theme['primary'] ?? '#0f766e' }};
            --secondary-color: {{ $theme['secondary'] ?? '#c9a45c' }};
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
