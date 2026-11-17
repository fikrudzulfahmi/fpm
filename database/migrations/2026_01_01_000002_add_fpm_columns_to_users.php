<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambahan kolom auth FPM di tabel users: role, klaim sekolah, username login.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 60)->nullable()->unique()->after('name');
            $table->string('whatsapp', 32)->nullable()->after('username');
            $table->enum('role', ['admin', 'school'])->default('school')->after('password');
            $table->boolean('is_juri')->default(false)->after('role');
            $table->foreignId('school_id')->nullable()->after('role')->constrained('schools')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropColumn(['username', 'whatsapp', 'role', 'is_juri', 'school_id']);
        });
    }
};
