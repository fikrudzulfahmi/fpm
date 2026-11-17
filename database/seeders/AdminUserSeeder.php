<?php

namespace Database\Seeders;

use App\Models\Competition;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@fpm.test'],
            [
                'name' => 'Panitia FPM',
                'username' => 'panitia',
                'whatsapp' => '081234567890',
                'role' => 'admin',
                'access_level' => 'full',
                'is_juri' => false,
                'password' => 'fpm2026admin',
                'email_verified_at' => now(),
            ],
        );

        // Akun PJ Lomba contoh: hanya menilai satu cabang lomba.
        User::updateOrCreate(
            ['email' => 'pj@fpm.test'],
            [
                'name' => 'PJ Lomba FPM',
                'username' => 'pj',
                'whatsapp' => '081234567891',
                'role' => 'admin',
                'access_level' => 'pj',
                'competition_id' => Competition::query()->orderBy('id')->value('id'),
                'is_juri' => false,
                'password' => 'fpm2026pj',
                'email_verified_at' => now(),
            ],
        );
    }
}
