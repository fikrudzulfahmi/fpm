<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Score;
use App\Models\ScoreCriterion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ScoreController extends Controller
{
    /**
     * Daftar pendaftaran disetujui untuk satu cabang lomba + nilai per kriteria.
     *
     * PJ Lomba hanya melihat cabang lombanya sendiri dan tidak melihat nilai
     * hasil koreksi panitia (katrol) — angka itu wewenang panitia penuh.
     */
    public function index(Request $request): Response
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $user = $request->user();
        $canAdjust = $user->canManage();
        $isPj = $user->isPjOnly();
        $scopedId = $isPj ? ($user->competition_id ?: null) : null;

        $competitionsQuery = Competition::where('event_id', $event->id)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($scopedId) {
            $competitionsQuery->whereKey($scopedId);
        }

        $competitions = ($isPj && ! $scopedId)
            ? collect()
            : $competitionsQuery->get(['id', 'name', 'category_type', 'gender_mode']);

        $competitionId = $isPj
            ? $scopedId
            : ($request->integer('competition_id') ?: null);

        $competitionId ??= $competitions->first()?->id;

        $active = $competitions->firstWhere('id', $competitionId);
        $separate = ($active->gender_mode ?? 'mixed') === 'separate';

        $criteria = $competitionId
            ? ScoreCriterion::where('competition_id', $competitionId)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(['id', 'name', 'weight', 'max_value'])
                ->map(fn (ScoreCriterion $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'weight' => (float) $c->weight,
                    'max_value' => (float) $c->max_value,
                ])
                ->values()
            : collect();

        $rows = collect();

        if ($competitionId) {
            $rows = Registration::with([
                'participants:id,registration_id,full_name,nisn',
                'score.criterionValues',
                'score.adjustedBy:id,name',
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
                    'final_value' => $r->score?->finalValue(),
                    'rank' => $r->score?->rank,
                    'is_published' => (bool) $r->score?->is_published,
                    'values' => $r->score
                        ? $r->score->criterionValues->mapWithKeys(
                            fn ($v) => [(string) $v->criterion_id => (float) $v->value]
                        )
                        : (object) [],
                    // Data koreksi hanya untuk panitia penuh.
                    'adjusted_value' => $canAdjust ? $r->score?->adjusted_value : null,
                    'adjust_reason' => $canAdjust ? $r->score?->adjust_reason : null,
                    'adjusted_by' => $canAdjust ? $r->score?->adjustedBy?->name : null,
                    'adjusted_at' => $canAdjust ? $r->score?->adjusted_at?->toIso8601String() : null,
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
            'criteria' => $criteria,
            'registrations' => $rows,
            'publish_scores' => (bool) $setting->publish_scores,
            'gender_mode' => $separate ? 'separate' : 'mixed',
            'can_adjust' => $canAdjust,
            'is_pj' => $isPj,
        ]);
    }

    /**
     * Simpan/ubah nilai (PJ Lomba / panitia). Bisa per kriteria atau nilai
     * tunggal bila cabang belum punya kriteria. Dipakai autosave di klien.
     */
    public function upsert(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'competition_id' => ['required', 'integer', 'exists:competitions,id'],
            'registration_id' => ['required', 'integer', 'exists:registrations,id'],
            'score_value' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'criterion_values' => ['nullable', 'array'],
            'criterion_values.*' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $user = $request->user();

        if ($user->isPjOnly() && (int) $user->competition_id !== (int) $data['competition_id']) {
            abort(403, 'Anda hanya bisa menilai cabang lomba yang menjadi tanggung jawab Anda.');
        }

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

        $criteria = $competition->criteria()->get();
        $values = collect($data['criterion_values'] ?? [])
            ->mapWithKeys(fn ($value, $key) => [(int) $key => (float) $value]);

        if ($criteria->isEmpty() && ! isset($data['score_value'])) {
            throw ValidationException::withMessages([
                'score_value' => 'Isi nilai untuk cabang ini.',
            ]);
        }

        $scoreValue = $criteria->isNotEmpty()
            ? $this->weightedScore($criteria, $values)
            : (float) $data['score_value'];

        $publishScores = (bool) $event->setting()->publish_scores;

        DB::transaction(function () use ($data, $competition, $criteria, $values, $scoreValue, $publishScores) {
            $score = Score::updateOrCreate(
                ['registration_id' => $data['registration_id']],
                [
                    'competition_id' => $competition->id,
                    'score_value' => $scoreValue,
                    'notes' => $data['notes'] ?? null,
                    'is_published' => $publishScores,
                ]
            );

            if ($criteria->isNotEmpty()) {
                foreach ($criteria as $criterion) {
                    $value = max(0, min((float) ($values[$criterion->id] ?? 0), $criterion->safeMax()));

                    $score->criterionValues()->updateOrCreate(
                        ['criterion_id' => $criterion->id],
                        ['value' => $value]
                    );
                }

                $score->criterionValues()
                    ->whereNotIn('criterion_id', $criteria->pluck('id'))
                    ->delete();
            }

            $this->recalculateRanks($competition, $publishScores);
        });

        return back();
    }

    /**
     * Koreksi nilai akhir oleh panitia penuh (mis. penyesuaian promosi sekolah).
     * Wajib menyertakan alasan; jejak koreksi disimpan untuk audit.
     */
    public function adjust(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canManage(), 403, 'Koreksi nilai khusus panitia penuh.');

        $data = $request->validate([
            'competition_id' => ['required', 'integer', 'exists:competitions,id'],
            'registration_id' => ['required', 'integer', 'exists:registrations,id'],
            'adjusted_value' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'adjust_reason' => ['nullable', 'string', 'min:5', 'max:500', 'required_with:adjusted_value'],
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

        $score = Score::firstWhere('registration_id', $registration->id);
        abort_if(! $score, 422, 'Isi nilai dasar terlebih dahulu sebelum mengoreksi.');

        $hasAdjustment = filled($data['adjusted_value'] ?? null);

        DB::transaction(function () use ($score, $data, $hasAdjustment, $competition) {
            $score->forceFill([
                'adjusted_value' => $hasAdjustment ? $data['adjusted_value'] : null,
                'adjust_reason' => $hasAdjustment ? $data['adjust_reason'] : null,
                'adjusted_by' => $hasAdjustment ? auth()->id() : null,
                'adjusted_at' => $hasAdjustment ? now() : null,
            ])->save();

            $this->recalculateRanks($competition, (bool) $competition->event?->setting()->publish_scores);
        });

        return back()->with(
            'success',
            $hasAdjustment ? 'Nilai akhir dikoreksi dan peringkat dihitung ulang.' : 'Koreksi nilai dibatalkan.'
        );
    }

    /**
     * Buka/tutup publikasi nilai untuk event aktif.
     */
    public function publish(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canManage(), 403, 'Publikasi nilai khusus panitia penuh.');

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
     * Nilai akhir berbobot: Σ((nilai/max) × bobot) / Σbobot × 100.
     */
    private function weightedScore(Collection $criteria, Collection $values): float
    {
        $totalWeight = (float) $criteria->sum(fn (ScoreCriterion $c) => $c->weight > 0 ? $c->weight : 1);

        if ($totalWeight <= 0) {
            return 0.0;
        }

        $accumulated = 0.0;

        foreach ($criteria as $criterion) {
            $weight = $criterion->weight > 0 ? (float) $criterion->weight : 1.0;
            $value = max(0, min((float) ($values[$criterion->id] ?? 0), $criterion->safeMax()));
            $accumulated += ($value / $criterion->safeMax()) * $weight;
        }

        return round(($accumulated / $totalWeight) * 100, 2);
    }

    /**
     * Peringkat 1..n berdasarkan nilai akhir (koreksi bila ada) tertinggi.
     */
    private function recalculateRanks(Competition $competition, bool $publishScores): void
    {
        $scores = Score::where('competition_id', $competition->id)
            ->with('registration:id,gender')
            ->orderByRaw('COALESCE(adjusted_value, score_value) DESC')
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

            $sorted = $group->sortBy([
                fn (Score $a, Score $b) => ($b->finalValue() ?? 0) <=> ($a->finalValue() ?? 0),
                fn (Score $a, Score $b) => $a->registration_id <=> $b->registration_id,
            ]);

            foreach ($sorted as $score) {
                $position++;
                $value = $score->finalValue();

                if ($previous === null || $value < $previous) {
                    $rank = $position;
                }

                $score->forceFill([
                    'rank' => $rank,
                    'is_published' => $publishScores,
                ])->save();

                $previous = $value;
            }
        }
    }
}
