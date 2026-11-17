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
        'name', 'email', 'password', 'school_id', 'username', 'whatsapp',
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

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSchool(): bool
    {
        return $this->role === 'school';
    }

    /**
     * Akun juri: boleh masuk area penilaian saja.
     */
    public function isJuriOnly(): bool
    {
        return $this->role === 'admin' && $this->access_level === 'juri';
    }

    /**
     * Boleh mengelola data induk (sekolah, event, akun, sertifikat).
     */
    public function canManage(): bool
    {
        return $this->isAdmin() && ! $this->isJuriOnly() && $this->is_active;
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
