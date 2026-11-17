<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Koreksi nilai dilakukan pada level kriteria (bukan nilai akhir), supaya
 * rincian yang tampil di halaman publik konsisten dengan nilai akhirnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('score_criterion_values', function (Blueprint $table) {
            $table->decimal('adjusted_value', 5, 2)->nullable()->after('value');
            $table->string('adjust_reason', 500)->nullable()->after('adjusted_value');
            $table->foreignId('adjusted_by')->nullable()->after('adjust_reason')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('adjusted_at')->nullable()->after('adjusted_by');
        });
    }

    public function down(): void
    {
        Schema::table('score_criterion_values', function (Blueprint $table) {
            $table->dropConstrainedForeignId('adjusted_by');
            $table->dropColumn(['adjusted_value', 'adjust_reason', 'adjusted_at']);
        });
    }
};
