<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Produksi hanya menyiapkan akun panitia. Data demo (sekolah contoh,
     * pendaftaran peserta, akun sekolah contoh) tidak lagi disediakan —
     * data sekolah resmi masuk lewat migrasi `import_real_schools`.
     *
     * Untuk pengembangan lokal, jalankan seeder data dasar secara eksplisit:
     *   php artisan db:seed --class=EventSeeder
     *   php artisan db:seed --class=SchoolSeeder
     *   php artisan db:seed --class=CompetitionSeeder
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
        ]);
    }
}
