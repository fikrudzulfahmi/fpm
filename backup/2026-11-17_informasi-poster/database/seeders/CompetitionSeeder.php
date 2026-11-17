<?php

namespace Database\Seeders;

use App\Models\Competition;
use App\Models\Event;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CompetitionSeeder extends Seeder
{
    /** Cabang lomba FPM beserta kuota global & kuota per sekolah. */
    public const COMPETITIONS = [
        ['name' => 'Musabaqah Tilawatil Quran', 'type' => 'individual', 'global' => 30, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Seni baca Al-Quran dengan lagu mujawwad.'],
        ['name' => 'Tahfidz Juz 30', 'type' => 'individual', 'global' => 40, 'school' => 3, 'min' => null, 'max' => null, 'desc' => 'Hafalan juz 30 dengan tajwid yang benar.'],
        ['name' => 'Pidato Bahasa Indonesia', 'type' => 'individual', 'global' => 25, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Pidato bertema moderasi beragama.'],
        ['name' => 'Pidato Bahasa Inggris', 'type' => 'individual', 'global' => 25, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Speech contest: islamic values in modern life.'],
        ['name' => 'Pidato Bahasa Arab', 'type' => 'individual', 'global' => 20, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Khitobah dengan bahasa Arab fushah.'],
        ['name' => 'Kaligrafi Islam', 'type' => 'individual', 'global' => 25, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Khat naskhi, tsuluts, dan diwani.'],
        ['name' => 'Cerdas Cermat PAI', 'type' => 'group', 'global' => 12, 'school' => 1, 'min' => 3, 'max' => 3, 'desc' => 'Satu tim 3 siswa per sekolah.'],
        ['name' => 'Rebana Banjari', 'type' => 'group', 'global' => 10, 'school' => 1, 'min' => 6, 'max' => 12, 'desc' => 'Grup hadrah/banjari min 6 max 12 siswa.'],
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
                ['event_id' => $event->id, 'slug' => Str::slug($row['name'])],
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
