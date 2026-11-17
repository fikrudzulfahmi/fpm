<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;

/**
 * 10 sekolah dummy (wilayah Blitar & sekitar) untuk uji klaim NPSN.
 * 2 di antaranya sudah diklaim agar skenario "NPSN sudah dipakai" bisa diuji.
 */
class SchoolSeeder extends Seeder
{
    public const SCHOOLS = [
        ['npsn' => '20514401', 'school_name' => 'MTsN 1 Kota Blitar', 'address' => 'Jl. Kenari No. 1, Blitar'],
        ['npsn' => '20514402', 'school_name' => 'MTsN 2 Kota Blitar', 'address' => 'Jl. Ciliwung No. 12, Blitar'],
        ['npsn' => '20514403', 'school_name' => 'SMPN 1 Blitar', 'address' => 'Jl. A. Yani No. 8, Blitar'],
        ['npsn' => '20514404', 'school_name' => 'SMPN 2 Blitar', 'address' => 'Jl. Diponegoro No. 45, Blitar'],
        ['npsn' => '20514405', 'school_name' => 'MTs Al-Hidayah Kanigoro', 'address' => 'Jl. Raya Kanigoro, Kab. Blitar'],
        ['npsn' => '20514406', 'school_name' => 'SMP Islam Terpadu Nurul Fikri', 'address' => 'Jl. Garuda No. 3, Blitar'],
        ['npsn' => '20514407', 'school_name' => 'MTs Muhammadiyah Garum', 'address' => 'Jl. KH. Ahmad Dahlan, Garum'],
        ['npsn' => '20514408', 'school_name' => 'SMPN 1 Srengat', 'address' => 'Jl. Raya Srengat, Kab. Blitar'],
        ['npsn' => '20514409', 'school_name' => 'MTs Sunan Kalijogo Nglegok', 'address' => 'Jl. Raya Nglegok, Kab. Blitar'],
        ['npsn' => '20514410', 'school_name' => 'SMPN 3 Blitar', 'address' => 'Jl. Melati No. 27, Blitar'],
    ];

    public function run(): void
    {
        foreach (self::SCHOOLS as $school) {
            School::updateOrCreate(
                ['npsn' => $school['npsn']],
                ['school_name' => $school['school_name'], 'address' => $school['address']],
            );
        }
    }
}
