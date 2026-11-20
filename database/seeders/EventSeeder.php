<?php

namespace Database\Seeders;

use App\Models\Event;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $event = Event::updateOrCreate(
            ['event_name' => 'Festival Pelajar Muslim XII', 'year' => 2026],
            [
                'is_active' => true,
                'theme_config' => [
                    'primary' => '#064b3d',
                    'secondary' => '#f3d95b',
                    'logo_url' => null,
                    'edition_title' => 'FPM XII 2026',
                ],
            ],
        );

        // Pastikan hanya satu event aktif.
        Event::whereKeyNot($event->id)->update(['is_active' => false]);

        $event->setting()->updateOrCreate([], [
            'publish_scores' => false,
            'enable_certificates' => false,
            'admin_whatsapp' => '0856-0858-9057',
            'certificate_template_config' => [
                'bg_color' => '#ffffff',
                'text_color' => '#1e293b',
                'accent_color' => '#064b3d',
                'bg_image_url' => null,
                'show_logo' => true,
                'title' => 'Sertifikat Peserta',
            ],
        ]);
    }
}
