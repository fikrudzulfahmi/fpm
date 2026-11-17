<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Participant extends Model
{
    protected $fillable = ['registration_id', 'nisn', 'full_name', 'gender', 'birth_date', 'event_id'];

    protected $casts = ['birth_date' => 'date'];

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    /**
     * Cek apakah NISN sudah terdaftar di event tertentu (di luar peserta yang di-reject).
     * Mengembalikan data registrasi & lomba yang ditemukan atau null.
     */
    public static function findActiveInEvent(string $nisn, int $eventId): ?self
    {
        return static::query()
            ->where('nisn', $nisn)
            ->where('event_id', $eventId)
            ->whereHas('registration', fn (Builder $q) => $q->where('status', '!=', 'rejected'))
            ->with(['registration.competition:id,name'])
            ->first();
    }
}
