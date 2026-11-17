{{--
    Sertifikat peserta. Dipanggil dari CertificateController::participant().
    Variabel: $registration, $school, $competition, $registrationEvent, $theme, $config, $setting

    Tata letak memakai koordinat persen (0-100) dari area dalam bingkai, dipetakan
    ke ukuran mm oleh helper $box(). Editor drag-and-drop di admin mengisi config['layout'].
--}}
@php
    $bg = $config['bg_color'] ?? '#ffffff';
    $text = $config['text_color'] ?? '#1e293b';
    $accent = $config['accent_color'] ?? '#0f766e';
    $accentSoft = $theme['secondary'] ?? '#c9a45c';
    $title = $config['title'] ?? 'Sertifikat Peserta';
    $subtitle = $config['subtitle'] ?? 'Diberikan kepada';

    // $namesOverride dipakai certificate-single.blade.php (satu peserta per lembar).
    $names = $namesOverride ?? $registration->participants->pluck('full_name')->filter()->values();
    $groupName = $registration->group_name;
    $nisnLine = $schoolLineNisn ?? null;
    $footerSuffix = $footerSuffix ?? '';

    // Area dalam bingkai (A4 landscape dikurangi padding sheet & frame).
    $W = 267.0;
    $H = 180.0;

    $layout = $config['layout'] ?? [];

    $defaults = [
        'logo' => ['x' => 4, 'y' => 4, 'w' => 9, 'size' => 0, 'align' => 'left'],
        'kicker' => ['x' => 20, 'y' => 6, 'w' => 60, 'size' => 11, 'align' => 'center'],
        'event' => ['x' => 15, 'y' => 12, 'w' => 70, 'size' => 15, 'align' => 'center'],
        'title' => ['x' => 10, 'y' => 20, 'w' => 80, 'size' => 34, 'align' => 'center'],
        'given_to' => ['x' => 20, 'y' => 39, 'w' => 60, 'size' => 11, 'align' => 'center'],
        'name' => ['x' => 10, 'y' => 45, 'w' => 80, 'size' => 24, 'align' => 'center'],
        'school' => ['x' => 15, 'y' => 56, 'w' => 70, 'size' => 12, 'align' => 'center'],
        'competition' => ['x' => 10, 'y' => 63, 'w' => 80, 'size' => 15, 'align' => 'center'],
        'body' => ['x' => 12, 'y' => 71, 'w' => 76, 'size' => 11, 'align' => 'center'],
        'signature' => ['x' => 64, 'y' => 80, 'w' => 30, 'size' => 10, 'align' => 'center'],
        'footer' => ['x' => 6, 'y' => 92, 'w' => 55, 'size' => 9, 'align' => 'left'],
    ];

    $box = function (string $key) use ($layout, $defaults, $W, $H): string {
        $b = array_merge($defaults[$key], $layout[$key] ?? []);
        $b['x'] = max(0, min(100, (float) $b['x']));
        $b['y'] = max(0, min(100, (float) $b['y']));
        $b['w'] = max(3, min(100, (float) $b['w']));

        return sprintf(
            'left:%.2fmm;top:%.2fmm;width:%.2fmm;text-align:%s;',
            $b['x'] / 100 * $W,
            $b['y'] / 100 * $H,
            $b['w'] / 100 * $W,
            in_array($b['align'], ['left', 'center', 'right'], true) ? $b['align'] : 'center'
        );
    };

    $font = function (string $key) use ($layout, $defaults): string {
        $b = array_merge($defaults[$key], $layout[$key] ?? []);

        return sprintf('%.2fpt', max(4, min(72, (float) $b['size'])));
    };

    // Nama peserta beregu bisa lebih dari satu: kecilkan agar tidak menabrak blok lain.
    $nameSize = $names->count() > 2
        ? min((float) (array_merge($defaults['name'], $layout['name'] ?? [])['size']), 14)
        : (float) (array_merge($defaults['name'], $layout['name'] ?? [])['size']);

    $logoUrl = $theme['logo_url'] ?? null;
    $footerText = $config['footer'] ?: 'Nomor: SRF/'.($registrationEvent->year ?? date('Y')).'/'.str_pad((string) $registration->id, 5, '0', STR_PAD_LEFT).$footerSuffix;
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }} - {{ $school->school_name ?? '' }}</title>
    <style>
        @page { margin: 0; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 0;
            font-family: "DejaVu Sans", sans-serif;
            color: {{ $text }};
            background: {{ $bg }};
        }
        .sheet {
            width: 297mm;
            height: 210mm;
            padding: 8mm;
            background: {{ $bg }};
            @if (! empty($config['bg_image_url']))
                background-image: url('{{ $config['bg_image_url'] }}');
                background-size: cover;
                background-position: center;
            @endif
        }
        .frame {
            width: 100%;
            height: 100%;
            border: 3px solid {{ $accent }};
            padding: 4mm;
        }
        .canvas {
            position: relative;
            width: 100%;
            height: 100%;
            border: 1px solid {{ $accentSoft }};
            padding: 0;
        }
        .el {
            position: absolute;
            line-height: 1.35;
        }
        .el.kicker {
            letter-spacing: 3px;
            text-transform: uppercase;
            color: {{ $accent }};
        }
        .el.event { font-weight: bold; color: {{ $text }}; }
        .el.title {
            letter-spacing: 2px;
            text-transform: uppercase;
            color: {{ $accent }};
            line-height: 1.15;
        }
        .el.given-to { color: {{ $text }}; }
        .el.name {
            font-weight: bold;
            color: {{ $text }};
            line-height: 1.2;
        }
        .el.school { color: {{ $text }}; }
        .el.competition { font-weight: bold; color: {{ $accent }}; }
        .el.body { color: {{ $text }}; }
        .el.body strong { color: {{ $accent }}; }
        .el.footer {
            color: {{ $text }};
            border-top: 1px solid {{ $accentSoft }};
            padding-top: 1.5mm;
        }
        .el.signature { text-align: center; }
        .el.signature .space { height: 12mm; }
        .el.signature .line {
            border-top: 1px solid {{ $text }};
            padding-top: 1.5mm;
        }
        .el.logo img { width: 100%; }
    </style>
