<?php

use App\Models\Competition;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Score;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Merapikan daftar cabang setelah migrasi pertama:
 * cabang demo yang masih tersisa digabung ke cabang resmi FPM XII.
 *
 * Pendaftaran dan nilai TIDAK dihapus — hanya dipindahkan ke cabang resmi,
 * lalu baris cabang duplikat dihapus. Berlaku untuk slug demo yang dikenal
 * saja, sehingga cabang buatan panitia tidak tersentuh.
 */
return new class extends Migration
{
    /** slug lama → slug resmi. */
    private const DUPLICATES = [
        'tahfidz-juz-30' => 'pop-religi',
        'pidato-bahasa-indonesia' => 'dai-muda',
        'pidato-bahasa-inggris' => 'dai-muda',
        'pidato-bahasa-arab' => 'dai-muda',
        'kaligrafi-islam' => 'kaligrafi',
        'rebana-banjari' => 'sholawat',
        'cerdas-cermat-pai' => 'olimpiade-matematika-ipa',
        'cerdas-cermat-ipas' => 'olimpiade-matematika-ipa',
    ];

    /** Cabang resmi (sama dengan CompetitionSeeder). */
    private const OFFICIAL = [
        ['slug' => 'sholawat', 'name' => 'Sholawat', 'type' => 'group', 'global' => 15, 'school' => 1, 'min' => 5, 'max' => 12, 'desc' => 'Penampilan grup sholawat/rebana perwakilan sekolah.'],
        ['slug' => 'kaligrafi', 'name' => 'Kaligrafi', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Karya khat dengan kaidah naskhi, tsuluts, dan diwani.'],
        ['slug' => 'dai-muda', 'name' => "Da'i Muda", 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Pidato dakwah bertema moderasi beragama.'],
        ['slug' => 'pop-religi', 'name' => 'Pop Religi', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Lomba menyanyi lagu bernuansa religi.'],
        ['slug' => 'musabaqah-tilawatil-quran', 'name' => "Musabaqah Tilawatil Qur'an", 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Seni baca Al-Quran dengan lagu mujawwad.'],
        ['slug' => 'olimpiade-matematika-ipa', 'name' => 'Olimpiade Matematika & IPA', 'type' => 'individual', 'global' => 40, 'school' => 2, 'min' => null, 'max' => null, 'desc' => 'Olimpiade matematika dan IPA perwakilan sekolah.'],
    ];

    public function up(): void
    {
        $event = Event::query()->where('is_active', true)->latest('year')->first()
            ?? Event::query()->latest('year')->first();

        if (! $event) {
            return;
        }

        DB::transaction(function () use ($event) {
            $official = $this->upsertOfficial($event);

            foreach (self::DUPLICATES as $oldSlug => $newSlug) {
                $duplicate = $event->competitions()->where('slug', $oldSlug)->first();
                $target = $official[$newSlug] ?? null;

                if (! $duplicate || ! $target || $duplicate->id === $target->id) {
                    continue;
                }

                $moved = Registration::where('competition_id', $duplicate->id)
                    ->update(['competition_id' => $target->id]);

                Score::where('competition_id', $duplicate->id)
                    ->update(['competition_id' => $target->id]);

                Log::info('Cabang demo digabung ke cabang resmi', [
                    'event_id' => $event->id,
                    'from' => $duplicate->slug,
                    'to' => $target->slug,
                    'registrations_moved' => $moved,
                ]);

                $duplicate->delete();
            }

            $leftover = $event->competitions()
                ->whereNotIn('slug', array_column(self::OFFICIAL, 'slug'))
                ->pluck('slug')
                ->all();

            if ($leftover !== []) {
                Log::warning('Masih ada cabang di luar daftar resmi FPM XII', [
                    'event_id' => $event->id,
                    'slugs' => $leftover,
                ]);
            }
        });
    }

    /** Rollback tidak mengembalikan cabang demo; jalankan seeder bila perlu. */
    public function down(): void
    {
        //
    }

    /**
     * Pastikan enam cabang resmi ada dan atributnya sesuai poster.
     *
     * @return array<string, Competition>
     */
    private function upsertOfficial(Event $event): array
    {
        $result = [];

        foreach (self::OFFICIAL as $index => $row) {
            $competition = $event->competitions()->firstOrNew(['slug' => $row['slug']]);

            $competition->fill([
                'name' => $row['name'],
                'category_type' => $row['type'],
                'global_quota' => $row['global'],
                'school_quota' => $row['school'],
                'min_group_members' => $row['min'],
                'max_group_members' => $row['max'],
                'is_open' => true,
                'sort_order' => $index + 1,
                'description' => $row['desc'],
                'event_id' => $event->id,
            ])->save();

            $result[$row['slug']] = $competition;
        }

        return $result;
    }
};
