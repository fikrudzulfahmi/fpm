<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Master data sekolah (NPSN) untuk klaim akun operator sekolah.
 */
class SchoolController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', '');

        $schools = School::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('school_name', 'like', "%{$search}%")
                        ->orWhere('npsn', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->when($status === 'claimed', fn ($query) => $query->where('is_claimed', true))
            ->when($status === 'unclaimed', fn ($query) => $query->where('is_claimed', false))
            ->with(['user:id,name,email,username,whatsapp'])
            ->withCount(['registrations' => fn ($query) => $query->whereIn('status', ['pending', 'approved'])])
            ->orderBy('school_name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (School $school) => [
                'id' => $school->id,
                'npsn' => $school->npsn,
                'school_name' => $school->school_name,
                'address' => $school->address,
                'is_claimed' => (bool) $school->is_claimed,
                'active_registrations' => $school->registrations_count,
                'account' => $school->user ? [
                    'id' => $school->user->id,
                    'name' => $school->user->name,
                    'email' => $school->user->email,
                    'username' => $school->user->username,
                    'whatsapp' => $school->user->whatsapp,
                ] : null,
            ]);

        return Inertia::render('Admin/School/Index', [
            'schools' => $schools,
            'filters' => ['q' => $search, 'status' => $status],
            'counts' => [
                'total' => School::count(),
                'claimed' => School::where('is_claimed', true)->count(),
                'unclaimed' => School::where('is_claimed', false)->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'npsn' => ['required', 'digits:8', 'unique:schools,npsn'],
            'school_name' => ['required', 'string', 'max:180'],
            'address' => ['nullable', 'string', 'max:255'],
        ], [
            'npsn.digits' => 'NPSN harus 8 digit angka.',
            'npsn.unique' => 'NPSN sudah terdaftar.',
        ]);

        School::create($data);

        return back()->with('success', 'Sekolah ditambahkan.');
    }

    public function update(Request $request, School $school): RedirectResponse
    {
        $data = $request->validate([
            'npsn' => ['required', 'digits:8', Rule::unique('schools', 'npsn')->ignore($school->id)],
            'school_name' => ['required', 'string', 'max:180'],
            'address' => ['nullable', 'string', 'max:255'],
        ], [
            'npsn.digits' => 'NPSN harus 8 digit angka.',
            'npsn.unique' => 'NPSN sudah dipakai sekolah lain.',
        ]);

        $school->update($data);

        return back()->with('success', 'Data sekolah diperbarui.');
    }

    public function destroy(School $school): RedirectResponse
    {
        if ($school->registrations()->exists()) {
            return back()->with('error', 'Sekolah sudah memiliki pendaftaran; hapus/arsipkan pendaftaran dulu.');
        }

        DB::transaction(function () use ($school) {
            User::where('school_id', $school->id)->where('role', 'school')->delete();

            // Lepas tautan akun supaya tidak ada FK menggantung.
            $school->user_id = null;
            $school->is_claimed = false;
            $school->save();
            $school->delete();
        });

        return back()->with('success', 'Sekolah dihapus.');
    }

    /**
     * Lepas klaim: akun operator dihapus, NPSN bisa diklaim ulang.
     */
    public function release(School $school): RedirectResponse
    {
        DB::transaction(function () use ($school) {
            User::where('school_id', $school->id)->where('role', 'school')->delete();

            $school->update(['is_claimed' => false, 'user_id' => null]);
        });

        return back()->with('success', "Klaim NPSN {$school->npsn} dilepas. Sekolah dapat klaim ulang.");
    }

    /**
     * Impor massal: satu baris = NPSN;Nama Sekolah;Alamat
     * Pemisah boleh titik koma, koma, atau tab. Baris NPSN ganda dilewati.
     */
    public function import(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'rows' => ['required', 'string', 'max:200000'],
        ]);

        $lines = preg_split('/\r\n|\r|\n/', $data['rows']) ?: [];
        $created = 0;
        $updated = 0;
        $skipped = 0;

        DB::transaction(function () use ($lines, &$created, &$updated, &$skipped) {
            foreach ($lines as $line) {
                $line = trim($line);

                if ($line === '') {
                    continue;
                }

                $parts = preg_split('/[;\t,]/', $line) ?: [];
                $npsn = preg_replace('/\D/', '', $parts[0] ?? '');
                $name = trim($parts[1] ?? '');
                $address = trim($parts[2] ?? '');

                if (strlen($npsn) !== 8 || $name === '') {
                    $skipped++;

                    continue;
                }

                $school = School::firstOrNew(['npsn' => $npsn]);

                if ($school->exists) {
                    // Jangan timpa sekolah yang sudah diklaim tanpa sengaja.
                    if ($school->is_claimed) {
                        $skipped++;

                        continue;
                    }
                    $school->school_name = $name;
                    $school->address = $address !== '' ? $address : $school->address;
                    $school->save();
                    $updated++;

                    continue;
                }

                $school->fill([
                    'school_name' => $name,
                    'address' => $address !== '' ? $address : null,
                    'is_claimed' => false,
                ])->save();
                $created++;
            }
        });

        if ($created === 0 && $updated === 0) {
            throw ValidationException::withMessages([
                'rows' => 'Tidak ada baris valid. Format: NPSN;Nama Sekolah;Alamat',
            ]);
        }

        return back()->with(
            'success',
            "Impor selesai: {$created} baru, {$updated} diperbarui, {$skipped} dilewati."
        );
    }
}
