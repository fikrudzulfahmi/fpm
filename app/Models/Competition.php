<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Competition extends Model
{
    protected $fillable = [
        'event_id', 'name', 'slug', 'category_type', 'gender_mode', 'global_quota',
        'school_quota', 'min_group_members', 'max_group_members',
        'is_open', 'sort_order', 'description',
    ];

    protected $casts = [
        'global_quota' => 'integer',
        'school_quota' => 'integer',
        'min_group_members' => 'integer',
        'max_group_members' => 'integer',
        'is_open' => 'boolean',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * Kriteria penilaian cabang ini (disusun panitia).
     */
    public function criteria(): HasMany
    {
        return $this->hasMany(ScoreCriterion::class, 'competition_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function isGroup(): bool
    {
        return $this->category_type === 'group';
    }

    /** Cabang lomba dipisah menjadi kategori Putra dan Putri. */
    public function isSeparateGender(): bool
    {
        return $this->gender_mode === 'separate';
    }

    public static function genderLabel(?string $gender): string
    {
        return match ($gender) {
            'L' => 'Putra',
            'P' => 'Putri',
            default => 'Campuran',
        };
    }

    /**
     * Peserta yang sudah memakai slot kuota: pendaftaran yang tidak ditolak.
     * Bila cabang lomba memisahkan gender, hitungan dibatasi ke gender itu.
     */
    public function approvedCount(?string $gender = null): int
    {
        return $this->registrations()
            ->whereIn('status', ['pending', 'approved'])
            ->when($this->isSeparateGender() && $gender, fn ($q) => $q->where('gender', $gender))
            ->count();
    }

    public function remainingGlobalQuota(?string $gender = null): int
    {
        return max(0, $this->global_quota - $this->approvedCount($gender));
    }

    public function remainingSchoolQuota(int $schoolId, ?string $gender = null): int
    {
        $used = $this->registrations()
            ->where('school_id', $schoolId)
            ->whereIn('status', ['pending', 'approved'])
            ->when($this->isSeparateGender() && $gender, fn ($q) => $q->where('gender', $gender))
            ->count();

        return max(0, $this->school_quota - $used);
    }

    public function isFull(?string $gender = null): bool
    {
        return $this->remainingGlobalQuota($gender) <= 0;
    }
}
