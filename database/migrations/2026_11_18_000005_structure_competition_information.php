<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Informasi cabang lomba dibuat terstruktur supaya halaman publik tidak
 * menampilkan satu paragraf panjang: ringkasan singkat (description),
 * poin ketentuan (rules), dan catatan penghargaan (prize_note).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            if (! Schema::hasColumn('competitions', 'rules')) {
                $table->json('rules')->nullable()->after('description');
            }
            if (! Schema::hasColumn('competitions', 'prize_note')) {
                $table->string('prize_note', 255)->nullable()->after('rules');
            }
        });

        $data = [
            'sholawat' => [
                'summary' => 'Grup sholawat/rebana dengan jingle wajib dan satu lagu pilihan.',
                'rules' => [
                    'Beregu: maksimal 15 orang dan 1 grup per sekolah.',
                    'Durasi tampil maksimal 10 menit — jingle 2 menit + lagu 8 menit.',
                    'Jingle wajib memuat frasa "Harlah SMK Islam ke-59".',
                    'Penilaian dewan juri memakai kriteria vokal, musik, dan adab.',
                ],
                'prize' => 'Juara I–III, Harapan I–III, Best Vocal, dan Best Jingle.',
            ],
            'musabaqah-tilawatil-quran' => [
                'summary' => "Tilawah Al-Qur'an dengan maqra' bebas untuk peserta putra dan putri.",
                'rules' => [
                    'Maksimal 2 peserta per sekolah; kategori putra dan putri dipisah.',
                    "Maqra' (bacaan) bebas.",
                    'Penilaian: fashahah, lagu, dan adab.',
                ],
                'prize' => 'Juara dan harapan untuk putra serta putri.',
            ],
            'dai-muda' => [
                'summary' => 'Pidato dakwah bertema bebas, tampil maksimal 7 menit.',
                'rules' => [
                    'Maksimal 2 peserta per sekolah.',
                    'Tema dakwah bebas.',
                    'Durasi tampil maksimal 7 menit.',
                    'Penilaian: isi, bahasa, dan penampilan.',
                ],
                'prize' => 'Juara I–III dan juara harapan.',
            ],
            'pop-religi' => [
                'summary' => 'Menyanyikan satu lagu pop religi berbahasa Indonesia.',
                'rules' => [
                    'Maksimal 2 peserta per sekolah.',
                    'Satu lagu pop religi berbahasa Indonesia, pilihan peserta.',
                    'Penilaian: vokal dan penampilan.',
                ],
                'prize' => 'Juara I–III dan juara harapan.',
            ],
            'kaligrafi' => [
                'summary' => "Kaligrafi kontemporer pada kertas A1 dengan maqra' QS. An-Nahl: 18.",
                'rules' => [
                    'Maksimal 2 peserta per sekolah.',
                    'Kertas duplek ukuran A1 (84 × 59,4 cm).',
                    "Maqra' QS. An-Nahl: 18.",
                    'Durasi pengerjaan 6 jam; peserta tidak mengikuti upacara pembukaan.',
                ],
                'prize' => 'Juara I–III dan juara harapan.',
            ],
            'olimpiade-matematika-ipa' => [
                'summary' => 'Olimpiade Matematika & IPA berbasis komputer untuk pelajar SMP/MTs.',
                'rules' => [
                    'Maksimal 2 peserta per sekolah.',
                    'Dikerjakan secara individu: soal Matematika dan IPA.',
                    'Pelaksanaan berbasis komputer (CBT) di laboratorium sekolah.',
                ],
                'prize' => 'Juara I–III dan juara harapan.',
            ],
        ];

        foreach ($data as $slug => $row) {
            $exists = DB::table('competitions')->where('slug', $slug)->exists();

            if (! $exists) {
                continue;
            }

            DB::table('competitions')->where('slug', $slug)->update([
                'description' => $row['summary'],
                'rules' => json_encode($row['rules'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'prize_note' => $row['prize'],
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            if (Schema::hasColumn('competitions', 'rules')) {
                $table->dropColumn('rules');
            }
            if (Schema::hasColumn('competitions', 'prize_note')) {
                $table->dropColumn('prize_note');
            }
        });
    }
};
