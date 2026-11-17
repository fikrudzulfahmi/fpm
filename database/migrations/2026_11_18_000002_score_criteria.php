<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kriteria penilaian per cabang lomba + nilai tiap kriteria untuk satu pendaftaran.
 *
 * Panitia menyusun kriteria (nama, bobot, nilai maksimum); PJ Lomba hanya
 * mengisi nilai per kriteria. Nilai akhir dihitung berbobot:
 *   Σ((nilai/max) × bobot) / Σbobot × 100
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('score_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->decimal('weight', 5, 2)->default(1);
            $table->decimal('max_value', 5, 2)->default(100);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['competition_id', 'name']);
        });

        Schema::create('score_criterion_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('score_id')->constrained()->cascadeOnDelete();
            $table->foreignId('criterion_id')->constrained('score_criteria')->cascadeOnDelete();
            $table->decimal('value', 5, 2)->default(0);
            $table->timestamps();

            $table->unique(['score_id', 'criterion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('score_criterion_values');
        Schema::dropIfExists('score_criteria');
    }
};
