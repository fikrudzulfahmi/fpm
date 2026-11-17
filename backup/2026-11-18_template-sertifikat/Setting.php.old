<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setting extends Model
{
    protected $fillable = [
        'event_id', 'publish_scores', 'enable_certificates',
        'certificate_template_config', 'award_config', 'admin_whatsapp',
    ];

    protected $casts = [
        'publish_scores' => 'boolean',
        'enable_certificates' => 'boolean',
        'certificate_template_config' => 'array',
        'award_config' => 'array',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Penanda tangan bawaan: Ketua Panitia (akun panitia penuh pertama).
     * Peran juri tidak lagi dipakai, jadi tanda tangan tidak bergantung pada juri.
     */
    public static function defaultSignerName(): string
    {
        return User::query()
            ->where('role', 'admin')
            ->where('access_level', 'full')
            ->where('is_active', true)
            ->orderBy('id')
            ->value('name') ?? 'Ketua Panitia';
    }

    /**
     * Konfigurasi template sertifikat default.
     */
    public function certificateConfig(): array
    {
        $cfg = $this->certificate_template_config ?: [];

        return [
            'bg_color' => $cfg['bg_color'] ?? '#ffffff',
            'text_color' => $cfg['text_color'] ?? '#1e293b',
            'accent_color' => $cfg['accent_color'] ?? '#0f766e',
            'bg_image_url' => $cfg['bg_image_url'] ?? null,
            'show_logo' => $cfg['show_logo'] ?? true,
            'title' => $cfg['title'] ?? 'Sertifikat Peserta',
            'subtitle' => $cfg['subtitle'] ?? 'Diberikan kepada',
            'footer' => $cfg['footer'] ?? null,
            'signer_name' => $cfg['signer_name'] ?? self::defaultSignerName(),
            'signer_title' => $cfg['signer_title'] ?? 'Ketua Panitia',
            'show_signature' => $cfg['show_signature'] ?? true,
            'paper' => $cfg['paper'] ?? 'landscape',
            'layout' => array_merge(self::defaultLayout('certificate'), $cfg['layout'] ?? []),
        ];
    }

    /**
     * Setelan piagam juara.
     */
    public function awardConfig(): array
    {
        $cfg = $this->award_config ?: [];

        return [
            'bg_color' => $cfg['bg_color'] ?? '#ffffff',
            'text_color' => $cfg['text_color'] ?? '#1e293b',
            'accent_color' => $cfg['accent_color'] ?? '#0f766e',
            'bg_image_url' => $cfg['bg_image_url'] ?? null,
            'show_logo' => $cfg['show_logo'] ?? true,
            'signer_name' => $cfg['signer_name'] ?? self::defaultSignerName(),
            'signer_title' => $cfg['signer_title'] ?? 'Ketua Panitia',
            'place' => $cfg['place'] ?? null,
            'number_prefix' => $cfg['number_prefix'] ?? null,
            'layout' => array_merge(self::defaultLayout('award'), $cfg['layout'] ?? []),
        ];
    }

    /**
     * Tata letak bawaan editor sertifikat/piagam: koordinat persen area dalam bingkai.
     * Dipakai bersama oleh Blade PDF dan editor drag-and-drop.
     */
    public static function defaultLayout(string $type): array
    {
        if ($type === 'award') {
            return [
                'logo' => ['x' => 4, 'y' => 4, 'w' => 9, 'size' => 0, 'align' => 'left'],
                'badge' => ['x' => 80, 'y' => 4, 'w' => 12, 'size' => 14, 'align' => 'center'],
                'kicker' => ['x' => 14, 'y' => 6, 'w' => 56, 'size' => 11, 'align' => 'center'],
                'event' => ['x' => 10, 'y' => 13, 'w' => 64, 'size' => 14, 'align' => 'center'],
                'title' => ['x' => 8, 'y' => 21, 'w' => 72, 'size' => 30, 'align' => 'center'],
                'competition' => ['x' => 8, 'y' => 33, 'w' => 72, 'size' => 18, 'align' => 'center'],
                'given_to' => ['x' => 20, 'y' => 43, 'w' => 56, 'size' => 11, 'align' => 'center'],
                'name' => ['x' => 10, 'y' => 48, 'w' => 76, 'size' => 26, 'align' => 'center'],
                'school' => ['x' => 15, 'y' => 60, 'w' => 66, 'size' => 12, 'align' => 'center'],
                'members' => ['x' => 10, 'y' => 66, 'w' => 76, 'size' => 9, 'align' => 'center'],
                'body' => ['x' => 12, 'y' => 71, 'w' => 72, 'size' => 11, 'align' => 'center'],
                'meta' => ['x' => 6, 'y' => 92, 'w' => 55, 'size' => 9, 'align' => 'left'],
                'signature' => ['x' => 64, 'y' => 80, 'w' => 30, 'size' => 10, 'align' => 'center'],
            ];
        }

        return [
            'logo' => ['x' => 4, 'y' => 4, 'w' => 9, 'size' => 0, 'align' => 'left'],
            'kicker' => ['x' => 20, 'y' => 6, 'w' => 60, 'size' => 11, 'align' => 'center'],
            'event' => ['x' => 15, 'y' => 12, 'w' => 70, 'size' => 15, 'align' => 'center'],
            'title' => ['x' => 10, 'y' => 20, 'w' => 80, 'size' => 34, 'align' => 'center'],
            'given_to' => ['x' => 20, 'y' => 39, 'w' => 60, 'size' => 11, 'align' => 'center'],
            'name' => ['x' => 10, 'y' => 45, 'w' => 80, 'size' => 24, 'align' => 'center'],
            'school' => ['x' => 15, 'y' => 56, 'w' => 70, 'size' => 12, 'align' => 'center'],
            'competition' => ['x' => 10, 'y' => 63, 'w' => 80, 'size' => 15, 'align' => 'center'],
            'body' => ['x' => 12, 'y' => 71, 'w' => 76, 'size' => 11, 'align' => 'center'],
            'signature' => ['x' => 64, 'y' => 80, 'w' => 30, 'size' => 10, 'align' => 'center'],
            'footer' => ['x' => 6, 'y' => 92, 'w' => 55, 'size' => 9, 'align' => 'left'],
        ];
    }
}
