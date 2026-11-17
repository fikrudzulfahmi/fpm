<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Paksa seluruh trafik produksi lewat HTTPS.
 *
 * Cookie sesi dan XSRF memakai atribut `secure`, jadi kalau halaman dibuka
 * lewat http:// browser tidak akan menyimpan/mengirim cookie tersebut:
 * login berakhir 419 "CSRF token mismatch" dan cek NPSN ikut gagal.
 *
 * Skema asli pengunjung dibaca dari header Cloudflare (CF-Visitor) karena di
 * balik proxy TLS-terminasi `$request->secure()` selalu bernilai true.
 */
class ForceHttps
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->environment('production') || $request->isSecure()) {
            return $next($request);
        }

        $scheme = $this->clientScheme($request);

        if ($scheme !== 'http') {
            return $next($request);
        }

        // GET/HEAD boleh dialihkan permanen; metode lain pakai 302 agar aman.
        $status = $request->isMethodSafe() ? 301 : 302;

        return redirect()->secure($request->getRequestUri(), $status);
    }

    /**
     * Skema yang dipakai browser pengunjung (bukan skema proxy).
     */
    private function clientScheme(Request $request): ?string
    {
        $visitor = (string) $request->headers->get('CF-Visitor');

        if ($visitor !== '' && preg_match('/"scheme"\s*:\s*"([^"]+)"/i', $visitor, $matches)) {
            return strtolower($matches[1]);
        }

        // Tanpa Cloudflare: percayai X-Forwarded-Proto dari proxy tepercaya.
        $forwarded = $request->headers->get('X-Forwarded-Proto');

        if ($forwarded) {
            return strtolower(trim(explode(',', $forwarded)[0]));
        }

        return $request->isSecure() ? 'https' : 'http';
    }
}
