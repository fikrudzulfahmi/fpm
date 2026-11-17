<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoreCriterionValue extends Model
{
    protected $fillable = [
        'score_id', 'criterion_id', 'value',
        'adjusted_value', 'adjust_reason', 'adjusted_by', 'adjusted_at',
    ];

    protected $casts = [
        'value' => 'float',
        'adjusted_value' => 'float',
        'adjusted_at' => 'datetime',
    ];

    /**
     * Nilai yang dipakai untuk perhitungan & tampilan publik.
     */
    public function finalValue(): float
    {
        return (float) ($this->adjusted_value ?? $this->value);
    }

    public function isAdjusted(): bool
    {
        return $this->adjusted_value !== null;
    }

    public function adjustedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }

    public function score(): BelongsTo
    {
        return $this->belongsTo(Score::class);
    }

    public function criterion(): BelongsTo
    {
        return $this->belongsTo(ScoreCriterion::class, 'criterion_id');
    }
}
