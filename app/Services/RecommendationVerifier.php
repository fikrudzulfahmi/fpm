<?php

namespace App\Services;

use App\Models\Registration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Lapis 1 verifikasi berkas: kirim surat rekomendasi (gambar/PDF) ke
 * Gemini Vision lalu minta penilaian kecocokan nama & NISN peserta.
 *
 * Hasil ditulis ke registrations.ai_status / ai_notes. Tidak pernah
 * menggagalkan pendaftaran — kalau API mati, status jatuh ke 'skipped'
 * dan admin tetap bisa verifikasi manual.
 */
class RecommendationVerifier
{
    private const PROMPT = <<<'TXT'
Kamu memverifikasi surat rekomendasi sekolah untuk pendaftaran lomba siswa.

Data peserta yang didaftarkan (NISN: nama):
%s

Periksa dokumen yang dilampirkan dan jawab HANYA dengan JSON valid, tanpa markdown:
{"match": true|false, "confidence": 0.0-1.0, "found_names": ["..."], "found_nisn": ["..."], "details": "penjelasan singkat dalam bahasa Indonesia"}

Aturan penilaian:
- match=true hanya jika dokumen benar-benar surat rekomendasi/resmi sekolah DAN memuat nama atau NISN peserta di atas.
- Jika dokumen bukan surat rekomendasi, atau nama/NISN tidak ditemukan, match=false.
- details maksimal 2 kalimat, sebutkan apa yang terlihat pada dokumen.
TXT;

    public function verify(Registration $registration): void
    {
        $path = $registration->recommendation_letter_path;

        if (! $path || ! Storage::disk('local')->exists($path)) {
            $registration->forceFill([
                'ai_status' => 'skipped',
                'ai_notes' => 'Berkas surat rekomendasi tidak ditemukan saat verifikasi AI.',
            ])->save();

            return;
        }

        $key = config('services.gemini.key');

        if (blank($key)) {
            $registration->forceFill([
                'ai_status' => 'skipped',
                'ai_notes' => 'GEMINI_API_KEY belum diisi; verifikasi manual diperlukan.',
            ])->save();

            return;
        }

        try {
            $result = $this->callGemini($registration, $path);
            $this->apply($registration, $result);
        } catch (\Throwable $e) {
            Log::warning('AI verification failed', [
                'registration_id' => $registration->id,
                'error' => $e->getMessage(),
            ]);

            $registration->forceFill([
                'ai_status' => 'error',
                'ai_notes' => 'Verifikasi AI gagal: '.mb_substr($e->getMessage(), 0, 180),
            ])->save();
        }
    }

    private function callGemini(Registration $registration, string $path): array
    {
        $participants = $registration->participants()
            ->get(['nisn', 'full_name'])
            ->map(fn ($p) => "{$p->nisn}: {$p->full_name}")
            ->implode("\n");

        $prompt = sprintf(self::PROMPT, $participants !== '' ? $participants : '(tidak ada data peserta)');
        $mime = $registration->recommendation_letter_mime ?: 'application/pdf';
        $base64 = base64_encode(Storage::disk('local')->get($path));

        $models = array_filter([
            config('services.gemini.model', 'gemini-2.5-flash'),
            ...(array) config('services.gemini.fallback_models', []),
        ]);

        $lastError = 'tidak ada model yang bisa dipanggil';

        foreach (array_unique($models) as $model) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

            try {
                $response = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->connectTimeout(10)
                    ->timeout(45)
                    ->post($url, [
                        'contents' => [[
                            'parts' => [
                                ['text' => $prompt],
                                ['inline_data' => ['mime_type' => $mime, 'data' => $base64]],
                            ],
                        ]],
                        'generationConfig' => [
                            'temperature' => 0.1,
                            'responseMimeType' => 'application/json',
                        ],
                    ]);
            } catch (\Throwable $e) {
                // Timeout / koneksi putus harus lanjut ke model berikutnya,
                // bukan menggagalkan seluruh verifikasi.
                $lastError = "{$model}: ".class_basename($e);
                Log::info('Gemini model exception, trying next', ['model' => $model, 'error' => $e->getMessage()]);

                continue;
            }

            if ($response->successful()) {
                return $this->parse($response->json());
            }

            $lastError = "{$model}: HTTP {$response->status()}";
            Log::info('Gemini model failed, trying next', ['model' => $model, 'status' => $response->status()]);
        }

        throw new \RuntimeException($lastError);
    }

    private function parse(array $body): array
    {
        $text = data_get($body, 'candidates.0.content.parts.0.text', '');

        // Model kadang membungkus JSON dalam ```json ... ```
        $text = trim(preg_replace('/^```(?:json)?|```$/m', '', $text));

        $decoded = json_decode($text, true);

        if (! is_array($decoded)) {
            return [
                'match' => false,
                'confidence' => 0.0,
                'details' => 'AI tidak mengembalikan JSON yang bisa dibaca. Periksa manual.',
                'found_names' => [],
                'found_nisn' => [],
            ];
        }

        return $decoded;
    }

    private function apply(Registration $registration, array $result): void
    {
        $match = (bool) ($result['match'] ?? false);
        $confidence = (float) ($result['confidence'] ?? 0.0);
        $details = trim((string) ($result['details'] ?? ''));

        $status = match (true) {
            $match && $confidence >= 0.7 => 'valid',
            $match => 'warning',
            default => 'mismatch',
        };

        $label = match ($status) {
            'valid' => 'Valid - Cocok',
            'warning' => 'Peringatan - Keyakinan rendah',
            default => 'Peringatan - Nama/NISN tidak ditemukan',
        };

        $registration->forceFill([
            'ai_status' => $status,
            'ai_notes' => "[AI: {$label}] ".$details,
        ])->save();
    }
}
