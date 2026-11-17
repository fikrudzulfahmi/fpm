<?php

namespace Database\Seeders;

use App\Models\Competition;
use App\Models\Event;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\School;
use App\Models\Score;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Data uji end-to-end:
 *  - 1 akun sekolah terklaim (SMPN 1 Blitar)
 *  - 3 pendaftaran individu + 1 beregu, status bervariasi
 *  - 1 nilai terisi untuk menguji panel juri
 *
 * NISN dummy 17 digit? Tidak — FPM memakai NISN 10 digit (NPD). Dipakai
 * angka 10 digit agar lolos validasi RegistrationGuard.
 */
class DummyRegistrationSeeder extends Seeder
{
    public function run(): void
    {
        $event = Event::current();

        if (! $event) {
            return;
        }

        $school = School::where('npsn', '20514403')->first(); // SMPN 1 Blitar
        $school2 = School::where('npsn', '20514401')->first(); // MTsN 1 Blitar

        if (! $school) {
            return;
        }

        // Akun sekolah untuk skenario login.
        $user = User::updateOrCreate(
            ['email' => 'smpn1@fpm.test'],
            [
                'name' => $school->school_name,
                'username' => 'smpn1blitar',
                'whatsapp' => '081200000001',
                'role' => 'school',
                'school_id' => $school->id,
                'password' => 'fpm2026sekolah',
                'email_verified_at' => now(),
            ],
        );

        $school->update(['is_claimed' => true, 'user_id' => $user->id]);

        if ($school2) {
            $user2 = User::updateOrCreate(
                ['email' => 'mtsn1@fpm.test'],
                [
                    'name' => $school2->school_name,
                    'username' => 'mtsn1blitar',
                    'whatsapp' => '081200000002',
                    'role' => 'school',
                    'school_id' => $school2->id,
                    'password' => 'fpm2026sekolah',
                    'email_verified_at' => now(),
                ],
            );
            $school2->update(['is_claimed' => true, 'user_id' => $user2->id]);
        }

        $mq = Competition::where('event_id', $event->id)->where('slug', 'musabaqah-tilawatil-quran')->first();
        $tahfidz = Competition::where('event_id', $event->id)->where('slug', 'tahfidz-juz-30')->first();
        $cc = Competition::where('event_id', $event->id)->where('slug', 'cerdas-cermat-pai')->first();

        if (! $mq || ! $tahfidz || ! $cc) {
            return;
        }

        // 1) Individu, sudah approved + nilai
        $r1 = Registration::updateOrCreate(
            ['event_id' => $event->id, 'competition_id' => $mq->id, 'school_id' => $school->id],
            [
                'companion_name' => 'Ust. Ahmad Fauzi',
                'companion_phone' => '081200000010',
                'ai_status' => 'valid',
                'ai_notes' => '[AI: Valid - Cocok] Surat rekomendasi resmi kepala sekolah memuat nama peserta.',
                'status' => 'approved',
                'verified_at' => Carbon::now()->subDays(2),
                'verified_by' => User::where('email', 'admin@fpm.test')->value('id'),
            ],
        );

        $r1->participants()->updateOrCreate(
            ['nisn' => '0051234501'],
            ['event_id' => $event->id, 'full_name' => 'Aisyah Nur Ramadhani', 'gender' => 'P', 'birth_date' => '2012-04-11'],
        );

        Score::updateOrCreate(
            ['registration_id' => $r1->id],
            ['competition_id' => $mq->id, 'score_value' => 92.50, 'rank' => 1, 'is_published' => false, 'notes' => 'Lagu Bayati, tajwid bersih.'],
        );

        // 2) Individu, masih pending (menunggu verifikasi)
        $r2 = Registration::updateOrCreate(
            ['event_id' => $event->id, 'competition_id' => $tahfidz->id, 'school_id' => $school->id],
            [
                'companion_name' => 'Ustzh. Laila',
                'companion_phone' => '081200000011',
                'ai_status' => 'warning',
                'ai_notes' => '[AI: Peringatan - Keyakinan rendah] Dokumen terbaca tetapi nama peserta tidak persis sama.',
                'status' => 'pending',
            ],
        );

        $r2->participants()->updateOrCreate(
            ['nisn' => '0051234502'],
            ['event_id' => $event->id, 'full_name' => 'Muhammad Rizky Pratama', 'gender' => 'L', 'birth_date' => '2011-09-02'],
        );

        // 3) Beregu (3 anggota) dari sekolah lain
        $r3 = Registration::updateOrCreate(
            ['event_id' => $event->id, 'competition_id' => $cc->id, 'school_id' => ($school2?->id ?? $school->id)],
            [
                'group_name' => 'Tim Cerdas MTsN 1 Blitar',
                'companion_name' => 'Ust. Hasan Basri',
                'companion_phone' => '081200000012',
                'ai_status' => 'pending',
                'status' => 'pending',
            ],
        );

        $members = [
            ['0051234511', 'Nabila Putri Salsabila', 'P', '2011-01-19'],
            ['0051234512', 'Fahri Abdillah', 'L', '2011-03-27'],
            ['0051234513', 'Zahra Aulia Rahma', 'P', '2011-07-08'],
        ];

        foreach ($members as [$nisn, $name, $gender, $dob]) {
            $r3->participants()->updateOrCreate(
                ['nisn' => $nisn],
                ['event_id' => $event->id, 'full_name' => $name, 'gender' => $gender, 'birth_date' => $dob],
            );
        }

        // NISN aktif per event harus unik — pastikan tidak ada duplikat sisa seeder lama.
        $dupes = Participant::query()
            ->select('nisn', 'event_id')
            ->groupBy('nisn', 'event_id')
            ->havingRaw('count(*) > 1')
            ->get();

        foreach ($dupes as $d) {
            $keep = Participant::where('nisn', $d->nisn)->where('event_id', $d->event_id)->min('id');
            Participant::where('nisn', $d->nisn)->where('event_id', $d->event_id)->where('id', '!=', $keep)->delete();
        }
    }
}
