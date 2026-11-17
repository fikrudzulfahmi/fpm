<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Score extends Model
{
    protected $fillable = [
        'registration_id', 'competition_id', 'score_value', 'adjusted_value',
        'adjust_reason', 'adjusted_by', 'adjusted_at', 'rank', 'is_published', 'notes',
    ];

    protected $casts = [
        'score_value' => 'float',
        'adjusted_value' => 'float',
        'adjusted_at' => 'datetime',
        'rank' => 'integer',
        'is_published' => 'boolean',
    ];

    /**
     * Nilai yang dipakai untuk peringkat: hasil koreksi panitia bila ada.
     */
    public function finalValue(): ?float
    {
        return $this->adjusted_value ?? $this->score_value;
    }

    public function isAdjusted(): bool
    {
        return $this->adjusted_value !== null;
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function adjustedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }
}
