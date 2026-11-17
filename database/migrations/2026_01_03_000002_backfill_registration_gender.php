<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Isi kolom registrations.gender untuk data lama: ambil dari peserta pertama
 * pada lomba individu (lomba beregu dibiarkan null).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('registrations')
            ->whereNull('gender')
            ->whereIn('competition_id', function ($query) {
                $query->select('id')->from('competitions')->where('category_type', 'individual');
            })
            ->orderBy('id')
            ->each(function ($registration) {
                $gender = DB::table('participants')
                    ->where('registration_id', $registration->id)
                    ->orderBy('id')
                    ->value('gender');

                if (in_array($gender, ['L', 'P'], true)) {
                    DB::table('registrations')
                        ->where('id', $registration->id)
                        ->update(['gender' => $gender]);
                }
            });
    }

    public function down(): void
    {
        // Data kembali seperti semula: tidak ada aksi.
    }
};
