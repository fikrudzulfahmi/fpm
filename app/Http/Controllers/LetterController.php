<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LetterController extends Controller
{
    /**
     * Sajikan surat rekomendasi yang tersimpan di disk privat.
     *
     * Sebelumnya berkas ini terekspos lewat route otomatis Laravel
     * (`storage/{path}` karena `serve => true`), sehingga siapa pun yang tahu
     * path-nya bisa mengunduh dokumen berisi data siswa. Sekarang akses wajib
     * login: admin boleh semua, sekolah hanya miliknya sendiri.
     */
    public function show(Request $request, Registration $registration): StreamedResponse
    {
        $user = $request->user();
        abort_if(! $user, 403);

        if (! $user->isAdmin() && (int) $registration->school_id !== (int) $user->school_id) {
            abort(403, 'Surat ini bukan milik sekolah Anda.');
        }

        $path = $registration->recommendation_letter_path;
        abort_if(! $path, 404, 'Pendaftaran ini tidak menyertakan surat rekomendasi.');

        $disk = Storage::disk('local');
        abort_unless($disk->exists($path), 404, 'Berkas surat tidak ditemukan.');

        $name = 'surat-rekomendasi-'.$registration->id.'.'.pathinfo($path, PATHINFO_EXTENSION);

        return $disk->response($path, $name, [
            'Content-Type' => $registration->recommendation_letter_mime ?: 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$name.'"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
