<?php

namespace Database\Seeders;

use App\Models\Event;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $event = Event::updateOrCreate(
            ['event_name' => 'Festival Pelajar Muslim', 'year' => 2026],
            [
                'is_active' => true,
                'theme_config' => [
                    'primary' => '#0f766e',
                    'secondary' => '#c9a45c',
                    'logo_url' => null,
                    'edition_title' => 'FPM XIV 2026',
                ],
            ],
        );

        // Pastikan hanya satu event aktif.
        Event::whereKeyNot($event->id)->update(['is_active' => false]);

        $event->setting()->updateOrCreate([], [
            'publish_scores' => false,
            'enable_certificates' => false,
            'admin_whatsapp' => '081234567890',
            'certificate_template_config' => [
                'bg_color' => '#ffffff',
                'text_color' => '#1e293b',
                'accent_color' => '#0f766e',
                'bg_image_url' => null,
                'show_logo' => true,
                'title' => 'Sertifikat Peserta',
            ],
        ]);
    }
}
