{{--
    Sertifikat SATU peserta (per anggota). Dipanggil dari
    CertificateController::perParticipant().
    Variabel: $registration, $peserta, $school, $competition,
              $registrationEvent, $theme, $config, $setting

    Tata letak mengikuti sertifikat utama (config['layout']); berkas ini hanya
    mengganti nama, NISN, dan nomor dokumen.
--}}
@php
    $namesOverride = collect([$peserta->full_name ?: ($registration->group_name ?? '-')]);
    $schoolLineNisn = $peserta->nisn ?? null;
    $footerSuffix = '/'.str_pad((string) $peserta->id, 4, '0', STR_PAD_LEFT);
@endphp
@include('pdf.certificate')
