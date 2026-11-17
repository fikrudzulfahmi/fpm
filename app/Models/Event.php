<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Event extends Model
{
    protected $fillable = ['event_name', 'year', 'is_active', 'theme_config'];

    protected $casts = [
        'is_active' => 'boolean',
        'theme_config' => 'array',
        'year' => 'integer',
    ];

    protected $attributes = [
        'is_active' => false,
        'theme_config' => '{}',
    ];

    public function competitions(): HasMany
    {
        return $this->hasMany(Competition::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(Setting::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Event aktif tunggal; kalau tidak ada yang ditandai aktif, jatuh ke
     * event terbaru supaya halaman publik tidak blank.
     */
    public static function current(): ?self
    {
        return static::query()->where('is_active', true)->latest('year')->first()
            ?? static::query()->latest('year')->first();
    }

    public function setting(): Setting
    {
        return $this->settings()->firstOrCreate([], [
            'publish_scores' => false,
            'enable_certificates' => false,
        ]);
    }

    /**
     * Tema default dipakai kalau admin belum mengisi theme_config.
     */
    public function theme(): array
    {
        $cfg = $this->theme_config ?: [];

        return [
            'primary' => $cfg['primary'] ?? '#064b3d',
            'secondary' => $cfg['secondary'] ?? '#f3d95b',
            'logo_url' => $cfg['logo_url'] ?? null,
            'edition_title' => $cfg['edition_title'] ?? $this->event_name,
        ];
    }
}
