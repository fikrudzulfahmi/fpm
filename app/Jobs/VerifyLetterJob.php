<?php

namespace App\Jobs;

use App\Models\Registration;
use App\Services\RecommendationVerifier;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\App;

/**
 * Verifikasi surat rekomendasi via Gemini Vision di latar belakang.
 * Kegagalan AI tidak boleh menggagalkan pendaftaran, jadi job ini
 * dibiarkan gagal diam-diam setelah 2 percobaan (admin tetap bisa cek manual).
 */
class VerifyLetterJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 2;

    public int $timeout = 90;

    public function __construct(
        public Registration $registration,
    ) {}

    public function handle(): void
    {
        App::make(RecommendationVerifier::class)->verify($this->registration);
    }
}
