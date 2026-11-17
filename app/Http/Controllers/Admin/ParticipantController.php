<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Peserta per cabang lomba: rekap jumlah pendaftar, daftar peserta, dan undian
 * nomor tampil. Dipisahkan dari menu Penilaian supaya tugas panitia jelas.
 */
class ParticipantController extends Controller
{
    public function index(): Response
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event aktif.');

        $competitions = $event->competitions()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (Competition $c) {
                $base = $c->registrations();

                $total = (clone $base)->count();
                $approved = (clone $base)->where('status', 'approved')->count();
                $pending = (clone $base)->where('status', 'pending')->count();
                $rejected = (clone $base)->where('status', 'rejected')->count();
                $drawn = (clone $base)->whereNotNull('performance_number')->count();

                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'category_type' => $c->category_type,
                    'gender_mode' => $c->gender_mode,
                    'global_quota' => $c->global_quota,
                    'school_quota' => $c->school_quota,
                    'is_open' => (bool) $c->is_open,
                    'total' => $total,
                    'approved' => $approved,
                    'pending' => $pending,
                    'rejected' => $rejected,
                    'drawn' => $drawn,
                    'has_order' => $approved > 0 && $drawn >= $approved,
                ];
            })
            ->values();

        return Inertia::render('Admin/Participant/Index', [
            'event' => [
                'id' => $event->id,
                'event_name' => $event->event_name,
                'year' => $event->year,
            ],
            'competitions' => $competitions,
            'totals' => [
                'competitions' => $competitions->count(),
                'registrations' => $competitions->sum('total'),
                'approved' => $competitions->sum('approved'),
                'pending' => $competitions->sum('pending'),
            ],
        ]);
    }

    public function show(Competition $competition): Response
    {
        $event = Event::current();
        abort_if(! $event || (int) $competition->event_id !== (int) $event->id, 404);

        $registrations = $competition->registrations()
            ->with([
                'school:id,school_name,npsn',
                'participants:id,registration_id,full_name,nisn',
            ])
            ->orderByRaw('performance_number IS NULL, performance_number')
            ->orderBy('id')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'display_name' => $r->displayName(),
                'group_name' => $r->group_name,
                'school' => $r->school?->school_name,
                'npsn' => $r->school?->npsn,
                'status' => $r->status,
                'gender' => $r->gender,
                'gender_label' => $r->gender ? $r->genderLabel() : null,
                'performance_number' => $r->performance_number,
                'participant_count' => $r->participants->count(),
                'members' => $r->participants->pluck('full_name')->values(),
                'nisn_list' => $r->participants->pluck('nisn')->filter()->values(),
                'created_at' => $r->created_at?->translatedFormat('d M Y'),
            ])
            ->values();

        return Inertia::render('Admin/Participant/Show', [
            'event' => [
                'id' => $event->id,
                'event_name' => $event->event_name,
                'year' => $event->year,
            ],
            'competition' => [
                'id' => $competition->id,
                'name' => $competition->name,
                'slug' => $competition->slug,
                'category_type' => $competition->category_type,
                'gender_mode' => $competition->gender_mode,
                'global_quota' => $competition->global_quota,
                'school_quota' => $competition->school_quota,
                'min_group_members' => $competition->min_group_members,
                'max_group_members' => $competition->max_group_members,
                'is_open' => (bool) $competition->is_open,
            ],
            'registrations' => $registrations,
            'stats' => [
                'total' => $registrations->count(),
                'approved' => $registrations->where('status', 'approved')->count(),
                'pending' => $registrations->where('status', 'pending')->count(),
                'drawn' => $registrations->whereNotNull('performance_number')->count(),
            ],
        ]);
    }

    /**
     * Undian nomor tampil. Peserta disetujui diacak lalu diberi nomor:
     * kategori terpisah memakai ganjil untuk Putra dan genap untuk Putri;
     * kategori campuran memakai 1..n.
     */
    public function draw(Competition $competition): RedirectResponse
    {
        $event = Event::current();
        abort_if(! $event || (int) $competition->event_id !== (int) $event->id, 404);

        $registrations = $competition->registrations()
            ->where('status', 'approved')
            ->get(['id', 'gender']);

        if ($registrations->isEmpty()) {
            return back()->with('error', 'Belum ada pendaftaran disetujui untuk diundi.');
        }

        if ($competition->isSeparateGender() && $registrations->contains(fn ($r) => blank($r->gender))) {
            return back()->with('error', 'Ada pendaftaran tanpa data gender; lengkapi dulu sebelum undian.');
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
            "Urutan tampil {$competition->name} berhasil diundi ({$registrations->count()} peserta)."
        );
    }
}
