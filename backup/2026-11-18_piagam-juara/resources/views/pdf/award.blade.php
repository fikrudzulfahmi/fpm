{{--
    Piagam juara. Dipanggil dari CertificateController::award().
    Variabel: $registration, $competition, $school, $score, $event, $theme

    Tata letak koordinat persen, sama seperti sertifikat peserta; editor drag-and-drop
    di admin menyimpan config['layout'].
--}}
@php
    $primary = $config['accent_color'] ?? ($theme['primary'] ?? '#0f766e');
    $secondary = $theme['secondary'] ?? '#c9a45c';
    $text = $config['text_color'] ?? '#1e293b';
    $bg = $config['bg_color'] ?? '#ffffff';

    $rank = (int) $score->rank;

    // Juara Harapan diberi nomor urut: peringkat 4 => Harapan I, 5 => Harapan II, dst.
    $hopeRoman = ['I', 'II', 'III', 'IV', 'V', 'VI'][min(5, max(0, $rank - 4))];

    $rankLabel = match (true) {
        $rank === 1 => 'Juara Pertama',
        $rank === 2 => 'Juara Kedua',
        $rank === 3 => 'Juara Ketiga',
        default => 'Juara Harapan '.$hopeRoman,
    };

    $rankSuffix = match (true) {
        $rank === 1 => 'I',
        $rank === 2 => 'II',
        $rank === 3 => 'III',
        default => 'H-'.$hopeRoman,
    };

    // Cabang lomba dengan kategori terpisah: sebutkan Putra/Putri pada piagam.
    $genderLabel = $competition?->isSeparateGender() && $registration->gender
        ? \App\Models\Competition::genderLabel($registration->gender)
        : null;

    if ($genderLabel) {
        $rankLabel .= ' '.$genderLabel;
    }

    $names = $registration->participants->pluck('full_name')->filter()->values();
    $groupName = $registration->group_name;

    // Lomba beregu: tampilkan nama grup, individu: nama peserta.
    $displayName = $competition?->isGroup() && $groupName
        ? $groupName
        : ($names->first() ?? '-');

    $W = 267.0;
    $H = 180.0;
    $layout = $config['layout'] ?? [];
    $defaults = \App\Models\Setting::defaultLayout('award');

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

    $badgeWidth = max(12, min(60, (float) array_merge($defaults['badge'], $layout['badge'] ?? [])['w']));
    $badgeDiameter = $badgeWidth / 100 * $W;
    $logoUrl = $theme['logo_url'] ?? null;
    $numberLine = $config['number_prefix'] ?: 'PGM/'.($event->year ?? date('Y')).'/'.str_pad((string) $registration->id, 5, '0', STR_PAD_LEFT);
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Piagam {{ $rankLabel }} - {{ $displayName }}</title>
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
            padding: 10mm;
            border: 6px double {{ $secondary }};
            background: {{ $bg }};
            @if (! empty($config['bg_image_url']))
                background-image: url('{{ $config['bg_image_url'] }}');
                background-size: cover;
                background-position: center;
            @endif
        }
        .inner {
            position: relative;
            width: 100%;
            height: 100%;
            border: 2px solid {{ $primary }};
            padding: 0;
        }
        .el { position: absolute; line-height: 1.35; }
        .el.kicker {
            letter-spacing: 4px;
            text-transform: uppercase;
            color: {{ $primary }};
        }
        .el.event { font-weight: bold; color: {{ $text }}; }
        .el.title {
            text-transform: uppercase;
            letter-spacing: 3px;
            color: {{ $primary }};
            line-height: 1.15;
        }
        .el.competition {
            font-weight: bold;
            color: {{ $secondary }};
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .el.given-to { color: {{ $text }}; }
        .el.name {
            font-weight: bold;
            color: {{ $text }};
            line-height: 1.2;
            border-bottom: 1px solid {{ $secondary }};
            padding-bottom: 1.5mm;
        }
        .el.school { color: {{ $text }}; }
        .el.members { color: #475569; }
        .el.body { color: {{ $text }}; }
        .el.body strong { color: {{ $primary }}; }
        .el.meta { color: #64748b; }
        .el.signature { text-align: center; }
        .el.signature .space { height: 14mm; }
        .el.signature .line {
            border-top: 1px solid {{ $text }};
            padding-top: 1.5mm;
        }
        .el.badge {
            border: 3px solid {{ $secondary }};
            border-radius: 50%;
            font-weight: bold;
            color: {{ $primary }};
            text-align: center;
        }
        .el.logo img { width: 100%; }
    </style>
</head>
<body>
<div class="sheet">
    <div class="inner">
        @if (($config['show_logo'] ?? true) && $logoUrl)
            <div class="el logo" style="{{ $box('logo') }}font-size:{{ $font('logo') }};">
                <img src="{{ $logoUrl }}" alt="Logo">
            </div>
        @endif

        <div class="el badge" style="{{ $box('badge') }}font-size:{{ $font('badge') }};height:{{ $badgeDiameter }}mm;line-height:{{ $badgeDiameter - 1.5 }}mm;">
            {{ $rankSuffix }}
        </div>

        <div class="el kicker" style="{{ $box('kicker') }}font-size:{{ $font('kicker') }};">Piagam Penghargaan</div>

        <div class="el event" style="{{ $box('event') }}font-size:{{ $font('event') }};">
            {{ $event->event_name ?? '' }}@if (! empty($event->year)) &middot; {{ $event->year }}@endif
        </div>

        <div class="el title" style="{{ $box('title') }}font-size:{{ $font('title') }};">{{ $rankLabel }}</div>

        <div class="el competition" style="{{ $box('competition') }}font-size:{{ $font('competition') }};">
            {{ $competition->name ?? '-' }}
        </div>

        <div class="el given-to" style="{{ $box('given_to') }}font-size:{{ $font('given_to') }};">Diberikan kepada:</div>

        <div class="el name" style="{{ $box('name') }}font-size:{{ $font('name') }};">{{ $displayName }}</div>

        <div class="el school" style="{{ $box('school') }}font-size:{{ $font('school') }};">{{ $school->school_name ?? '-' }}</div>

        @if ($competition?->isGroup() && $names->count() > 1)
            <div class="el members" style="{{ $box('members') }}font-size:{{ $font('members') }};">
                Anggota: {{ $names->implode(', ') }}
            </div>
        @endif

        <div class="el body" style="{{ $box('body') }}font-size:{{ $font('body') }};">
            Atas prestasinya meraih <strong>{{ $rankLabel }}</strong><br>
            pada cabang <strong>{{ $competition->name ?? '-' }}</strong>@if ($genderLabel) kategori <strong>{{ $genderLabel }}</strong>@endif<br>
            dalam kegiatan <strong>{{ $event->event_name ?? '' }}</strong> tahun {{ $event->year ?? date('Y') }}<br>
            @if ($score->score_value !== null)
                dengan nilai <strong>{{ rtrim(rtrim(number_format((float) $score->score_value, 2, ',', '.'), '0'), ',') }}</strong>
            @endif
        </div>

        <div class="el meta" style="{{ $box('meta') }}font-size:{{ $font('meta') }};">
            Nomor: {{ $numberLine }}
        </div>

        <div class="el signature" style="{{ $box('signature') }}font-size:{{ $font('signature') }};">
            <div>{{ $config['signer_title'] ?? 'Ketua Panitia' }}</div>
            <div class="space"></div>
            <div class="line">{{ $config['signer_name'] ?? '&nbsp;' }}</div>
        </div>
    </div>
</div>
</body>
</html>