</head>
<body>
<div class="sheet">
    <div class="frame">
        <div class="canvas">
            @if (($config['show_logo'] ?? true) && $logoUrl)
                <div class="el logo" style="{{ $box('logo') }}font-size:{{ $font('logo') }};">
                    <img src="{{ $logoUrl }}" alt="Logo">
                </div>
            @endif

            <div class="el kicker" style="{{ $box('kicker') }}font-size:{{ $font('kicker') }};">Sertifikat</div>

            <div class="el event" style="{{ $box('event') }}font-size:{{ $font('event') }};">
                {{ $registrationEvent->event_name ?? '' }}@if (! empty($registrationEvent->year)) &middot; {{ $registrationEvent->year }}@endif
            </div>

            <div class="el title" style="{{ $box('title') }}font-size:{{ $font('title') }};">{{ $title }}</div>

            <div class="el given-to" style="{{ $box('given_to') }}font-size:{{ $font('given_to') }};">
                {{ rtrim($subtitle, ':') }}:
            </div>

            <div class="el name" style="{{ $box('name') }}font-size:{{ $nameSize }}pt;">
                @if ($names->isEmpty())
                    {{ $groupName ?? '-' }}
                @else
                    @foreach ($names as $name)
                        <div>{{ $name }}</div>
                    @endforeach
                @endif
            </div>

            <div class="el school" style="{{ $box('school') }}font-size:{{ $font('school') }};">
                @if ($nisnLine)
                    NISN {{ $nisnLine }} &middot;
                @endif
                dari {{ $school->school_name ?? '-' }}
            </div>

            <div class="el competition" style="{{ $box('competition') }}font-size:{{ $font('competition') }};">
                {{ $competition->name ?? '-' }}
            </div>

            <div class="el body" style="{{ $box('body') }}font-size:{{ $font('body') }};">
                Atas partisipasinya dalam kegiatan
                <strong>{{ $registrationEvent->event_name ?? '' }}</strong>@if (! empty($registrationEvent->year))
                    tahun {{ $registrationEvent->year }}@endif
            </div>

            @if ($config['show_signature'] ?? true)
                <div class="el signature" style="{{ $box('signature') }}font-size:{{ $font('signature') }};">
                    <div>{{ $config['signer_title'] ?? 'Panitia Penyelenggara' }}</div>
                    <div class="space"></div>
                    <div class="line">{{ $config['signer_name'] ?? '&nbsp;' }}</div>
                </div>
            @endif

            <div class="el footer" style="{{ $box('footer') }}font-size:{{ $font('footer') }};">
                {{ $footerText }}
            </div>
        </div>
    </div>
</div>
</body>
</html>
