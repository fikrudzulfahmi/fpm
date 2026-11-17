<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Penyesuaian cabang lomba dengan JUKNIS FPM (dokumen panitia):
 * kuota, ketentuan ringkas (deskripsi), dan kriteria penilaian per cabang.
 *
 * Olimpiade sengaja tidak diberi kriteria karena memakai sistem CBT
 * (satu nilai/skor), bukan penilaian dewan juri.
 */
return new class extends Migration
{
    public function up(): void
    {
        $map = [
            'sholawat' => [
                'global_quota' => 25,
                'school_quota' => 1,
                'min_group_members' => 5,
                'max_group_members' => 15,
                'description' => 'Grup sholawat/rebana, maksimal 15 orang dan 1 grup per sekolah. '
                    .'Tampil maksimal 10 menit (jingle 2 menit + lagu 8 menit); jingle wajib memuat '
                    .'"Harlah SMK Islam ke-59". Penilaian: Vokal 40, Musik 35, Adab 25. '
                    .'Juara I-III, Harapan I-III, Best Vocal, dan Best Jingle.',
                'criteria' => [
                    ['Vokal', 40, 100],
                    ['Musik', 35, 100],
                    ['Adab', 25, 100],
                ],
            ],

            'musabaqah-tilawatil-quran' => [
                'global_quota' => 50,
                'school_quota' => 2,
                'description' => 'Musabaqah Tilawatil Qur\'an, maqra\' bebas, maksimal 2 peserta per sekolah '
                    .'(putra/putri). Penilaian: Fashahah, Lagu, dan Adab. Juara dan harapan dipisah putra-putri.',
                'criteria' => [
                    ['Fashahah', 1, 100],
                    ['Lagu', 1, 100],
                    ['Adab', 1, 100],
                ],
            ],

            'dai-muda' => [
                'global_quota' => 40,
                'school_quota' => 2,
                'description' => 'Lomba Da\'i Muda: pidato dakwah tema bebas, waktu tampil maksimal 7 menit, '
                    .'maksimal 2 peserta per sekolah. Penilaian: Isi, Bahasa, dan Penampilan.',
                'criteria' => [
                    ['Isi', 1, 100],
                    ['Bahasa', 1, 100],
                    ['Penampilan', 1, 100],
                ],
            ],

            'pop-religi' => [
                'global_quota' => 50,
                'school_quota' => 2,
                'description' => 'Menyanyi pop religi (karaoke), satu lagu bebas berbahasa Indonesia, '
                    .'maksimal 2 peserta per sekolah. Penilaian: Vokal dan Penampilan.',
                'criteria' => [
                    ['Vokal', 1, 100],
                    ['Penampilan', 1, 100],
                ],
            ],

            'kaligrafi' => [
                'global_quota' => 40,
                'school_quota' => 2,
                'description' => 'Kaligrafi kontemporer pada kertas duplek A1 (84 × 59,4 cm), maqra\' QS. An-Nahl: 18. '
                    .'Durasi 6 jam dan peserta tidak mengikuti upacara pembukaan. Penilaian: Kebenaran tulisan, '
                    .'Keindahan & kebersihan, dan Kreativitas.',
                'criteria' => [
                    ['Kebenaran Tulisan', 1, 100],
                    ['Keindahan & Kebersihan', 1, 100],
                    ['Kreativitas', 1, 100],
                ],
            ],
        ];

        foreach ($map as $slug => $config) {
            $competition = DB::table('competitions')->where('slug', $slug)->first();

            if (! $competition) {
                continue;
            }

            $update = [
                'global_quota' => $config['global_quota'],
                'school_quota' => $config['school_quota'],
                'description' => $config['description'],
                'updated_at' => now(),
            ];

            if (isset($config['min_group_members'])) {
                $update['min_group_members'] = $config['min_group_members'];
                $update['max_group_members'] = $config['max_group_members'];
            }

            DB::table('competitions')->where('id', $competition->id)->update($update);

            $existing = DB::table('score_criteria')
                ->where('competition_id', $competition->id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            $rows = $config['criteria'];

            // Jumlah kriteria sama → ganti nama/bobot saja agar nilai yang sudah
            // diinput tetap menempel pada kriteria yang setara.
            if ($existing->count() === count($rows)) {
                foreach ($rows as $index => [$name, $weight, $max]) {
                    DB::table('score_criteria')
                        ->where('id', $existing[$index]->id)
                        ->update([
                            'name' => $name,
                            'weight' => $weight,
                            'max_value' => $max,
                            'sort_order' => $index,
                            'updated_at' => now(),
                        ]);
                }

                continue;
            }

            DB::table('score_criteria')->where('competition_id', $competition->id)->delete();

            foreach ($rows as $index => [$name, $weight, $max]) {
                DB::table('score_criteria')->insert([
                    'competition_id' => $competition->id,
                    'name' => $name,
                    'weight' => $weight,
                    'max_value' => $max,
                    'sort_order' => $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Tidak dikembalikan: data juknis adalah penyesuaian permanen.
    }
};
