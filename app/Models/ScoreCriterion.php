<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Kriteria penilaian satu cabang lomba (mis. "Tajwid" bobot 30, "Suara" bobot 40).
 */
class ScoreCriterion extends Model
{
    protected $fillable = ['competition_id', 'name', 'weight', 'max_value', 'sort_order'];

    protected $casts = [
        'weight' => 'float',
        'max_value' => 'float',
        'sort_order' => 'integer',
    ];

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(ScoreCriterionValue::class, 'criterion_id');
    }

    /**
     * Nilai maksimum aman (hindari pembagian nol).
     */
    public function safeMax(): float
    {
        return $this->max_value > 0 ? (float) $this->max_value : 100.0;
    }
}
