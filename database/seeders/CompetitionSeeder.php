<?php

namespace Database\Seeders;

use App\Models\Competition;
use App\Models\Event;
use Illuminate\Database\Seeder;

class CompetitionSeeder extends Seeder
{
    /**
     * Cabang resmi FPM XII sesuai poster panitia (Harlah ke-59 SMKS Islam 1
     * Kota Blitar). `slug` ditulis eksplisit supaya tautan publik stabil.
     * Kuota adalah nilai awal — panitia dapat mengubahnya di Manajemen Lomba.
     */
    public const COMPETITIONS = [
        ['name' => 'Sholawat', 'slug' => 'sholawat', 'type' => 'group', 'global' => 15, 'school' => 1, 'min' => 5, 'max' => 12, 'desc' => 'Penampilan grup sholawat/rebana perwakilan sekolah.'],
        ['name' => 'Kaligrafi', 'slug' => 'kaligrafi', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Karya khat dengan kaidah naskhi, tsuluts, dan diwani.'],
        ['name' => 'Da\'i Muda', 'slug' => 'dai-muda', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Pidato dakwah bertema moderasi beragama.'],
        ['name' => 'Pop Religi', 'slug' => 'pop-religi', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Lomba menyanyi lagu bernuansa religi.'],
        ['name' => 'Musabaqah Tilawatil Qur\'an', 'slug' => 'musabaqah-tilawatil-quran', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Seni baca Al-Quran dengan lagu mujawwad.'],
        ['name' => 'Olimpiade Matematika & IPA', 'slug' => 'olimpiade-matematika-ipa', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Olimpiade matematika dan IPA perwakilan sekolah.'],
    ];

    public function run(): void
    {
        $event = Event::current();

        if (! $event) {
            $this->command?->warn('Tidak ada event aktif; CompetitionSeeder dilewati.');

            return;
        }

        foreach (self::COMPETITIONS as $i => $row) {
            Competition::updateOrCreate(
                ['event_id' => $event->id, 'slug' => $row['slug']],
                [
                    'name' => $row['name'],
                    'category_type' => $row['type'],
                    'global_quota' => $row['global'],
                    'school_quota' => $row['school'],
                    'min_group_members' => $row['min'],
                    'max_group_members' => $row['max'],
                    'is_open' => true,
                    'sort_order' => $i + 1,
                    'description' => $row['desc'],
                ],
            );
        }
    }
}
