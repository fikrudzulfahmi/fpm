<?php

namespace App\Http\Controllers;

use App\Models\Competition;
use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            // Akun juri langsung diarahkan ke halaman penilaian.
            if ($user->isJuriOnly()) {
                return redirect()->route('admin.nilai.index');
            }

            return $this->adminDashboard();
        }

        return $this->schoolDashboard($user);
    }

    private function adminDashboard(): Response
    {
        $event = Event::current();

        $totalRegistrations = 0;
        $pendingCount = 0;
        $approvedCount = 0;
        $perCompetition = [];

        if ($event) {
            $counts = Registration::where('event_id', $event->id)
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            $totalRegistrations = (int) $counts->sum();
            $pendingCount = (int) ($counts['pending'] ?? 0);
            $approvedCount = (int) ($counts['approved'] ?? 0);

            $perCompetition = Competition::where('event_id', $event->id)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(function (Competition $c) {
                    return [
                        'id' => $c->id,
                        'name' => $c->name,
                        'slug' => $c->slug,
                        'category_type' => $c->category_type,
                        'global_quota' => $c->global_quota,
                        'approved_count' => $c->approvedCount(),
                        'gender_mode' => $c->gender_mode,
                        'approved_putra' => $c->approvedCount('L'),
                        'approved_putri' => $c->approvedCount('P'),
                        'remaining_global' => $c->remainingGlobalQuota(),
                    ];
                })
                ->values();
        }

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_registrations' => $totalRegistrations,
                'pending_count' => $pendingCount,
                'approved_count' => $approvedCount,
                'per_competition' => $perCompetition,
            ],
        ]);
    }

    private function schoolDashboard($user): Response
    {
        $event = Event::current();

        $registrations = [];
        $enableCertificates = false;
        $publishScores = false;

        if ($event && $user->school_id) {
            $setting = $event->setting();
            $enableCertificates = $setting->enable_certificates;
            $publishScores = $setting->publish_scores;

            $registrations = Registration::with([
                'competition:id,name,slug,category_type,gender_mode',
                'participants:id,registration_id,nisn,full_name,gender',
                'score:id,registration_id,score_value,rank,is_published',
            ])
                ->where('event_id', $event->id)
                ->where('school_id', $user->school_id)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (Registration $r) => [
                    'id' => $r->id,
                    'display_name' => $r->displayName(),
                    'status' => $r->status,
                    'ai_status' => $r->ai_status,
                    'rejection_reason' => $r->rejection_reason,
                    'competition' => $r->competition ? [
                        'id' => $r->competition->id,
                        'name' => $r->competition->name,
                        'slug' => $r->competition->slug,
                        'category_type' => $r->competition->category_type,
                        'gender_mode' => $r->competition->gender_mode,
                    ] : null,
                    'gender_label' => $r->gender ? $r->genderLabel() : null,
                    'participants' => $r->participants->map(fn ($p) => [
                        'nisn' => $p->nisn,
                        'full_name' => $p->full_name,
                        'gender' => $p->gender,
                    ])->values(),
                    'score' => ($publishScores && $r->score) ? [
                        'score_value' => $r->score->score_value,
                        'rank' => $r->score->rank,
                        'is_published' => $r->score->is_published,
                    ] : null,
                    'created_at' => $r->created_at?->toIso8601String(),
                ])
                ->values();
        }

        return Inertia::render('School/Dashboard', [
            'registrations' => $registrations,
            'enable_certificates' => $enableCertificates,
            'publish_scores' => $publishScores,
        ]);
    }
}
