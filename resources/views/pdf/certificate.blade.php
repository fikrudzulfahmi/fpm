{{--
    Sertifikat peserta — template resmi "Sertifikat FPM XII".

    Desain mengikuti SVG panitia (A4 landscape 1123×794 px, palet hijau #064b3d /
    emas #c9a227 / krem #f8f6ec): bingkai tiga lapis, ornamen sudut, strip logo di
    kepala, blok nama besar, dua tanda tangan + stempel, dan kaki nomor/tanggal.

    Koordinat diambil langsung dari SVG (px × 0.26446 = mm, px × 0.75 = pt), jadi
    hasil cetak identik dengan desain. Berkas di public/branding/certificate/:
      logo-strip.png   (opsional, strip 6 logo — dipakai bila ada)
      stempel.png      (opsional)
      ttd-majid.png, ttd-rohman.png, logo-fpm.png, dots.png, corner-*.png

    Variabel: $registration, $school, $competition, $registrationEvent, $theme,
              $config, $setting (+ $namesOverride, $schoolLineNisn, $footerSuffix
              dari certificate-single.blade.php)
--}}
@php
    $k = 0.26446;                    // px SVG → mm
    $mm = fn ($px) => round($px * $k, 3);

    $PALETTE = [
        'ink' => '#0d3029',
        'green' => '#064b3d',
        'green2' => '#0a5b4a',
        'gold' => '#c9a227',
        'gold-dark' => '#8a6b12',
        'muted' => '#5c6e67',
        'body' => '#3b4f48',
        'line' => '#d9b84a',
    ];

    $title = $config['title'] ?? 'Sertifikat Peserta';

    // Nama peserta (perorangan atau anggota regu).
    $names = $namesOverride ?? $registration->participants->pluck('full_name')->filter()->values();
    $groupName = $registration->group_name;
    $displayName = $names->isNotEmpty() ? $names->implode(' • ') : ($groupName ?: '-');
    $nameLen = mb_strlen($displayName);
    $namePx = match (true) {
        $nameLen > 44 => 22,
        $nameLen > 34 => 26,
        $nameLen > 26 => 31,
        $nameLen > 20 => 36,
        default => 42,
    };

    $eventName = $registrationEvent->event_name ?? 'Festival Pelajar Muslim';
    $eventYear = $registrationEvent->year ?? date('Y');
    $schoolName = $school->school_name ?? '-';
    $competitionName = $competition->name ?? '-';
    // NISN: dari peserta tunggal (sertifikat per anggota) atau peserta pertama regu.
    $nisnAll = $registration->participants->pluck('nisn')->filter()->unique()->values();
    if (isset($schoolLineNisn)) {
        $nisnLine = $schoolLineNisn ?: null;
    } elseif ($nisnAll->count() === 1) {
        $nisnLine = $nisnAll->first();
    } elseif ($nisnAll->count() > 1) {
        $nisnLine = $nisnAll->first().' dkk';
    } else {
        $nisnLine = null;
    }

    $occasion = config('fpm.occasion_short') ?? 'Harlah SMKS Islam 1 Kota Blitar';
    $venue = config('fpm.venue.name') ?? 'SMKS Islam 1 Kota Blitar';

    $footerSuffix = $footerSuffix ?? '';
    $defaultNumber = 'SRF/'.$eventYear.'/'.str_pad((string) $registration->id, 5, '0', STR_PAD_LEFT).$footerSuffix;
    $footerNumber = trim((string) ($config['footer'] ?? ''));
    if ($footerNumber === '' || ! preg_match('/\d/', $footerNumber)) {
        $footerNumber = $defaultNumber;
    }
    $issuedAt = now()->locale('id')->translatedFormat('d F Y');

    $signer1Role = $config['signer_title'] ?: 'Ketua Panitia';
    $signer1Name = $config['signer_name'] ?: '';
    $signer2Role = $config['signer2_title'] ?: 'Sekretaris Panitia';
    $signer2Name = $config['signer2_name'] ?: '';

    // DomPDF di Linux memakai slash; normalisasi agar aman juga saat dev di Windows.
    $assetPath = fn (string $file) => str_replace('\\', '/', public_path('branding/certificate/'.$file));
    $has = fn (string $file) => file_exists($assetPath($file));

    $stripLogo = $has('logo-strip.png') ? $assetPath('logo-strip.png') : null;
    $logoFpm = $assetPath('logo-fpm.png');
    $bgImage = $config['bg_image_url'] ?? null;
    $showLogo = $config['show_logo'] ?? true;
    $showSignature = $config['show_signature'] ?? true;

    // Kotak teks: $y = baseline SVG, $size = ukuran font SVG (px).
    $pos = function (float $y, float $size, float $width = 1040, float $center = 561.5, string $align = 'center'): string {
        $k = 0.26446;
        $left = $center - $width / 2;
        $top = $y - $size * 1.02;

        return sprintf(
            'left:%.3fmm;top:%.3fmm;width:%.3fmm;font-size:%.2fpt;text-align:%s;',
            $left * $k,
            $top * $k,
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
    <title>{{ $title }} — {{ $displayName }}</title>
    <style>
        @page { margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: "DejaVu Sans", sans-serif; color: {{ $PALETTE['ink'] }}; }
        .sheet {
            position: relative;
            width: 297mm;
            height: 210mm;
            background: #f8f6ec;
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
        .f2 { left: 8.73mm; top: 8.73mm; width: 279.5mm; height: 192.5mm; border: 0.32mm solid {{ $PALETTE['gold'] }}; }
        .f3 { left: 10.84mm; top: 10.84mm; width: 275.3mm; height: 188.3mm; border: 0.21mm solid #d8d5c6; }
        .el { position: absolute; line-height: 1; }
        .kicker { color: {{ $PALETTE['gold-dark'] }}; font-weight: bold; letter-spacing: 6pt; text-transform: uppercase; }
        .event { color: {{ $PALETTE['ink'] }}; font-weight: bold; letter-spacing: 0.6pt; }
        .title { color: {{ $PALETTE['green'] }}; font-weight: bold; letter-spacing: 1.9pt; text-transform: uppercase; }
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
        .diamond { color: {{ $PALETTE['gold'] }}; }
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

    {{-- Kepala: strip logo pendukung (bila tersedia) --}}
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

    {{-- Judul --}}
    <div class="el kicker" style="{{ $pos(196, 10.5) }}">Sertifikat</div>
    <div class="el event" style="{{ $pos(222, 15) }}">{{ $eventName }} &middot; {{ $eventYear }}</div>

    <div class="el title" style="{{ $pos(272, 34) }}">{{ $title }}</div>

    <div class="el" style="{{ $line(292, 431, 691, $PALETTE['gold'], 0.48) }}"></div>
    <div class="el diamond" style="{{ $pos(299, 10, 40) }}">&#9670;</div>

    {{-- Data peserta --}}
    <div class="el given" style="{{ $pos(330, 12.5) }}">Diberikan kepada</div>
    <div class="el" style="{{ $line(326, 318, 470, $PALETTE['gold'], 0.26, 0.5) }}"></div>
    <div class="el" style="{{ $line(326, 653, 805, $PALETTE['gold'], 0.26, 0.5) }}"></div>

    <div class="el name" style="{{ $pos(378, $namePx) }}">{{ $displayName }}</div>
    <div class="el" style="{{ $line(396, 301.5, 821.5, $PALETTE['gold'], 0.32) }}"></div>

    <div class="el school" style="{{ $pos(422, 12.5) }}">
        @if ($nisnLine) NISN {{ $nisnLine }} &middot; @endif{{ $schoolName }}
    </div>

    <div class="el comp" style="{{ $pos(460, 19) }}">{{ $competitionName }}</div>

    <div class="el body" style="{{ $pos(494, 12.5) }}">
        Atas partisipasinya dalam kegiatan <b>{{ $eventName }} {{ $eventYear }}</b>
    </div>
    <div class="el body" style="{{ $pos(516, 12.5) }}">
        yang diselenggarakan dalam rangka {{ $occasion }} di {{ $venue }}.
    </div>

    {{-- Tanda tangan --}}
    @if ($showSignature)
        <div class="el role" style="{{ $pos(556, 10.5, 240, 369.5) }}">{{ $signer1Role }}</div>
        <img src="{{ $assetPath('ttd-majid.png') }}" style="position:absolute;left:77.9mm;top:148.66mm;width:39.7mm;" alt="">
        <div class="el" style="{{ $line(636, 274.5, 464.5, $PALETTE['ink'], 0.29) }}"></div>
        <div class="el signame" style="{{ $pos(658, 13, 240, 369.5) }}">{!! $signer1Name ?: '&nbsp;' !!}</div>

        <div class="el role" style="{{ $pos(556, 10.5, 240, 753.5) }}">{{ $signer2Role }}</div>
        <img src="{{ $assetPath('ttd-rohman.png') }}" style="position:absolute;left:168.15mm;top:151.50mm;width:62.30mm;" alt="">
        <div class="el" style="{{ $line(636, 658.5, 848.5, $PALETTE['ink'], 0.29) }}"></div>
        <div class="el signame" style="{{ $pos(658, 13, 240, 753.5) }}">{!! $signer2Name ?: '&nbsp;' !!}</div>

        @if ($has('stempel.png'))
            <img src="{{ $assetPath('stempel.png') }}" style="position:absolute;left:215.27mm;top:139.11mm;width:30.68mm;opacity:0.87;" alt="">
        @endif
    @endif

    {{-- Kaki --}}
    <div class="el" style="{{ $line(682, 62, 1063, $PALETTE['gold'], 0.26, 0.5) }}"></div>

    <div class="el foot" style="{{ $pos(704, 9.5, 420, 272, 'left') }}">Nomor: {{ $footerNumber }}</div>
    <div class="el foots" style="{{ $pos(720, 9, 420, 272, 'left') }}">Diterbitkan {{ $issuedAt }}</div>

    <div class="el foots" style="{{ $pos(704, 9, 420, 851, 'right') }}">Diterbitkan secara elektronik oleh</div>
    <div class="el footb" style="{{ $pos(720, 9.5, 420, 851, 'right') }}">Panitia {{ $eventName }} {{ $eventYear }}</div>
</div>
</body>
</html>
