<?php

use App\Models\Event;
use Illuminate\Database\Migrations\Migration;

/**
 * Menyelaraskan identitas & warna event aktif dengan poster FPM XII.
 *
 * Hanya mengubah nilai bawaan seeder (nama umum, teal/emas lama) agar tema
 * panel dan halaman publik memakai hijau–emas FPM; warna yang sudah diubah
 * panitia dibiarkan.
 */
return new class extends Migration
{
    public function up(): void
    {
        $event = Event::query()->where('is_active', true)->latest('year')->first()
            ?? Event::query()->latest('year')->first();

        if (! $event) {
            return;
        }

        if ($event->event_name === 'Festival Pelajar Muslim') {
            $event->event_name = 'Festival Pelajar Muslim XII';
        }

        $theme = $event->theme_config ?: [];
        $dirty = false;

        if (($theme['primary'] ?? null) === '#0f766e') {
            $theme['primary'] = '#064b3d';
            $dirty = true;
        }

        if (($theme['secondary'] ?? null) === '#c9a45c') {
            $theme['secondary'] = '#f3d95b';
            $dirty = true;
        }

        if (str_contains((string) ($theme['edition_title'] ?? ''), 'XIV')) {
            $theme['edition_title'] = 'FPM XII 2026';
            $dirty = true;
        }

        if ($dirty) {
            $event->theme_config = $theme;
        }

        if ($event->isDirty()) {
            $event->save();
        }

        $setting = $event->setting();
        $changed = false;

        // Nomor bawaan seeder demo diganti kontak panitia pada poster.
        if (in_array($setting->admin_whatsapp, [null, '', '081234567890'], true)) {
            $setting->admin_whatsapp = '0857-5548-1643';
            $changed = true;
        }

        $certificate = $setting->certificate_template_config ?: [];
        if (($certificate['accent_color'] ?? null) === '#0f766e') {
            $certificate['accent_color'] = '#064b3d';
            $setting->certificate_template_config = $certificate;
            $changed = true;
        }

        $award = $setting->award_config ?: [];
        if (($award['accent_color'] ?? null) === '#0f766e') {
            $award['accent_color'] = '#064b3d';
            $setting->award_config = $award;
            $changed = true;
        }

        if ($changed) {
            $setting->save();
        }
    }

    public function down(): void
    {
        //
    }
};
