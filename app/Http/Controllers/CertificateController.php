<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CertificateController extends Controller
{
    /**
     * Sertifikat peserta untuk satu pendaftaran (semua anggota dicetak
     * dalam satu lembar untuk lomba beregu).
     */
    public function participant(Request $request, Registration $registration): Response
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event aktif.');

        $setting = $event->setting();

        abort_unless(
            $setting->enable_certificates,
            403,
            'Sertifikat belum dibuka oleh panitia.'
        );

        $user = $request->user();

        if (! $user->isAdmin() && (int) $registration->school_id !== (int) $user->school_id) {
            abort(403, 'Sertifikat ini bukan milik sekolah Anda.');
        }

        abort_unless($registration->isApproved(), 403, 'Sertifikat hanya untuk pendaftaran yang disetujui.');

        $registration->load(['participants', 'competition', 'school', 'event']);

        $theme = $event->theme();
        $config = $setting->certificateConfig();
        $school = $registration->school;
        $competition = $registration->competition;
        $registrationEvent = $registration->event ?? $event;

        $pdf = Pdf::loadView('pdf.certificate', compact(
            'registration',
            'school',
            'competition',
            'registrationEvent',
            'theme',
            'config',
            'setting',
        ))->setPaper('a4', 'landscape');

        $slug = \Illuminate\Support\Str::slug(
            ($school?->school_name ?? 'sekolah').'-'.($competition?->slug ?? 'lomba').'-'.$registration->id
        );

        return $pdf->download("sertifikat-{$slug}.pdf");
    }

    /**
     * Piagam/sertifikat untuk SATU peserta dalam sebuah pendaftaran.
     * Dipakai saat lomba beregu: tiap anggota dapat lembarnya sendiri
     * (satu lembar berisi semua nama tidak selalu bisa dipotong rapi).
     */
    public function perParticipant(Request $request, Registration $registration, int $participant): Response
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event aktif.');

        $setting = $event->setting();
        abort_unless($setting->enable_certificates, 403, 'Sertifikat belum dibuka oleh panitia.');

        $user = $request->user();
        abort_if(! $user, 403);
        if (! $user->isAdmin() && (int) $registration->school_id !== (int) $user->school_id) {
            abort(403, 'Sertifikat ini bukan milik sekolah Anda.');
        }

        abort_unless($registration->isApproved(), 403, 'Sertifikat hanya untuk pendaftaran yang disetujui.');

        $registration->load(['participants', 'competition', 'school', 'event']);
        $peserta = $registration->participants->firstWhere('id', $participant);
        abort_if(! $peserta, 404, 'Peserta tidak termasuk pendaftaran ini.');

        $theme = $event->theme();
        $config = $setting->certificateConfig();
        $school = $registration->school;
        $competition = $registration->competition;
        $registrationEvent = $registration->event ?? $event;

        $pdf = Pdf::loadView('pdf.certificate-single', compact(
            'registration',
            'peserta',
            'school',
            'competition',
            'registrationEvent',
            'theme',
            'config',
            'setting',
        ))->setPaper('a4', 'landscape');

        $slug = \Illuminate\Support\Str::slug(
            ($peserta->full_name ?? 'peserta').'-'.($competition?->slug ?? 'lomba').'-'.$peserta->id
        );

        return $pdf->download("sertifikat-{$slug}.pdf");
    }

    /**
     * Piagam juara. Hanya panitia; peringkat harus sudah ada.
     */
    public function award(Registration $registration): Response
    {
        abort_unless(auth()->user()?->isAdmin(), 403, 'Hanya panitia yang dapat mencetak piagam.');

        $registration->load(['participants', 'competition', 'school', 'score', 'event']);

        $score = $registration->score;

        abort_if(
            ! $score || $score->rank === null,
            422,
            'Peringkat belum ditetapkan untuk pendaftaran ini.'
        );

        $event = $registration->event ?? Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $theme = $event->theme();
        $setting = $event->setting();
        $config = $setting->awardConfig();
        $competition = $registration->competition;
        $school = $registration->school;

        $pdf = Pdf::loadView('pdf.award', compact(
            'registration',
            'competition',
            'school',
            'score',
            'event',
            'theme',
            'config',
            'setting',
        ))->setPaper('a4', 'landscape');

        $slug = \Illuminate\Support\Str::slug(
            ($competition?->slug ?? 'lomba').'-juara-'.$score->rank.'-'.$registration->id
        );

        return $pdf->download("piagam-{$slug}.pdf");
    }
}
