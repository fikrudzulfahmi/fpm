<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClaimController extends Controller
{
    /**
     * Aturan panjang NPSN. NPSN asli di Indonesia 8 digit (sesuai data master
     * Dapodik/seeder). Ubah di satu tempat ini kalau formatnya berbeda.
     */
    private const NPSN_RULE = 'digits:8';

    public function index(): Response
    {
        return Inertia::render('Claim/Index', [
            'admin_whatsapp' => optional(Event::current()?->setting())->admin_whatsapp,
        ]);
    }

    /**
     * Cek ketersediaan NPSN sebelum formulir pendaftaran dibuka.
     */
    public function cek(Request $request): JsonResponse
    {
        $request->validate([
            'npsn' => ['required', 'string', self::NPSN_RULE],
        ]);

        $npsn = trim((string) $request->input('npsn'));
        $school = School::where('npsn', $npsn)->first();

        $adminWa = optional(Event::current()?->setting())->admin_whatsapp;

        if (! $school) {
            return response()->json([
                'status' => 'not_found',
                'school' => null,
                'admin_whatsapp' => $adminWa,
            ]);
        }

        return response()->json([
            'status' => $school->is_claimed ? 'claimed' : 'available',
            'school' => [
                'id' => $school->id,
                'npsn' => $school->npsn,
                'school_name' => $school->school_name,
            ],
            'admin_whatsapp' => $adminWa,
        ]);
    }

    /**
     * Daftarkan akun baru untuk sekolah yang belum diklaim.
     */
    public function daftar(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'npsn' => ['required', 'string', self::NPSN_RULE],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'username' => ['required', 'string', 'max:60', 'alpha_dash', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'whatsapp' => ['required', 'string', 'max:20'],
        ]);

        $user = DB::transaction(function () use ($data) {
            // Kunci baris sekolah supaya dua pendaftar bersamaan tidak sama-sama lolos.
            $school = School::where('npsn', trim($data['npsn']))->lockForUpdate()->first();

            if (! $school) {
                abort(422, 'NPSN tidak terdaftar di data sekolah panitia.');
            }

            if ($school->is_claimed || $school->user_id) {
                return null;
            }

            $created = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'username' => $data['username'],
                'password' => Hash::make($data['password']),
                'whatsapp' => $data['whatsapp'],
                'role' => 'school',
                'school_id' => $school->id,
            ]);

            // User::booted() menandai schools.is_claimed + user_id.
            return $created;
        });

        if (! $user) {
            return back()->withErrors([
                'npsn' => 'Sekolah ini sudah diklaim oleh akun lain. Hubungi panitia bila ada masalah.',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard')
            ->with('success', 'Akun sekolah berhasil dibuat. Lengkapi data lalu daftarkan peserta.');
    }
}
