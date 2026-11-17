<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Akun panitia & juri. Akun sekolah dikelola dari menu Sekolah (lewat klaim).
 */
class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));

        $users = User::query()
            ->where('role', 'admin')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            })
            ->orderByRaw("FIELD(access_level, 'full', 'juri')")
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'whatsapp' => $user->whatsapp,
                'access_level' => $user->access_level,
                'is_active' => (bool) $user->is_active,
                'is_self' => $user->id === auth()->id(),
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/User/Index', [
            'users' => $users,
            'filters' => ['q' => $search],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'username' => ['required', 'string', 'min:3', 'max:40', 'alpha_dash', 'unique:users,username'],
            'whatsapp' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'access_level' => ['required', 'in:full,juri'],
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'],
            'whatsapp' => $data['whatsapp'] ?? null,
            'password' => $data['password'],
            'role' => 'admin',
            'access_level' => $data['access_level'],
            'is_juri' => $data['access_level'] === 'juri',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Akun dibuat.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->isAdmin(), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'username' => ['required', 'string', 'min:3', 'max:40', 'alpha_dash',
                Rule::unique('users', 'username')->ignore($user->id)],
            'whatsapp' => ['nullable', 'string', 'max:30'],
            'access_level' => ['required', 'in:full,juri'],
            'is_active' => ['required', 'boolean'],
        ]);

        $this->guardSelfLockout($user, $data);

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'],
            'whatsapp' => $data['whatsapp'] ?? null,
            'access_level' => $data['access_level'],
            'is_juri' => $data['access_level'] === 'juri',
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

    /**
     * Cegah admin mengunci dirinya sendiri (nonaktif / turun jadi juri).
     */
    private function guardSelfLockout(User $user, array $data): void
    {
        if ($user->id !== auth()->id()) {
            return;
        }

        $lockingOut = $data['access_level'] === 'juri' || ! (bool) $data['is_active'];

        if ($lockingOut) {
            throw ValidationException::withMessages([
                'access_level' => 'Anda tidak bisa menurunkan atau menonaktifkan akun sendiri.',
            ]);
        }
    }
}
