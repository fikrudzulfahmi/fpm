<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
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

        // Coba email dulu, lalu username. Keduanya unik di tabel users.
        $ok = Auth::attempt(['email' => $login, 'password' => $data['password']], $remember)
            || Auth::attempt(['username' => $login, 'password' => $data['password']], $remember);

        if (! $ok) {
            throw ValidationException::withMessages([
                'login' => 'Email/username atau kata sandi salah.',
            ]);
        }

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
