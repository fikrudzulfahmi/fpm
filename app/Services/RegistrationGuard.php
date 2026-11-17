<?php

namespace App\Services;

use App\Models\Competition;
use App\Models\Participant;
use App\Models\Registration;

/**
 * Pusat aturan bisnis pendaftaran: kuota global, kuota sekolah,
 * dan aturan "1 siswa = 1 lomba per event".
 */
class RegistrationGuard
{
    public const NISN_PATTERN = '/^\d{10}$/';

    /**
     * Validasi daftar NISN mentah sebelum apa pun disimpan.
     *
     * @param  array<int,string>  $nisnList
     * @return array{ok:bool, errors:array<int,string>, conflicts:array<int,array{nisn:string,name:string,competition:string}>}
     */
    public function checkNisnBatch(array $nisnList, int $eventId, ?int $ignoreRegistrationId = null): array
    {
        $errors = [];
        $conflicts = [];
        $seen = [];

        foreach ($nisnList as $raw) {
            $nisn = trim((string) $raw);

            if ($nisn === '') {
                continue;
            }

            if (! preg_match(self::NISN_PATTERN, $nisn)) {
                $errors[] = "NISN {$nisn} harus tepat 10 digit angka.";
                continue;
            }

            if (isset($seen[$nisn])) {
                $errors[] = "NISN {$nisn} muncul lebih dari sekali di formulir ini.";
                continue;
            }
            $seen[$nisn] = true;

            $found = Participant::findActiveInEvent($nisn, $eventId);

            if ($found && $found->registration_id !== $ignoreRegistrationId) {
                $conflicts[] = [
                    'nisn' => $nisn,
                    'name' => $found->full_name,
                    'competition' => $found->registration?->competition?->name ?? '-',
                ];
            }
        }

        return [
            'ok' => $errors === [] && $conflicts === [],
            'errors' => $errors,
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Apakah sekolah ini masih boleh menambah pendaftaran pada lomba tersebut.
     */
    public function canRegister(Competition $competition, int $schoolId, ?string $gender = null): array
    {
        if (! $competition->is_open) {
            return ['allowed' => false, 'reason' => 'Pendaftaran cabang lomba ini sedang ditutup.'];
        }

        // Kategori terpisah (Putra/Putri) punya kuota sendiri-sendiri.
        $label = $competition->isSeparateGender() && $gender
            ? ' kategori '.Competition::genderLabel($gender)
            : '';

        if ($competition->isSeparateGender() && $gender === null) {
            return [
                'allowed' => false,
                'reason' => 'Cabang lomba ini memisahkan kategori Putra dan Putri; jenis kelamin peserta wajib diisi.',
            ];
        }

        if ($competition->isFull($gender)) {
            return ['allowed' => false, 'reason' => "Kuota global{$label} cabang lomba ini sudah penuh."];
        }

        if ($competition->remainingSchoolQuota($schoolId, $gender) <= 0) {
            return ['allowed' => false, 'reason' => "Kuota sekolah Anda untuk{$label} cabang lomba ini sudah habis."];
        }

        return ['allowed' => true, 'reason' => null];
    }

    /**
     * Cek jumlah anggota grup terhadap min/max lomba beregu.
     */
    public function checkGroupSize(Competition $competition, int $memberCount): ?string
    {
        if (! $competition->isGroup()) {
            return $memberCount === 1 ? null : 'Lomba individu hanya boleh berisi 1 peserta.';
        }

        $min = $competition->min_group_members ?? 1;
        $max = $competition->max_group_members ?? 99;

        if ($memberCount < $min) {
            return "Jumlah anggota minimal {$min} orang.";
        }

        if ($memberCount > $max) {
            return "Jumlah anggota maksimal {$max} orang.";
        }

        return null;
    }
}
