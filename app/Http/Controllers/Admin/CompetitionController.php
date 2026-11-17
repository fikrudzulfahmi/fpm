<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manajemen cabang lomba untuk event aktif: kuota, jenis peserta,
 * status buka/tutup, dan urutan tampil.
 */
class CompetitionController extends Controller
{
    public function index(): Response
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event aktif.');

        $competitions = $event->competitions()
            ->withCount(['registrations as used_slots' => fn ($query) => $query
                ->whereIn('status', ['pending', 'approved'])])
            ->withCount(['registrations as total_registrations'])
            ->withCount('pjAccounts')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Competition $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'category_type' => $c->category_type,
                'gender_mode' => $c->gender_mode,
                'global_quota' => $c->global_quota,
                'school_quota' => $c->school_quota,
                'min_group_members' => $c->min_group_members,
                'max_group_members' => $c->max_group_members,
                'is_open' => (bool) $c->is_open,
                'sort_order' => $c->sort_order,
                'description' => $c->description,
                'used_slots' => $c->used_slots,
                'used_putra' => $c->registrations()->whereIn('status', ['pending', 'approved'])->where('gender', 'L')->count(),
                'used_putri' => $c->registrations()->whereIn('status', ['pending', 'approved'])->where('gender', 'P')->count(),
                'remaining_slots' => max(0, $c->global_quota - $c->used_slots),
                'total_registrations' => $c->total_registrations,
                'pj_count' => $c->pj_accounts_count,
            ]);

        return Inertia::render('Admin/Competition/Index', [
            'event' => [
                'id' => $event->id,
                'event_name' => $event->event_name,
                'year' => $event->year,
            ],
            'competitions' => $competitions,
            'stats' => [
                'total' => $competitions->count(),
                'open' => $competitions->where('is_open', true)->count(),
                'quota' => (int) $competitions->sum('global_quota'),
                'used' => (int) $competitions->sum('used_slots'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event aktif.');

        $data = $this->validated($request, $event);

        $event->competitions()->create($data);

        return redirect()->route('admin.competitions.index')
            ->with('success', 'Cabang lomba ditambahkan.');
    }

    public function update(Request $request, Competition $competition): RedirectResponse
    {
        $event = Event::current();
        abort_if(! $event || (int) $competition->event_id !== (int) $event->id, 404);

        $competition->update($this->validated($request, $event, $competition));

        return redirect()->route('admin.competitions.index')
            ->with('success', 'Cabang lomba diperbarui.');
    }

    /**
     * Buat akun PJ Lomba langsung untuk cabang ini (panitia penuh).
     */
    public function createPjAccount(Request $request, Competition $competition): RedirectResponse
    {
        $event = Event::current();
        abort_if(! $event || (int) $competition->event_id !== (int) $event->id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'username' => ['required', 'string', 'min:3', 'max:40', 'alpha_dash', 'unique:users,username'],
            'whatsapp' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'],
            'whatsapp' => $data['whatsapp'] ?? null,
            'password' => $data['password'],
            'role' => 'admin',
            'access_level' => 'pj',
            'competition_id' => $competition->id,
            'is_juri' => false,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        return back()->with(
            'success',
            "Akun PJ Lomba {$competition->name} dibuat: {$data['username']}."
        );
    }

    /**
     * Buka/tutup pendaftaran tanpa mengubah field lain.
     */
    public function toggleOpen(Competition $competition): RedirectResponse
    {
        $event = Event::current();
        abort_if(! $event || (int) $competition->event_id !== (int) $event->id, 404);

        $competition->update(['is_open' => ! $competition->is_open]);

        return back()->with(
            'success',
            $competition->is_open
                ? "Pendaftaran {$competition->name} dibuka."
                : "Pendaftaran {$competition->name} ditutup."
        );
    }

    public function destroy(Competition $competition): RedirectResponse
    {
        $event = Event::current();
        abort_if(! $event || (int) $competition->event_id !== (int) $event->id, 404);

        abort_if(
            $competition->registrations()->whereIn('status', ['pending', 'approved'])->exists(),
            422,
            'Cabang lomba masih memiliki pendaftaran aktif.'
        );

        // Hapus juga pendaftaran yang sudah ditolak agar tidak menyisakan data yatim.
        $competition->registrations()->delete();
        $competition->delete();

        return redirect()->route('admin.competitions.index')
            ->with('success', 'Cabang lomba dihapus.');
    }

    /**
     * Undian urutan tampil. Peserta disetujui diacak, lalu diberi nomor:
     * kategori terpisah memakai nomor ganjil untuk Putra dan genap untuk Putri;
     * kategori campuran memakai 1..n. Nomor disimpan di registrations.
     */
    public function drawOrder(Competition $competition): RedirectResponse
    {
        $event = Event::current();
        abort_if(! $event || (int) $competition->event_id !== (int) $event->id, 404);

        $registrations = $competition->registrations()
            ->where('status', 'approved')
            ->get(['id', 'gender']);

        if ($registrations->isEmpty()) {
            abort(422, 'Belum ada pendaftaran disetujui untuk diundi.');
        }

        if ($competition->isSeparateGender() && $registrations->contains(fn ($r) => blank($r->gender))) {
            abort(422, 'Ada pendaftaran tanpa data gender; lengkapi dulu sebelum undian.');
        }

        DB::transaction(function () use ($competition, $registrations) {
            $competition->registrations()->update(['performance_number' => null]);

            if ($competition->isSeparateGender()) {
                $putra = $registrations->where('gender', 'L')->shuffle()->values();
                $putri = $registrations->where('gender', 'P')->shuffle()->values();

                foreach ($putra as $i => $registration) {
                    $registration->forceFill(['performance_number' => $i * 2 + 1])->save();
                }

                foreach ($putri as $i => $registration) {
                    $registration->forceFill(['performance_number' => $i * 2 + 2])->save();
                }

                return;
            }

            foreach ($registrations->shuffle()->values() as $i => $registration) {
                $registration->forceFill(['performance_number' => $i + 1])->save();
            }
        });

        return back()->with(
            'success',
            "Urutan tampil {$competition->name} diundi ulang (".$registrations->count().' peserta).'
        );
    }

    /**
     * Aturan validasi bersama untuk simpan & ubah.
     */
    private function validated(Request $request, Event $event, ?Competition $competition = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:60', 'alpha_dash',
                Rule::unique('competitions', 'slug')
                    ->where('event_id', $event->id)
                    ->ignore($competition?->id)],
            'category_type' => ['required', 'in:individual,group'],
            'gender_mode' => ['required', 'in:mixed,separate'],
            'global_quota' => ['required', 'integer', 'min:1'],
            'school_quota' => ['required', 'integer', 'min:1'],
            'min_group_members' => ['nullable', 'integer', 'min:1'],
            'max_group_members' => ['nullable', 'integer', 'min:1', 'gte:min_group_members'],
            'is_open' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
        ], [
            'slug.alpha_dash' => 'Slug hanya boleh huruf, angka, tanda hubung, dan garis bawah.',
            'max_group_members.gte' => 'Anggota maksimal tidak boleh kurang dari anggota minimal.',
        ]);

        if ($data['category_type'] === 'group' && $data['gender_mode'] === 'separate') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'gender_mode' => 'Kategori Putra/Putri terpisah hanya untuk lomba individu.',
            ]);
        }

        if ($data['category_type'] === 'individual') {
            $data['min_group_members'] = null;
            $data['max_group_members'] = null;
        }

        $data['is_open'] = $request->boolean('is_open');
        $data['sort_order'] = $data['sort_order'] ?? 0;

        return $data;
    }
}
