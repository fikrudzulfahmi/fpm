<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Registration;
use App\Services\RecommendationVerifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function index(Request $request): Response
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $filters = $request->validate([
            'status' => ['nullable', 'in:pending,approved,rejected'],
            'competition_id' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:120'],
        ]);

        $query = Registration::with([
            'competition:id,name,slug,category_type',
            'school:id,npsn,school_name',
            'participants:id,registration_id,nisn,full_name',
        ])
            ->where('event_id', $event->id);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['competition_id'])) {
            $query->where('competition_id', $filters['competition_id']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('group_name', 'like', $term)
                    ->orWhereHas('school', fn ($s) => $s->where('school_name', 'like', $term))
                    ->orWhereHas('participants', fn ($p) => $p->where('full_name', 'like', $term)
                        ->orWhere('nisn', 'like', $term));
            });
        }

        $registrations = $query
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Registration $r) => [
                'id' => $r->id,
                'display_name' => $r->displayName(),
                'group_name' => $r->group_name,
                'status' => $r->status,
                'ai_status' => $r->ai_status,
                'school' => $r->school?->school_name,
                'competition' => $r->competition?->name,
                'participant_count' => $r->participants->count(),
                'created_at' => $r->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Registration/Index', [
            'registrations' => $registrations,
            'filters' => [
                'status' => $filters['status'] ?? null,
                'competition_id' => $filters['competition_id'] ?? null,
                'q' => $filters['q'] ?? null,
            ],
            'competitions' => Competition::where('event_id', $event->id)
                ->orderBy('sort_order')
                ->get(['id', 'name']),
            'counts' => [
                'pending' => Registration::where('event_id', $event->id)->where('status', 'pending')->count(),
                'approved' => Registration::where('event_id', $event->id)->where('status', 'approved')->count(),
                'rejected' => Registration::where('event_id', $event->id)->where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function show(Registration $registration): Response
    {
        $registration->load([
            'competition',
            'school',
            'event',
            'participants',
            'score',
        ]);

        return Inertia::render('Admin/Registration/Show', [
            'registration' => [
                'id' => $registration->id,
                'display_name' => $registration->displayName(),
                'status' => $registration->status,
                'ai_status' => $registration->ai_status,
                'ai_notes' => $registration->ai_notes,
                'rejection_reason' => $registration->rejection_reason,
                'group_name' => $registration->group_name,
                'companion_name' => $registration->companion_name,
                'companion_phone' => $registration->companion_phone,
                'has_letter' => (bool) $registration->recommendation_letter_path,
                'verified_at' => $registration->verified_at?->toIso8601String(),
                'verified_by' => $registration->verified_by,
                'created_at' => $registration->created_at?->toIso8601String(),
                'competition' => $registration->competition,
                'school' => $registration->school,
                'event' => $registration->event,
                'participants' => $registration->participants,
                'score' => $registration->score,
            ],
        ]);
    }

    public function approve(Request $request, Registration $registration): RedirectResponse
    {
        if ($registration->status !== 'approved') {
            // Kuota dihitung dari pending+approved, jadi pendaftaran yang
            // sempat ditolak bisa di-approve melewati batas kalau tidak dicek.
            $competition = $registration->competition;

            if ($competition) {
                $remaining = $competition->remainingGlobalQuota();

                if ($registration->status === 'rejected' && $remaining <= 0) {
                    return back()->withErrors([
                        'status' => 'Kuota cabang lomba ini sudah penuh, pendaftaran tidak bisa disetujui.',
                    ]);
                }

                if ($competition->remainingSchoolQuota((int) $registration->school_id) <= 0
                    && $registration->status === 'rejected') {
                    return back()->withErrors([
                        'status' => 'Kuota sekolah untuk cabang lomba ini sudah penuh.',
                    ]);
                }
            }
        }

        $registration->update([
            'status' => 'approved',
            'rejection_reason' => null,
            'verified_at' => now(),
            'verified_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Pendaftaran disetujui.');
    }

    public function reject(Request $request, Registration $registration): RedirectResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $registration->update([
            'status' => 'rejected',
            'rejection_reason' => $data['rejection_reason'],
            'verified_at' => now(),
            'verified_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Pendaftaran ditolak.');
    }

    /**
     * Jalankan ulang verifikasi AI secara sinkron (tombol "Cek ulang").
     */
    public function reverifyAi(Registration $registration, RecommendationVerifier $verifier): RedirectResponse
    {
        $verifier->verify($registration);
        $registration->refresh();

        $label = match ($registration->ai_status) {
            'valid' => 'Cocok',
            'warning' => 'Perlu dicek',
            'mismatch' => 'Tidak cocok',
            default => $registration->ai_status,
        };

        return back()->with('success', "Verifikasi AI selesai: {$label}.");
    }
}
