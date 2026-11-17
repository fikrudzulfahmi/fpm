<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Score;
use App\Models\ScoreCriterion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Kriteria penilaian per cabang lomba — hanya panitia penuh.
 *
 * Satu request menyimpan seluruh daftar (tambah/ubah/hapus) supaya editor
 * kriteria di panel admin cukup satu tombol simpan.
 */
class CriterionController extends Controller
{
    public function sync(Request $request, Competition $competition): RedirectResponse
    {
        abort_unless($request->user()->canManage(), 403, 'Kriteria penilaian khusus panitia penuh.');

        $event = Event::current();
        abort_if(! $event || (int) $competition->event_id !== (int) $event->id, 404);

        $data = $request->validate([
            'criteria' => ['present', 'array', 'max:12'],
            'criteria.*.id' => ['nullable', 'integer'],
            'criteria.*.name' => ['required', 'string', 'max:120'],
            'criteria.*.weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'criteria.*.max_value' => ['required', 'numeric', 'min:1', 'max:1000'],
        ]);

        $names = collect($data['criteria'])->map(fn ($row) => mb_strtolower(trim($row['name'])));

        if ($names->duplicates()->isNotEmpty()) {
            throw ValidationException::withMessages([
                'criteria' => 'Nama kriteria tidak boleh sama dalam satu cabang.',
            ]);
        }

        DB::transaction(function () use ($competition, $data) {
            $keep = [];

            foreach (array_values($data['criteria']) as $index => $row) {
                $criterion = ! empty($row['id'])
                    ? $competition->criteria()->find($row['id'])
                    : null;

                $criterion ??= new ScoreCriterion(['competition_id' => $competition->id]);

                $criterion->fill([
                    'competition_id' => $competition->id,
                    'name' => trim($row['name']),
                    'weight' => $row['weight'],
                    'max_value' => $row['max_value'],
                    'sort_order' => $index,
                ])->save();

                $keep[] = $criterion->id;
            }

            // Hapus kriteria yang tidak lagi ada di daftar (nilai terkait ikut hilang).
            $competition->criteria()->whereNotIn('id', $keep)->delete();

            // Nilai akhir dihitung ulang dari kriteria. Koreksi nilai tunggal
            // (legacy) tidak dihapus, hanya tidak dipakai selama cabang punya
            // kriteria — jadi menghapus kriteria mengembalikan kondisi semula.
            if (! empty($keep)) {
                $criteria = $competition->criteria()->get();
                $controller = app(ScoreController::class);

                Score::where('competition_id', $competition->id)->get()->each(function (Score $score) use ($criteria, $controller) {
                    $score->forceFill([
                        'score_value' => $controller->scoreFromCriteria($score, $criteria),
                    ])->save();
                });
            }
        });

        return back()->with('success', 'Kriteria penilaian disimpan.');
    }
}
