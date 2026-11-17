<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Inti data FPM: events, schools, competitions, users(role), registrations,
 * participants, scores, settings. Urutan create mengikuti dependensi FK.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('event_name');
            $table->unsignedSmallInteger('year');
            $table->boolean('is_active')->default(false);
            $table->json('theme_config')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'year']);
        });

        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('npsn', 20)->unique();
            $table->string('school_name');
            $table->string('address')->nullable();
            $table->boolean('is_claimed')->default(false);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('competitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->enum('category_type', ['individual', 'group'])->default('individual');
            $table->unsignedInteger('global_quota')->default(0);
            $table->unsignedInteger('school_quota')->default(1);
            $table->unsignedTinyInteger('min_group_members')->nullable();
            $table->unsignedTinyInteger('max_group_members')->nullable();
            $table->boolean('is_open')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['event_id', 'slug']);
        });

        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('competition_id')->constrained('competitions')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('group_name')->nullable();
            $table->string('companion_name')->nullable();
            $table->string('companion_phone', 32)->nullable();
            $table->string('recommendation_letter_path')->nullable();
            $table->string('recommendation_letter_mime', 100)->nullable();
            $table->enum('ai_status', ['pending', 'valid', 'warning', 'mismatch', 'error', 'skipped'])
                ->default('pending');
            $table->text('ai_notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['event_id', 'competition_id', 'status']);
            $table->index(['school_id', 'status']);
        });

        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('registrations')->cascadeOnDelete();
            $table->string('nisn', 20);
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('full_name');
            $table->enum('gender', ['L', 'P'])->default('L');
            $table->date('birth_date')->nullable();
            $table->timestamps();

            // Aturan 1 siswa = 1 lomba per event dijaga di service layer
            // (status rejected boleh ikut lagi), jadi index biasa cukup cepat.
            $table->index(['nisn', 'event_id']);
            $table->index('registration_id');
        });

        Schema::create('scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->unique()->constrained('registrations')->cascadeOnDelete();
            $table->foreignId('competition_id')->constrained('competitions')->cascadeOnDelete();
            $table->decimal('score_value', 6, 2)->nullable();
            $table->unsignedSmallInteger('rank')->nullable();
            $table->boolean('is_published')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['competition_id', 'rank']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->unique()->constrained('events')->cascadeOnDelete();
            $table->boolean('publish_scores')->default(false);
            $table->boolean('enable_certificates')->default(false);
            $table->json('certificate_template_config')->nullable();
            $table->string('admin_whatsapp', 32)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('scores');
        Schema::dropIfExists('participants');
        Schema::dropIfExists('registrations');
        Schema::dropIfExists('competitions');
        Schema::dropIfExists('schools');
        Schema::dropIfExists('events');
    }
};
