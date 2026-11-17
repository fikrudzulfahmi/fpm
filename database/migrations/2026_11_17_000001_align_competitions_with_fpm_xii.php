<?php

use App\Models\Competition;
use App\Models\Event;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Menyelaraskan cabang lomba dengan poster resmi FPM XII
 * (Harlah ke-59 SMKS Islam 1 Kota Blitar).
 *
 * Aman untuk data yang sudah dipakai: baris lama tidak dihapus bila sudah
 * memiliki pendaftaran, dan bila panitia sudah mengubah daftar cabang sendiri
 * migrasi ini hanya menambahkan cabang resmi yang belum ada.
 */
return new class extends Migration
{
    /** Slug bawaan CompetitionSeeder versi lama (data demo). */
    private const SEEDED_SLUGS = [
        'musabaqah-tilawatil-quran',
        'tahfidz-juz-30',
        'pidato-bahasa-indonesia',
        'pidato-bahasa-inggris',
        'pidato-bahasa-arab',
        'kaligrafi-islam',
        'cerdas-cermat-pai',
        'rebana-banjari',
    ];

    /** Cabang resmi sesuai poster. */
    private const OFFICIAL = [
        ['slug' => 'sholawat', 'name' => 'Sholawat', 'type' => 'group', 'global' => 15, 'school' => 1, 'min' => 5, 'max' => 12, 'desc' => 'Penampilan grup sholawat/rebana perwakilan sekolah.'],
        ['slug' => 'kaligrafi', 'name' => 'Kaligrafi', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Karya khat dengan kaidah naskhi, tsuluts, dan diwani.'],
        ['slug' => 'dai-muda', 'name' => "Da'i Muda", 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Pidato dakwah bertema moderasi beragama.'],
        ['slug' => 'pop-religi', 'name' => 'Pop Religi', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Lomba menyanyi lagu bernuansa religi.'],
        ['slug' => 'musabaqah-tilawatil-quran', 'name' => "Musabaqah Tilawatil Qur'an", 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Seni baca Al-Quran dengan lagu mujawwad.'],
        ['slug' => 'olimpiade-matematika-ipa', 'name' => 'Olimpiade Matematika & IPA', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Olimpiade matematika dan IPA perwakilan sekolah.'],
    ];

    /** Padanan slug lama → slug resmi (menjaga pendaftaran tetap menempel). */
    private const MAP = [
        'rebana-banjari' => 'sholawat',
        'kaligrafi-islam' => 'kaligrafi',
        'pidato-bahasa-indonesia' => 'dai-muda',
        'tahfidz-juz-30' => 'pop-religi',
        'musabaqah-tilawatil-quran' => 'musabaqah-tilawatil-quran',
        'cerdas-cermat-pai' => 'olimpiade-matematika-ipa',
    ];

    public function up(): void
    {
        $event = Event::query()->where('is_active', true)->latest('year')->first()
            ?? Event::query()->latest('year')->first();

        if (! $event) {
            return;
        }

        $existing = $event->competitions()->get(['id', 'slug']);

        $untouched = $existing->isNotEmpty()
            && $existing->every(fn (Competition $c) => in_array($c->slug, self::SEEDED_SLUGS, true));

        // Panitia sudah menyusun cabangnya sendiri: jangan sentuh apa pun,
        // cukup lengkapi cabang resmi yang belum ada.
        if (! $untouched) {
            $this->ensureOfficialExists($event);

            return;
        }

        DB::transaction(function () use ($event) {
            foreach (self::OFFICIAL as $index => $row) {
                $oldSlug = array_search($row['slug'], self::MAP, true);

                $competition = $event->competitions()->where('slug', $oldSlug)->first()
                    ?? $event->competitions()->where('slug', $row['slug'])->first();

                $payload = [
                    'name' => $row['name'],
                    'slug' => $row['slug'],
                    'category_type' => $row['type'],
                    'global_quota' => $row['global'],
                    'school_quota' => $row['school'],
                    'min_group_members' => $row['min'],
                    'max_group_members' => $row['max'],
                    'is_open' => true,
                    'sort_order' => $index + 1,
                    'description' => $row['desc'],
                ];

                if ($competition) {
                    $competition->update($payload);
                } else {
                    $event->competitions()->create($payload);
                }
            }

            // Sisa cabang demo yang tidak masuk daftar resmi: hapus hanya jika
            // belum punya pendaftaran sama sekali.
            $leftovers = array_values(array_diff(self::SEEDED_SLUGS, array_keys(self::MAP)));

            $event->competitions()
                ->whereIn('slug', $leftovers)
                ->get()
                ->each(function (Competition $competition) {
                    if ($competition->registrations()->exists()) {
                        $competition->update(['is_open' => false]);
                        Log::info('Cabang demo dipertahankan karena punya pendaftaran', [
                            'competition_id' => $competition->id,
                            'slug' => $competition->slug,
                        ]);

                        return;
                    }

                    $competition->delete();
                });
        });
    }

    /**
     * Rollback tidak menghapus data; cukup jalankan seeder bila ingin
     * mengembalikan daftar cabang demo.
     */
    public function down(): void
    {
        //
    }

    private function ensureOfficialExists(Event $event): void
    {
        foreach (self::OFFICIAL as $index => $row) {
            $event->competitions()->firstOrCreate(
                ['slug' => $row['slug']],
                [
                    'name' => $row['name'],
                    'category_type' => $row['type'],
                    'global_quota' => $row['global'],
                    'school_quota' => $row['school'],
                    'min_group_members' => $row['min'],
                    'max_group_members' => $row['max'],
                    'is_open' => true,
                    'sort_order' => $index + 1,
                    'description' => $row['desc'],
                ],
            );
        }
    }
};
