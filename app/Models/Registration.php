<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Registration extends Model
{
    protected $fillable = [
        'event_id', 'competition_id', 'school_id', 'group_name', 'gender',
        'performance_number', 'companion_name', 'companion_phone', 'recommendation_letter_path',
        'recommendation_letter_mime', 'ai_status', 'ai_notes',
        'status', 'rejection_reason', 'verified_at', 'verified_by',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'performance_number' => 'integer',
    ];

    public function genderLabel(): string
    {
        return Competition::genderLabel($this->gender);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(Participant::class);
    }

    public function score(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Score::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function displayName(): string
    {
        if ($this->competition?->isGroup()) {
            return $this->group_name ?? 'Grup Tanpa Nama';
        }

        return $this->participants()->first()?->full_name ?? '-';
    }
}
