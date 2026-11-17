<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSchool
{
    public function handle(Request $request, \Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isSchool() || ! $user->school_id) {
            abort(403, 'Halaman ini khusus akun sekolah.');
        }

        return $next($request);
    }
}
