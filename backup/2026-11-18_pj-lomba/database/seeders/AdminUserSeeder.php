<?php

namespace Database\Seeders;

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
                'is_juri' => true,
                'password' => 'fpm2026admin',
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'juri@fpm.test'],
            [
                'name' => 'Juri FPM',
                'username' => 'juri',
                'whatsapp' => '081234567891',
                'role' => 'admin',
                'access_level' => 'juri',
                'is_juri' => true,
                'password' => 'fpm2026juri',
                'email_verified_at' => now(),
            ],
        );
    }
}
