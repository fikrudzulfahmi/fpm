<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Produksi hanya menyiapkan akun panitia. Data demo (sekolah contoh,
     * pendaftaran dummy, akun sekolah contoh) sengaja tidak dijalankan lagi —
     * data sekolah resmi masuk lewat migrasi `import_real_schools`.
     *
     * Untuk pengembangan lokal, jalankan seeder demo secara eksplisit:
     *   php artisan db:seed --class=EventSeeder
     *   php artisan db:seed --class=SchoolSeeder
     *   php artisan db:seed --class=CompetitionSeeder
     *   php artisan db:seed --class=DummyRegistrationSeeder
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
        ]);
    }
}
