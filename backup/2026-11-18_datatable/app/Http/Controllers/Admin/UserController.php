<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Akun panitia & PJ Lomba. Akun sekolah dikelola dari menu Sekolah (lewat klaim).
 *
 * - Panitia penuh (access_level "full"): seluruh menu.
 * - PJ Lomba (access_level "pj"): hanya daftar peserta + input nilai untuk
 *   satu cabang lomba yang ditugaskan.
 */
class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));
        $event = Event::current();

        $users = User::query()
            ->with('competition:id,name')
            ->where('role', 'admin')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            })
            ->orderByRaw("FIELD(access_level, 'full', 'pj')")
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'whatsapp' => $user->whatsapp,
                'access_level' => $user->access_level,
                'competition_id' => $user->competition_id,
                'competition_name' => $user->competition?->name,
                'is_active' => (bool) $user->is_active,
                'is_self' => $user->id === auth()->id(),
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        $competitions = $event
            ? Competition::where('event_id', $event->id)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name'])
            : collect();

        return Inertia::render('Admin/User/Index', [
            'users' => $users,
            'competitions' => $competitions,
            'filters' => ['q' => $search],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatePayload($request);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'],
            'whatsapp' => $data['whatsapp'] ?? null,
            'password' => $data['password'],
            'role' => 'admin',
            'access_level' => $data['access_level'],
            'competition_id' => $data['access_level'] === 'pj' ? $data['competition_id'] : null,
            'is_juri' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Akun dibuat.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->isAdmin(), 404);

        $data = $this->validatePayload($request, $user);

        $this->guardSelfLockout($user, $data);

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'],
            'whatsapp' => $data['whatsapp'] ?? null,
            'access_level' => $data['access_level'],
            'competition_id' => $data['access_level'] === 'pj' ? $data['competition_id'] : null,
            'is_juri' => false,
            'is_active' => (bool) $data['is_active'],
        ]);

        return back()->with('success', 'Akun diperbarui.');
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->isAdmin(), 404);

        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        return back()->with('success', "Password {$user->username} direset.");
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_unless($user->isAdmin(), 404);

        if ($user->id === auth()->id()) {
            return back()->with('error', 'Tidak bisa menghapus akun sendiri.');
        }

        $remainingManagers = User::where('role', 'admin')
            ->where('access_level', 'full')
            ->where('is_active', true)
            ->whereKeyNot($user->id)
            ->count();

        if ($user->canManage() && $remainingManagers === 0) {
            return back()->with('error', 'Harus ada minimal satu panitia penuh yang aktif.');
        }

        $user->delete();

        return back()->with('success', 'Akun dihapus.');
    }

    private function validatePayload(Request $request, ?User $user = null): array
    {
        // Pilihan cabang yang kosong dikirim sebagai "" oleh <select>.
        $request->merge(['competition_id' => $request->input('competition_id') ?: null]);

        $uniqueEmail = Rule::unique('users', 'email');
        $uniqueUsername = Rule::unique('users', 'username');

        if ($user) {
            $uniqueEmail->ignore($user->id);
            $uniqueUsername->ignore($user->id);
        }

        $rules = [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', $uniqueEmail],
            'username' => ['required', 'string', 'min:3', 'max:40', 'alpha_dash', $uniqueUsername],
            'whatsapp' => ['nullable', 'string', 'max:30'],
            'access_level' => ['required', 'in:full,pj'],
            'competition_id' => ['nullable', 'integer', 'exists:competitions,id', 'required_if:access_level,pj'],
        ];

        if (! $user) {
            $rules['password'] = ['required', 'string', 'min:8', 'confirmed'];
        } else {
            $rules['is_active'] = ['required', 'boolean'];
        }

        return $request->validate($rules);
    }

    /**
     * Cegah admin mengunci dirinya sendiri (nonaktif / turun jadi PJ Lomba).
     */
    private function guardSelfLockout(User $user, array $data): void
    {
        if ($user->id !== auth()->id()) {
            return;
        }

        $lockingOut = $data['access_level'] === 'pj' || ! (bool) $data['is_active'];

        if ($lockingOut) {
            throw ValidationException::withMessages([
                'access_level' => 'Anda tidak bisa menurunkan atau menonaktifkan akun sendiri.',
            ]);
        }
    }
}
