<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Membatasi area manajemen (sekolah, akun, event, sertifikat) hanya untuk
 * panitia penuh. Akun juri tetap bisa masuk area penilaian.
 */
class EnsureFullAdmin
{
    public function handle(Request $request, \Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->canManage()) {
            abort(403, 'Halaman ini khusus panitia penuh.');
        }

        return $next($request);
    }
}
