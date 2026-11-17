<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'school_id', 'competition_id', 'username', 'whatsapp',
        'role', 'access_level', 'is_juri', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_juri' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Cabang lomba yang menjadi tanggung jawab akun PJ Lomba.
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSchool(): bool
    {
        return $this->role === 'school';
    }

    /**
     * Akun PJ Lomba: hanya mengelola penilaian cabang lombanya sendiri.
     */
    public function isPjOnly(): bool
    {
        return $this->role === 'admin' && $this->access_level === 'pj';
    }

    /**
     * Boleh mengelola data induk (sekolah, event, akun, sertifikat).
     */
    public function canManage(): bool
    {
        return $this->isAdmin() && ! $this->isPjOnly() && $this->is_active;
    }

    /**
     * ID cabang yang boleh dinilai akun ini (null = semua cabang, khusus panitia).
     */
    public function scopedCompetitionId(): ?int
    {
        return $this->isPjOnly() ? $this->competition_id : null;
    }

    protected static function booted(): void
    {
        // Jaga konsistensi dua arah schools.user_id <-> users.school_id.
        static::saved(function (self $user) {
            if ($user->school_id && $user->role === 'school') {
                School::whereKey($user->school_id)->update([
                    'is_claimed' => true,
                    'user_id' => $user->id,
                ]);
            }
        });
    }
}
