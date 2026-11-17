<?php

namespace Tests\Feature;

use App\Models\Competition;
use App\Models\Event;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\School;
use App\Services\RegistrationGuard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Mengunci aturan bisnis pendaftaran: format NISN, anti-dobel,
 * kuota global/sekolah, dan ukuran grup.
 */
class RegistrationGuardTest extends TestCase
{
    use RefreshDatabase;

    private RegistrationGuard $guard;

    private Event $event;

    private School $schoolA;

    private School $schoolB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->guard = app(RegistrationGuard::class);

        $this->event = Event::create([
            'event_name' => 'Festival Pelajar Muslim',
            'year' => 2026,
            'is_active' => true,
        ]);

        $this->schoolA = School::create([
            'npsn' => '20514401',
            'school_name' => 'MTs A',
            'level' => 'MTs',
            'address' => 'Jl. A',
        ]);

        $this->schoolB = School::create([
            'npsn' => '20514402',
            'school_name' => 'MTs B',
            'level' => 'MTs',
            'address' => 'Jl. B',
        ]);
    }

    private function competition(array $overrides = []): Competition
    {
        return Competition::create(array_merge([
            'event_id' => $this->event->id,
            'name' => 'Musabaqah Tilawatil Quran',
            'slug' => 'mtq-'.uniqid(),
            'category_type' => 'individual',
            'global_quota' => 5,
            'school_quota' => 2,
            'is_open' => true,
            'sort_order' => 0,
        ], $overrides));
    }

    private function register(Competition $competition, School $school, string $nisn, string $status = 'approved'): Registration
    {
        $registration = Registration::create([
            'event_id' => $this->event->id,
            'competition_id' => $competition->id,
            'school_id' => $school->id,
            'companion_name' => 'Pendamping',
            'companion_phone' => '08123456789',
            'status' => $status,
            'ai_status' => 'valid',
        ]);

        Participant::create([
            'registration_id' => $registration->id,
            'nisn' => $nisn,
            'full_name' => 'Peserta '.$nisn,
            'gender' => 'L',
            'birth_date' => '2011-01-01',
            'event_id' => $this->event->id,
        ]);

        return $registration;
    }

    public function test_nisn_harus_tepat_sepuluh_digit(): void
    {
        $result = $this->guard->checkNisnBatch(['123456789', '12345678901', 'abcdefghij'], $this->event->id);

        $this->assertFalse($result['ok']);
        $this->assertCount(3, $result['errors']);
    }

    public function test_nisn_valid_lolos(): void
    {
        $result = $this->guard->checkNisnBatch(['1234567890'], $this->event->id);

        $this->assertTrue($result['ok']);
        $this->assertSame([], $result['errors']);
        $this->assertSame([], $result['conflicts']);
    }

    public function test_nisn_ganda_dalam_satu_formulir_ditolak(): void
    {
        $result = $this->guard->checkNisnBatch(['1234567890', '1234567890'], $this->event->id);

        $this->assertFalse($result['ok']);
        $this->assertStringContainsString('lebih dari sekali', implode(' ', $result['errors']));
    }

    public function test_nisn_yang_sudah_terdaftar_jadi_konflik(): void
    {
        $competition = $this->competition();
        $this->register($competition, $this->schoolA, '1112223334');

        $result = $this->guard->checkNisnBatch(['1112223334'], $this->event->id);

        $this->assertFalse($result['ok']);
        $this->assertCount(1, $result['conflicts']);
        $this->assertSame('1112223334', $result['conflicts'][0]['nisn']);
        $this->assertSame($competition->name, $result['conflicts'][0]['competition']);
    }

    public function test_pendaftaran_ditolak_tidak_memblokir_nisn(): void
    {
        $competition = $this->competition();
        $this->register($competition, $this->schoolA, '1112223335', 'rejected');

        $result = $this->guard->checkNisnBatch(['1112223335'], $this->event->id);

        $this->assertTrue($result['ok']);
    }

    public function test_nisn_di_lomba_berbeda_pada_event_sama_tetap_konflik(): void
    {
        $mtq = $this->competition(['name' => 'MTQ']);
        $pidato = $this->competition(['name' => 'Pidato']);
        $this->register($mtq, $this->schoolA, '9998887776');

        $result = $this->guard->checkNisnBatch(['9998887776'], $this->event->id);

        $this->assertFalse($result['ok']);
        $this->assertSame('MTQ', $result['conflicts'][0]['competition']);
        $this->assertNotNull($pidato);
    }

    public function test_nisn_event_lain_tidak_konflik(): void
    {
        $lain = Event::create(['event_name' => 'Event Lain', 'year' => 2025, 'is_active' => false]);
        $competitionLain = Competition::create([
            'event_id' => $lain->id,
            'name' => 'MTQ Lama',
            'slug' => 'mtq-lama',
            'category_type' => 'individual',
            'global_quota' => 5,
            'school_quota' => 2,
            'is_open' => true,
            'sort_order' => 0,
        ]);

        $registration = Registration::create([
            'event_id' => $lain->id,
            'competition_id' => $competitionLain->id,
            'school_id' => $this->schoolA->id,
            'companion_name' => 'X',
            'companion_phone' => '0812',
            'status' => 'approved',
        ]);

        Participant::create([
            'registration_id' => $registration->id,
            'nisn' => '5554443332',
            'full_name' => 'Lama',
            'gender' => 'L',
            'birth_date' => '2010-01-01',
            'event_id' => $lain->id,
        ]);

        $result = $this->guard->checkNisnBatch(['5554443332'], $this->event->id);

        $this->assertTrue($result['ok']);
    }

    public function test_lomba_tutup_menolak_pendaftaran(): void
    {
        $competition = $this->competition(['is_open' => false]);

        $result = $this->guard->canRegister($competition, $this->schoolA->id);

        $this->assertFalse($result['allowed']);
        $this->assertStringContainsString('ditutup', $result['reason']);
    }

    public function test_kuota_global_habis_menolak(): void
    {
        $competition = $this->competition(['global_quota' => 2, 'school_quota' => 5]);
        $this->register($competition, $this->schoolA, '1010101010');
        $this->register($competition, $this->schoolB, '2020202020');

        $result = $this->guard->canRegister($competition, $this->schoolA->id);

        $this->assertFalse($result['allowed']);
        $this->assertStringContainsString('Kuota global', $result['reason']);
    }

    public function test_kuota_sekolah_habis_menolak_walau_global_tersisa(): void
    {
        $competition = $this->competition(['global_quota' => 10, 'school_quota' => 2]);
        $this->register($competition, $this->schoolA, '3030303030');
        $this->register($competition, $this->schoolA, '4040404040');

        $result = $this->guard->canRegister($competition, $this->schoolA->id);
        $other = $this->guard->canRegister($competition, $this->schoolB->id);

        $this->assertFalse($result['allowed']);
        $this->assertStringContainsString('Kuota sekolah', $result['reason']);
        $this->assertTrue($other['allowed'], 'Sekolah lain tidak boleh terkena kuota sekolah A');
    }

    public function test_pendaftaran_ditolak_tidak_memakan_kuota(): void
    {
        $competition = $this->competition(['global_quota' => 1, 'school_quota' => 1]);
        $this->register($competition, $this->schoolA, '5050505050', 'rejected');

        $result = $this->guard->canRegister($competition, $this->schoolA->id);

        $this->assertTrue($result['allowed']);
    }

    public function test_grup_kurang_anggota_ditolak(): void
    {
        $competition = $this->competition([
            'category_type' => 'group',
            'min_group_members' => 3,
            'max_group_members' => 6,
        ]);

        $this->assertNotNull($this->guard->checkGroupSize($competition, 2));
        $this->assertNull($this->guard->checkGroupSize($competition, 3));
        $this->assertNull($this->guard->checkGroupSize($competition, 6));
        $this->assertNotNull($this->guard->checkGroupSize($competition, 7));
    }

    public function test_lomba_individu_hanya_satu_peserta(): void
    {
        $competition = $this->competition(['category_type' => 'individual']);

        $this->assertNull($this->guard->checkGroupSize($competition, 1));
        $this->assertNotNull($this->guard->checkGroupSize($competition, 2));
    }
}
