<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoreCriterionValue extends Model
{
    protected $fillable = ['score_id', 'criterion_id', 'value'];

    protected $casts = [
        'value' => 'float',
    ];

    public function score(): BelongsTo
    {
        return $this->belongsTo(Score::class);
    }

    public function criterion(): BelongsTo
    {
        return $this->belongsTo(ScoreCriterion::class, 'criterion_id');
    }
}
