<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Batas percobaan masuk. Kunci pertama per akun+IP (mencegah menebak satu
     * akun), kunci kedua per IP (mencegah satu IP mencoba banyak akun).
     */
    private const MAX_ATTEMPTS_PER_ACCOUNT = 5;

    private const MAX_ATTEMPTS_PER_IP = 25;

    private const DECAY_SECONDS = 60;

    /**
     * Halaman login. Satu formulir untuk panitia maupun sekolah;
     * kolom "login" menerima email atau username.
     */
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember');
        $login = trim($data['login']);

        $accountKey = 'login:'.Str::transliterate(Str::lower($login)).'|'.$request->ip();
        $ipKey = 'login-ip:'.$request->ip();

        if (RateLimiter::tooManyAttempts($accountKey, self::MAX_ATTEMPTS_PER_ACCOUNT)
            || RateLimiter::tooManyAttempts($ipKey, self::MAX_ATTEMPTS_PER_IP)) {
            $seconds = max(1, RateLimiter::availableIn($accountKey), RateLimiter::availableIn($ipKey));

            throw ValidationException::withMessages([
                'login' => "Terlalu banyak percobaan masuk. Coba lagi dalam {$seconds} detik.",
            ]);
        }

        // Coba email dulu, lalu username. Keduanya unik di tabel users.
        $ok = Auth::attempt(['email' => $login, 'password' => $data['password']], $remember)
            || Auth::attempt(['username' => $login, 'password' => $data['password']], $remember);

        if (! $ok) {
            RateLimiter::hit($accountKey, self::DECAY_SECONDS);
            RateLimiter::hit($ipKey, self::DECAY_SECONDS);

            throw ValidationException::withMessages([
                'login' => 'Email/username atau kata sandi salah.',
            ]);
        }

        // Akun yang dinonaktifkan panitia tidak boleh memakai aplikasi.
        if (! Auth::user()->is_active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'login' => 'Akun ini dinonaktifkan. Hubungi panitia untuk mengaktifkan kembali.',
            ]);
        }

        RateLimiter::clear($accountKey);

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
