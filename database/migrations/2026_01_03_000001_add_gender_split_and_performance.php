<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Aturan cabang lomba dengan kategori gender terpisah (mis. MTQ Putra/Putri)
 * dan nomor urut tampil hasil undian.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            $table->string('gender_mode', 12)->default('mixed')->after('category_type');
        });

        Schema::table('registrations', function (Blueprint $table) {
            // Diisi untuk lomba individu: L/P. Dipakai untuk kuota & peringkat
            // saat cabang lomba memakai gender_mode = separate.
            $table->char('gender', 1)->nullable()->after('group_name');
            $table->unsignedInteger('performance_number')->nullable()->after('gender');
            $table->index(['competition_id', 'performance_number'], 'registrations_competition_performance_idx');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex('registrations_competition_performance_idx');
            $table->dropColumn(['gender', 'performance_number']);
        });

        Schema::table('competitions', function (Blueprint $table) {
            $table->dropColumn('gender_mode');
        });
    }
};
