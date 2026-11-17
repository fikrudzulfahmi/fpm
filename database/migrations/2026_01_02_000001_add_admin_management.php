<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom pendukung panel admin: pembatasan akses akun juri dan setelan
 * desain piagam juara (terpisah dari template sertifikat peserta).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('access_level', ['full', 'juri'])->default('full')->after('role');
            $table->boolean('is_active')->default(true)->after('is_juri');
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->json('award_config')->nullable()->after('certificate_template_config');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn('award_config');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['access_level', 'is_active']);
        });
    }
};
