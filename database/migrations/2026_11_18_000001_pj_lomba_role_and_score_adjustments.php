<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Peran "juri" diganti menjadi "PJ Lomba" (penanggung jawab cabang lomba), dan
 * nilai akhir dipisah dari nilai input supaya panitia bisa melakukan koreksi
 * (katrol) dengan alasan yang tercatat.
 */
return new class extends Migration
{
    public function up(): void
    {
        // access_level sebelumnya enum('full','juri'); jadikan string agar
        // penambahan peran berikutnya tidak perlu ALTER ENUM.
        Schema::table('users', function (Blueprint $table) {
            $table->string('access_level', 10)->default('full')->change();
            $table->foreignId('competition_id')
                ->nullable()
                ->after('school_id')
                ->constrained('competitions')
                ->nullOnDelete();
        });

        DB::table('users')->where('access_level', 'juri')->update(['access_level' => 'pj']);
        DB::table('users')->update(['is_juri' => false]);

        // PJ hasil migrasi langsung ditugaskan ke cabang pertama (bisa diubah
        // panitia di menu Akun) supaya tidak melihat semua cabang.
        $firstCompetition = DB::table('competitions')->orderBy('id')->value('id');

        if ($firstCompetition) {
            DB::table('users')
                ->where('access_level', 'pj')
                ->whereNull('competition_id')
                ->update(['competition_id' => $firstCompetition]);
        }

        Schema::table('scores', function (Blueprint $table) {
            $table->decimal('adjusted_value', 5, 2)->nullable()->after('score_value');
            $table->string('adjust_reason', 500)->nullable()->after('adjusted_value');
            $table->foreignId('adjusted_by')->nullable()->after('adjust_reason')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('adjusted_at')->nullable()->after('adjusted_by');
        });
    }

    public function down(): void
    {
        Schema::table('scores', function (Blueprint $table) {
            $table->dropConstrainedForeignId('adjusted_by');
            $table->dropColumn(['adjusted_value', 'adjust_reason', 'adjusted_at']);
        });

        DB::table('users')->where('access_level', 'pj')->update(['access_level' => 'juri']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('competition_id');
        });
    }
};
