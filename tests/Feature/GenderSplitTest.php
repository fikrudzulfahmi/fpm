<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\CompetitionController;
use App\Http\Controllers\Admin\ScoreController;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\School;
use App\Models\User;
use App\Services\RegistrationGuard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

/**
 * Kategori gender terpisah (mis. MTQ Putra/Putri): kuota, undian nomor tampil,
 * dan pemisahan peringkat.
 */
class GenderSplitTest extends TestCase
{
    use RefreshDatabase;

    private Event $event;

    private School $school;

    protected function setUp(): void
    {
        parent::setUp();

        $this->event = Event::create([
            'event_name' => 'Festival Pelajar Muslim',
            'year' => 2026,
            'is_active' => true,
        ]);

        $this->school = School::create([
            'npsn' => '20514401',
            'school_name' => 'MTs A',
            'level' => 'MTs',
            'address' => 'Jl. A',
        ]);
    }

    private function competition(array $overrides = []): Competition
    {
        return Competition::create(array_merge([
            'event_id' => $this->event->id,
            'name' => 'Musabaqah Tilawatil Quran',
            'slug' => 'mtq-'.uniqid(),
            'category_type' => 'individual',
            'gender_mode' => 'separate',
            'global_quota' => 10,
            'school_quota' => 1,
            'is_open' => true,
            'sort_order' => 0,
        ], $overrides));
    }

    private function register(Competition $competition, string $gender, string $status = 'approved'): Registration
    {
        $registration = Registration::create([
            'event_id' => $this->event->id,
            'competition_id' => $competition->id,
            'school_id' => $this->school->id,
            'gender' => $gender,
            'companion_name' => 'Pendamping',
            'companion_phone' => '08123456789',
            'status' => $status,
            'ai_status' => 'valid',
        ]);

        Participant::create([
            'registration_id' => $registration->id,
            'nisn' => (string) random_int(1000000000, 9999999999),
            'full_name' => 'Peserta '.$gender,
            'gender' => $gender,
            'birth_date' => '2011-01-01',
            'event_id' => $this->event->id,
        ]);

        return $registration;
    }

    public function test_kuota_sekolah_dihitung_per_kategori_gender(): void
    {
        $competition = $this->competition();
        $guard = app(RegistrationGuard::class);

        $this->register($competition, 'L');

        $this->assertFalse($guard->canRegister($competition, $this->school->id, 'L')['allowed']);
        $this->assertTrue($guard->canRegister($competition, $this->school->id, 'P')['allowed']);
    }

    public function test_lomba_gender_terpisah_wajib_gender_peserta(): void
    {
        $competition = $this->competition();
        $guard = app(RegistrationGuard::class);

        $this->assertFalse($guard->canRegister($competition, $this->school->id)['allowed']);
    }

    public function test_undian_memberi_nomor_ganjil_putra_dan_genap_putri(): void
    {
        $competition = $this->competition(['school_quota' => 5]);

        foreach (['L', 'L', 'L'] as $gender) {
            $this->register($competition, $gender);
        }

        foreach (['P', 'P'] as $gender) {
            $this->register($competition, $gender);
        }

        (new CompetitionController())->drawOrder($competition);

        $putra = $competition->registrations()->where('gender', 'L')->pluck('performance_number')->sort()->values()->all();
        $putri = $competition->registrations()->where('gender', 'P')->pluck('performance_number')->sort()->values()->all();

        $this->assertSame([1, 3, 5], $putra);
        $this->assertSame([2, 4], $putri);
        $this->assertSame(5, $competition->registrations()->whereNotNull('performance_number')->count());
    }

    public function test_peringkat_dipisah_per_gender(): void
    {
        $competition = $this->competition(['school_quota' => 5]);

        $putra = $this->register($competition, 'L');
        $putri = $this->register($competition, 'P');

        Auth::login(User::create([
            'name' => 'Panitia',
            'email' => 'panitia-'.uniqid().'@example.test',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]));

        $controller = new ScoreController();

        $controller->upsert(Request::create('/admin/nilai', 'POST', [
            'competition_id' => $competition->id,
            'registration_id' => $putra->id,
            'score_value' => 70,
        ]));

        $controller->upsert(Request::create('/admin/nilai', 'POST', [
            'competition_id' => $competition->id,
            'registration_id' => $putri->id,
            'score_value' => 90,
        ]));

        // Nilai Putra lebih rendah, tapi tetap Juara 1 di kategorinya sendiri.
        $this->assertSame(1, $putra->score()->first()->rank);
        $this->assertSame(1, $putri->score()->first()->rank);
    }

    public function test_lomba_campuran_tetap_satu_peringkat(): void
    {
        $competition = $this->competition(['gender_mode' => 'mixed', 'school_quota' => 5]);

        $putra = $this->register($competition, 'L');
        $putri = $this->register($competition, 'P');

        Auth::login(User::create([
            'name' => 'Panitia',
            'email' => 'panitia-'.uniqid().'@example.test',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]));

        $controller = new ScoreController();

        $controller->upsert(Request::create('/admin/nilai', 'POST', [
            'competition_id' => $competition->id,
            'registration_id' => $putra->id,
            'score_value' => 70,
        ]));

        $controller->upsert(Request::create('/admin/nilai', 'POST', [
            'competition_id' => $competition->id,
            'registration_id' => $putri->id,
            'score_value' => 90,
        ]));

        $this->assertSame(2, $putra->score()->first()->rank);
        $this->assertSame(1, $putri->score()->first()->rank);
    }
}
