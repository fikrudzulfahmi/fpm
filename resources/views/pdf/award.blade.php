{{--
    Piagam juara — template resmi FPM XII versi "meriah".

    Satu keluarga desain dengan sertifikat peserta (bingkai hijau–emas, ornamen
    sudut, pola titik, dua tanda tangan + stempel kepala sekolah), ditambah pita
    gelar juara, deret bintang, dan garis emas ganda agar terasa lebih bergengsi.

    Koordinat mengikuti SVG panitia: px × 0.26446 = mm, px × 0.75 = pt.

    Variabel: $registration, $competition, $school, $score, $event, $theme,
              $config, $setting
--}}
@php
    $k = 0.26446;
    $PALETTE = [
        'ink' => '#0d3029',
        'green' => '#064b3d',
        'green2' => '#0a5b4a',
        'gold' => '#c9a227',
        'gold-light' => '#f3d95b',
        'gold-dark' => '#8a6b12',
        'muted' => '#5c6e67',
        'body' => '#3b4f48',
    ];

    $rank = (int) $score->rank;
    $hopeRoman = ['I', 'II', 'III', 'IV', 'V', 'VI'][min(5, max(0, $rank - 4))];

    $rankLabel = match (true) {
        $rank === 1 => 'Juara Pertama',
        $rank === 2 => 'Juara Kedua',
        $rank === 3 => 'Juara Ketiga',
        default => 'Juara Harapan '.$hopeRoman,
    };

    $placeText = match (true) {
        $rank === 1 => 'JUARA I',
        $rank === 2 => 'JUARA II',
        $rank === 3 => 'JUARA III',
        default => 'JUARA HARAPAN '.$hopeRoman,
    };

    $genderLabel = $competition?->isSeparateGender() && $registration->gender
        ? \App\Models\Competition::genderLabel($registration->gender)
        : null;

    if ($genderLabel) {
        $rankLabel .= ' '.$genderLabel;
    }

    $names = $registration->participants->pluck('full_name')->filter()->values();
    $groupName = $registration->group_name;
    $displayName = $competition?->isGroup() && $groupName
        ? $groupName
        : ($names->first() ?? '-');

    $nameLen = mb_strlen($displayName);
    $namePx = match (true) {
        $nameLen > 40 => 24,
        $nameLen > 30 => 29,
        $nameLen > 22 => 34,
        default => 42,
    };

    // NISN peserta pertama (regu: pertama + dkk).
    $nisnAll = $registration->participants->pluck('nisn')->filter()->unique()->values();
    $nisnLine = match (true) {
        $nisnAll->count() === 1 => $nisnAll->first(),
        $nisnAll->count() > 1 => $nisnAll->first().' dkk',
        default => null,
    };

    $eventName = $event->event_name ?? 'Festival Pelajar Muslim';
    $eventYear = $event->year ?? date('Y');
    $schoolName = $school->school_name ?? '-';
    $competitionName = $competition->name ?? '-';
    $occasion = config('fpm.occasion_short') ?? 'Harlah SMKS Islam 1 Kota Blitar';
    $venue = config('fpm.venue.name') ?? 'SMKS Islam 1 Kota Blitar';

    $numberLine = $config['number_prefix'] ?: 'PGM/'.$eventYear.'/'.str_pad((string) $registration->id, 5, '0', STR_PAD_LEFT);
    if (! preg_match('/\d/', $numberLine)) {
        $numberLine = 'PGM/'.$eventYear.'/'.str_pad((string) $registration->id, 5, '0', STR_PAD_LEFT);
    }
    $issuedAt = now()->locale('id')->translatedFormat('d F Y');

    $signer1Role = $config['signer_title'] ?: 'Ketua Panitia';
    $signer1Name = $config['signer_name'] ?: '';
    $signer2Role = $config['signer2_title'] ?: 'Kepala SMKS Islam 1 Kota Blitar';
    $signer2Name = $config['signer2_name'] ?: '';

    $assetPath = fn (string $file) => str_replace('\\', '/', public_path('branding/certificate/'.$file));
    $has = fn (string $file) => file_exists($assetPath($file));

    $stripLogo = $has('logo-strip.png') ? $assetPath('logo-strip.png') : null;
    $logoFpm = $assetPath('logo-fpm.png');
    $bgImage = $config['bg_image_url'] ?? null;
    $showLogo = $config['show_logo'] ?? true;

    $sheetBg = $config['bg_color'] ?? null;
    if (! $sheetBg || in_array(strtolower($sheetBg), ['#ffffff', '#fff'], true)) {
        $sheetBg = '#f8f6ec';
    }

    $pos = function (float $y, float $size, float $width = 1040, float $center = 561.5, string $align = 'center'): string {
        $k = 0.26446;

        return sprintf(
            'left:%.3fmm;top:%.3fmm;width:%.3fmm;font-size:%.2fpt;text-align:%s;',
            ($center - $width / 2) * $k,
            ($y - $size * 1.02) * $k,
            $width * $k,
            $size * 0.75,
            $align
        );
    };

    $line = function (float $y, float $x1, float $x2, string $color, float $widthMm, float $opacity = 1): string {
        $k = 0.26446;

        return sprintf(
            'left:%.3fmm;top:%.3fmm;width:%.3fmm;border-top:%.3fmm solid %s;opacity:%.2f;',
            $x1 * $k,
            $y * $k,
            ($x2 - $x1) * $k,
            $widthMm,
            $color,
            $opacity
        );
    };
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Piagam {{ $rankLabel }} - {{ $displayName }}</title>
    <style>
        @page { margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: "DejaVu Sans", sans-serif; color: {{ $PALETTE['ink'] }}; }
        .sheet {
            position: relative;
            width: 297mm;
            height: 210mm;
            background: {{ $sheetBg }};
            overflow: hidden;
            @if ($bgImage)
                background-image: url('{{ $bgImage }}');
                background-size: cover;
                background-position: center;
            @endif
        }
        .layer { position: absolute; left: 0; top: 0; width: 297mm; height: 210mm; }
        .dots { background-image: url('{{ $assetPath('dots.png') }}'); background-repeat: repeat; }
        .f1 { left: 5.82mm; top: 5.82mm; width: 285.3mm; height: 198.3mm; border: 0.79mm solid {{ $PALETTE['green'] }}; }
        .f2 { left: 8.73mm; top: 8.73mm; width: 279.5mm; height: 192.5mm; border: 0.40mm solid {{ $PALETTE['gold'] }}; }
        .f3 { left: 10.84mm; top: 10.84mm; width: 275.3mm; height: 188.3mm; border: 0.21mm solid #d8d5c6; }
        .el { position: absolute; line-height: 1; }
        .kicker { color: {{ $PALETTE['gold-dark'] }}; font-weight: bold; letter-spacing: 6pt; text-transform: uppercase; }
        .event { color: {{ $PALETTE['ink'] }}; font-weight: bold; letter-spacing: 0.6pt; }
        .stars { color: {{ $PALETTE['gold'] }}; letter-spacing: 3.2pt; }
        .band {
            position: absolute;
            background: {{ $PALETTE['green'] }};
            border: 0.53mm solid {{ $PALETTE['gold'] }};
            text-align: center;
        }
        .band-inner {
            margin: 0.9mm;
            border: 0.18mm solid {{ $PALETTE['gold-light'] }};
            padding-top: 2.1mm;
            padding-bottom: 2.4mm;
            color: {{ $PALETTE['gold-light'] }};
            font-weight: bold;
            letter-spacing: 2.6pt;
        }
        .given { color: {{ $PALETTE['muted'] }}; font-weight: bold; letter-spacing: 1.1pt; }
        .name { color: {{ $PALETTE['ink'] }}; font-weight: bold; letter-spacing: 0.2pt; }
        .school { color: {{ $PALETTE['body'] }}; letter-spacing: 0.15pt; }
        .comp { color: {{ $PALETTE['green2'] }}; font-weight: bold; letter-spacing: 0.9pt; }
        .body { color: {{ $PALETTE['body'] }}; }
        .body b { color: {{ $PALETTE['green'] }}; font-weight: bold; }
        .role { color: {{ $PALETTE['muted'] }}; font-weight: bold; }
        .signame { color: {{ $PALETTE['ink'] }}; font-weight: bold; }
        .foot { color: {{ $PALETTE['muted'] }}; }
        .foots { color: {{ $PALETTE['muted'] }}; }
        .footb { color: {{ $PALETTE['body'] }}; font-weight: bold; }
        .logo img { height: 20mm; }
    </style>
</head>
<body>
<div class="sheet">
    @unless ($bgImage)
        <div class="layer dots"></div>
        <div class="layer f1"></div>
        <div class="layer f2"></div>
        <div class="layer f3"></div>

        <img src="{{ $assetPath('corner-tl.png') }}" style="position:absolute;left:8.73mm;top:8.73mm;width:20.63mm;height:20.63mm;" alt="">
        <img src="{{ $assetPath('corner-tr.png') }}" style="position:absolute;left:267.64mm;top:8.73mm;width:20.63mm;height:20.63mm;" alt="">
        <img src="{{ $assetPath('corner-bl.png') }}" style="position:absolute;left:8.73mm;top:180.64mm;width:20.63mm;height:20.63mm;" alt="">
        <img src="{{ $assetPath('corner-br.png') }}" style="position:absolute;left:267.64mm;top:180.64mm;width:20.63mm;height:20.63mm;" alt="">
    @endunless

    @if ($showLogo)
        @if ($stripLogo)
            <img src="{{ $stripLogo }}" style="position:absolute;left:98.25mm;top:22.22mm;width:100.5mm;" alt="">
        @else
            <div class="el logo" style="left:123.0mm;top:17.5mm;width:51mm;text-align:center;">
                <img src="{{ $logoFpm }}" style="width:51mm;" alt="">
            </div>
        @endif
        <div class="el" style="{{ $line(164, 516.5, 606.5, $PALETTE['gold'], 0.32, 0.6) }}"></div>
    @endif

    {{-- Kepala piagam --}}
    <div class="el kicker" style="{{ $pos(188, 10.5) }}">Piagam Penghargaan</div>
    <div class="el event" style="{{ $pos(212, 15) }}">{{ $eventName }} &middot; {{ $eventYear }}</div>

    <div class="el stars" style="{{ $pos(238, 12) }}">&#9733; &#9733; &#9733; &#9733; &#9733;</div>

    {{-- Pita gelar juara --}}
    <div class="band" style="left:96.5mm;top:66.6mm;width:104mm;height:15.3mm;">
        <div class="band-inner" style="font-size:22pt;">{{ $placeText }}</div>
    </div>
    <div class="el" style="{{ $line(252, 291.5, 421.5, $PALETTE['gold'], 0.32, 0.65) }}"></div>
    <div class="el" style="{{ $line(252, 701.5, 831.5, $PALETTE['gold'], 0.32, 0.65) }}"></div>

    {{-- Data penerima --}}
    <div class="el given" style="{{ $pos(342, 12.5) }}">Diberikan kepada</div>
    <div class="el" style="{{ $line(338, 318, 470, $PALETTE['gold'], 0.26, 0.5) }}"></div>
    <div class="el" style="{{ $line(338, 653, 805, $PALETTE['gold'], 0.26, 0.5) }}"></div>

    <div class="el name" style="{{ $pos(390, $namePx) }}">{{ $displayName }}</div>
    <div class="el" style="{{ $line(408, 301.5, 821.5, $PALETTE['gold'], 0.32) }}"></div>

    <div class="el school" style="{{ $pos(434, 12.5) }}">
        @if ($nisnLine) NISN {{ $nisnLine }} &middot; @endif{{ $schoolName }}
    </div>

    <div class="el comp" style="{{ $pos(468, 19) }}">{{ $competitionName }}</div>

    <div class="el body" style="{{ $pos(500, 12.5) }}">
        Atas prestasinya sebagai <b>{{ $rankLabel }}</b> pada cabang <b>{{ $competitionName }}</b>
    </div>
    <div class="el body" style="{{ $pos(522, 12.5) }}">
        dalam {{ $eventName }} {{ $eventYear }} yang diselenggarakan dalam rangka {{ $occasion }} di {{ $venue }}.
    </div>

    {{-- Tanda tangan --}}
    <div class="el role" style="{{ $pos(562, 10.5, 240, 369.5) }}">{{ $signer1Role }}</div>
    <img src="{{ $assetPath('ttd-majid.png') }}" style="position:absolute;left:77.9mm;top:150.24mm;width:39.7mm;" alt="">
    <div class="el" style="{{ $line(640, 274.5, 464.5, $PALETTE['ink'], 0.29) }}"></div>
    <div class="el signame" style="{{ $pos(662, 13, 240, 369.5) }}">{!! $signer1Name ?: '&nbsp;' !!}</div>

    <div class="el role" style="{{ $pos(562, 10.5, 240, 753.5) }}">{{ $signer2Role }}</div>
    <img src="{{ $assetPath('ttd-rohman.png') }}" style="position:absolute;left:168.15mm;top:153.10mm;width:62.30mm;" alt="">
    <div class="el" style="{{ $line(640, 658.5, 848.5, $PALETTE['ink'], 0.29) }}"></div>
    <div class="el signame" style="{{ $pos(662, 13, 240, 753.5) }}">{!! $signer2Name ?: '&nbsp;' !!}</div>

    @if ($has('stempel.png'))
        <img src="{{ $assetPath('stempel.png') }}" style="position:absolute;left:201.0mm;top:141.5mm;width:33mm;opacity:0.88;" alt="">
    @endif

    {{-- Kaki --}}
    <div class="el" style="{{ $line(686, 62, 1063, $PALETTE['gold'], 0.26, 0.5) }}"></div>

    <div class="el foot" style="{{ $pos(706, 9.5, 420, 272, 'left') }}">Nomor: {{ $numberLine }}</div>
    <div class="el foots" style="{{ $pos(722, 9, 420, 272, 'left') }}">Diterbitkan {{ $issuedAt }}</div>

    <div class="el foots" style="{{ $pos(706, 9, 420, 851, 'right') }}">Diterbitkan secara elektronik oleh</div>
    <div class="el footb" style="{{ $pos(722, 9.5, 420, 851, 'right') }}">Panitia {{ $eventName }} {{ $eventYear }}</div>
</div>
</body>
</html>
