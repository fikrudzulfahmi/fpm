<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Score;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ScoreController extends Controller
{
    /**
     * Daftar pendaftaran disetujui untuk satu cabang lomba + nilainya.
     */
    public function index(Request $request): Response
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $competitionId = $request->integer('competition_id') ?: null;

        $competitions = Competition::where('event_id', $event->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'category_type', 'gender_mode']);

        $competitionId ??= $competitions->first()?->id;

        $active = $competitions->firstWhere('id', $competitionId);
        $separate = ($active->gender_mode ?? 'mixed') === 'separate';

        $rows = collect();

        if ($competitionId) {
            $rows = Registration::with([
                'participants:id,registration_id,full_name,nisn',
                'score',
                'school:id,school_name',
            ])
                ->where('event_id', $event->id)
                ->where('competition_id', $competitionId)
                ->where('status', 'approved')
                ->get()
                ->map(fn (Registration $r) => [
                    'id' => $r->id,
                    'display_name' => $r->displayName(),
                    'group_name' => $r->group_name,
                    'school' => $r->school?->school_name,
                    'participants' => $r->participants->pluck('full_name')->values(),
                    'gender' => $r->gender,
                    'gender_label' => $r->genderLabel(),
                    'performance_number' => $r->performance_number,
                    'score_value' => $r->score?->score_value,
                    'rank' => $r->score?->rank,
                    'is_published' => (bool) $r->score?->is_published,
                ])
                ->sortBy(fn ($row) => [
                    $separate ? ($row['gender'] === 'P' ? 1 : 0) : 0,
                    $row['rank'] ?? PHP_INT_MAX,
                    $row['id'],
                ])
                ->values();
        }

        $setting = $event->setting();

        return Inertia::render('Admin/Score/Index', [
            'competitions' => $competitions,
            'competition_id' => $competitionId,
            'registrations' => $rows,
            'publish_scores' => (bool) $setting->publish_scores,
            'gender_mode' => $separate ? 'separate' : 'mixed',
        ]);
    }

    /**
     * Simpan/ubah satu nilai lalu hitung ulang peringkat cabang lomba itu.
     */
    public function upsert(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'competition_id' => ['required', 'integer', 'exists:competitions,id'],
            'registration_id' => ['required', 'integer', 'exists:registrations,id'],
            'score_value' => ['required', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $competition = Competition::where('event_id', $event->id)->findOrFail($data['competition_id']);

        $registration = Registration::where('event_id', $event->id)
            ->where('competition_id', $competition->id)
            ->find($data['registration_id']);

        if (! $registration) {
            throw ValidationException::withMessages([
                'registration_id' => 'Pendaftaran tidak termasuk cabang lomba ini.',
            ]);
        }

        if (! $registration->isApproved()) {
            throw ValidationException::withMessages([
                'registration_id' => 'Nilai hanya bisa diberikan untuk pendaftaran yang sudah disetujui.',
            ]);
        }

        $publishScores = (bool) $event->setting()->publish_scores;

        DB::transaction(function () use ($data, $competition, $publishScores) {
            Score::updateOrCreate(
                ['registration_id' => $data['registration_id']],
                [
                    'competition_id' => $competition->id,
                    'score_value' => $data['score_value'],
                    'notes' => $data['notes'] ?? null,
                    'is_published' => $publishScores,
                ]
            );

            $this->recalculateRanks($competition, $publishScores);
        });

        return back()->with('success', 'Nilai tersimpan dan peringkat diperbarui.');
    }

    /**
     * Buka/tutup publikasi nilai untuk event aktif. competition_id hanya
     * dipakai untuk menyelaraskan flag is_published pada baris skor cabang itu.
     */
    public function publish(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'competition_id' => ['required', 'integer', 'exists:competitions,id'],
            'publish' => ['nullable', 'boolean'],
        ]);

        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $competition = Competition::where('event_id', $event->id)->findOrFail($data['competition_id']);
        $setting = $event->setting();

        $next = $request->has('publish')
            ? (bool) $data['publish']
            : ! $setting->publish_scores;

        $setting->update(['publish_scores' => $next]);

        Score::where('competition_id', $competition->id)
            ->update(['is_published' => $next]);

        return back()->with(
            'success',
            $next ? 'Nilai cabang lomba ini dipublikasikan.' : 'Publikasi nilai cabang lomba ini ditutup.'
        );
    }

    /**
     * Peringkat 1..n berdasarkan nilai tertinggi; seri diberi nomor urut
     * tetap (id dipakai sebagai pemecah supaya hasil stabil).
     */
    private function recalculateRanks(Competition $competition, bool $publishScores): void
    {
        $scores = Score::where('competition_id', $competition->id)
            ->with('registration:id,gender')
            ->orderByDesc('score_value')
            ->orderBy('registration_id')
            ->get();

        // Kategori terpisah (Putra/Putri) punya peringkat sendiri-sendiri.
        $groups = $competition->isSeparateGender()
            ? $scores->groupBy(fn (Score $score) => $score->registration?->gender ?? '-')
            : collect(['all' => $scores]);

        foreach ($groups as $group) {
            $rank = 0;
            $previous = null;
            $position = 0;

            foreach ($group->sortBy([['score_value', 'desc'], ['registration_id', 'asc']]) as $score) {
                $position++;

                if ($previous === null || $score->score_value < $previous) {
                    $rank = $position;
                }

                $score->forceFill([
                    'rank' => $rank,
                    'is_published' => $publishScores,
                ])->save();

                $previous = $score->score_value;
            }
        }
    }
}
