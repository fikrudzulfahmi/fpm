<?php

namespace App\Http\Controllers;

use App\Jobs\VerifyLetterJob;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Participant;
use App\Models\Registration;
use App\Services\RegistrationGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function __construct(private readonly RegistrationGuard $guard)
    {
    }

    /**
     * Formulir pendaftaran: daftar lomba event aktif + sisa kuota
     * (global dan khusus sekolah yang login).
     */
    public function create(Request $request): Response
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event yang dibuka.');

        $schoolId = (int) $request->user()->school_id;

        $competitions = Competition::where('event_id', $event->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Competition $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'category_type' => $c->category_type,
                'gender_mode' => $c->gender_mode,
                'description' => $c->description,
                'global_quota' => $c->global_quota,
                'school_quota' => $c->school_quota,
                'min_group_members' => $c->min_group_members,
                'max_group_members' => $c->max_group_members,
                'is_open' => $c->is_open,
                'remaining_global' => $c->remainingGlobalQuota(),
                'remaining_school' => $c->remainingSchoolQuota($schoolId),
            ])
            ->values();

        return Inertia::render('School/Register', [
            'competitions' => $competitions,
            'school' => [
                'id' => $schoolId,
                'npsn' => $request->user()->school?->npsn,
                'school_name' => $request->user()->school?->school_name,
            ],
        ]);
    }

    /**
     * Cek NISN langsung saat diketik (dipanggil via fetch dari form).
     */
    public function nisnCheck(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nisn' => ['required', 'string'],
            'competition_id' => ['required', 'integer', 'exists:competitions,id'],
        ]);

        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event aktif.');

        $nisn = trim($data['nisn']);
        $competition = Competition::where('event_id', $event->id)->findOrFail($data['competition_id']);

        // Aturan format + bentrok lintas lomba dalam event yang sama.
        $batch = $this->guard->checkNisnBatch([$nisn], $event->id);

        $found = Participant::findActiveInEvent($nisn, $event->id);

        $schoolId = (int) $request->user()->school_id;

        $gender = $competition->isSeparateGender()
            ? $this->resolveGender($request->query('gender'))
            : null;

        $quota = $this->guard->canRegister($competition, $schoolId, $gender);

        return response()->json([
            'ok' => $batch['ok'] && $quota['allowed'],
            'errors' => $batch['errors'],
            'conflicts' => $batch['conflicts'],
            'reason' => $quota['reason'],
            'participant' => $found ? [
                'nisn' => $found->nisn,
                'full_name' => $found->full_name,
                'competition' => $found->registration?->competition?->name,
            ] : null,
            'remaining_global' => $competition->remainingGlobalQuota($gender),
            'remaining_school' => $competition->remainingSchoolQuota($schoolId, $gender),
        ]);
    }

    /**
     * Simpan pendaftaran + peserta, lalu kirim ke verifikasi surat (queue).
     */
    public function store(Request $request): RedirectResponse
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event yang dibuka.');

        $user = $request->user();
        $schoolId = (int) $user->school_id;

        $data = $request->validate([
            'competition_id' => ['required', 'integer'],
            'group_name' => ['nullable', 'string', 'max:120'],
            'companion_name' => ['required', 'string', 'max:150'],
            'companion_phone' => ['required', 'string', 'max:25'],
            'letter' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'participants' => ['required', 'array', 'min:1'],
            'participants.*.nisn' => ['required', 'string'],
            'participants.*.full_name' => ['required', 'string', 'max:150'],
            'participants.*.gender' => ['required', 'in:L,P'],
            'participants.*.birth_date' => ['required', 'date', 'before:today'],
        ]);

        $competition = Competition::where('event_id', $event->id)
            ->find($data['competition_id']);

        if (! $competition) {
            throw ValidationException::withMessages([
                'competition_id' => 'Cabang lomba tidak ditemukan pada event yang sedang berjalan.',
            ]);
        }

        if ($competition->isGroup() && blank($data['group_name'] ?? null)) {
            throw ValidationException::withMessages([
                'group_name' => 'Nama grup wajib diisi untuk lomba beregu.',
            ]);
        }

        // Lomba individu: gender peserta pertama menentukan kategori (Putra/Putri).
        $gender = $competition->isSeparateGender()
            ? $this->resolveGender($data['participants'][0]['gender'] ?? null)
            : null;

        if ($competition->isSeparateGender() && $competition->isGroup()) {
            throw ValidationException::withMessages([
                'competition_id' => 'Cabang lomba beregu tidak bisa memakai kategori gender terpisah.',
            ]);
        }

        $quota = $this->guard->canRegister($competition, $schoolId, $gender);

        if (! $quota['allowed']) {
            throw ValidationException::withMessages([
                'competition_id' => $quota['reason'] ?? 'Pendaftaran tidak diizinkan.',
            ]);
        }

        $memberCount = count($data['participants']);
        $groupError = $this->guard->checkGroupSize($competition, $memberCount);

        if ($groupError) {
            throw ValidationException::withMessages([
                'participants' => $groupError,
            ]);
        }

        $nisnList = array_map(
            fn ($p) => trim((string) $p['nisn']),
            $data['participants']
        );

        $check = $this->guard->checkNisnBatch($nisnList, $event->id);

        if (! $check['ok']) {
            $messages = [...$check['errors']];

            foreach ($check['conflicts'] as $conflict) {
                $messages[] = "NISN {$conflict['nisn']} ({$conflict['name']}) sudah terdaftar di "
                    ."{$conflict['competition']}.";
            }

            throw ValidationException::withMessages([
                'participants' => $messages, // array pesan, ditampilkan satu-satu
            ]);
        }

        $registration = DB::transaction(function () use ($request, $data, $event, $competition, $schoolId, $nisnList, $gender) {
            // Kunci baris lomba supaya kuota tidak bisa ditembus dua request
            // yang masuk bersamaan (cek di luar transaksi saja tidak cukup).
            $locked = Competition::whereKey($competition->id)->lockForUpdate()->first();

            $recheck = $this->guard->canRegister($locked, $schoolId, $gender);

            if (! $recheck['allowed']) {
                throw ValidationException::withMessages([
                    'competition_id' => $recheck['reason'] ?? 'Pendaftaran tidak diizinkan.',
                ]);
            }

            $nisnRecheck = $this->guard->checkNisnBatch($nisnList, $event->id);

            if (! $nisnRecheck['ok']) {
                $messages = [...$nisnRecheck['errors']];

                foreach ($nisnRecheck['conflicts'] as $conflict) {
                    $messages[] = "NISN {$conflict['nisn']} ({$conflict['name']}) sudah terdaftar di "
                        ."{$conflict['competition']}.";
                }

                throw ValidationException::withMessages(['participants' => $messages]);
            }

            $file = $request->file('letter');

            // Ekstensi diambil dari MIME yang sudah divalidasi, bukan dari nama
            // berkas kiriman klien (nama bisa berakhiran .php).
            $ext = match ($file->getMimeType()) {
                'application/pdf' => 'pdf',
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                default => 'pdf',
            };

            $path = 'letters/'.$event->year.'/'.Str::uuid().'.'.$ext;

            Storage::disk('local')->putFileAs(
                dirname($path),
                $file,
                basename($path)
            );

            $registration = Registration::create([
                'event_id' => $event->id,
                'competition_id' => $competition->id,
                'school_id' => $schoolId,
                'group_name' => $competition->isGroup() ? ($data['group_name'] ?? null) : null,
                'gender' => $gender,
                'companion_name' => $data['companion_name'],
                'companion_phone' => $data['companion_phone'],
                'recommendation_letter_path' => $path,
                'recommendation_letter_mime' => $file->getMimeType(),
                'ai_status' => 'pending',
                'status' => 'pending',
            ]);

            foreach ($data['participants'] as $row) {
                Participant::create([
                    'registration_id' => $registration->id,
                    'nisn' => trim((string) $row['nisn']),
                    'full_name' => $row['full_name'],
                    'gender' => $row['gender'],
                    'birth_date' => $row['birth_date'],
                    'event_id' => $event->id,
                ]);
            }

            return $registration;
        });

        VerifyLetterJob::dispatch($registration);

        return redirect()->route('dashboard')
            ->with('success', 'Pendaftaran terkirim. Surat rekomendasi sedang diperiksa otomatis.');
    }

    /**
     * Normalisasi nilai gender dari request/form menjadi L / P / null.
     */
    private function resolveGender(?string $value): ?string
    {
        $value = strtoupper(trim((string) $value));

        return in_array($value, ['L', 'P'], true) ? $value : null;
    }

    /**
     * Detail satu pendaftaran milik sekolah yang login.
     */
    public function show(Request $request, Registration $registration): Response
    {
        $user = $request->user();

        if (! $user->isAdmin() && (int) $registration->school_id !== (int) $user->school_id) {
            abort(403, 'Pendaftaran ini bukan milik sekolah Anda.');
        }

        $registration->load([
            'competition:id,name,slug,category_type,min_group_members,max_group_members',
            'school:id,npsn,school_name',
            'participants',
            'score',
            'event:id,event_name,year',
        ]);

        $setting = $registration->event?->setting();
        $publishScores = (bool) $setting?->publish_scores;

        return Inertia::render('School/RegistrationDetail', [
            'registration' => [
                'id' => $registration->id,
                'status' => $registration->status,
                'ai_status' => $registration->ai_status,
                'ai_notes' => $registration->ai_notes,
                'rejection_reason' => $registration->rejection_reason,
                'group_name' => $registration->group_name,
                'companion_name' => $registration->companion_name,
                'companion_phone' => $registration->companion_phone,
                'has_letter' => (bool) $registration->recommendation_letter_path,
                'verified_at' => $registration->verified_at?->toIso8601String(),
                'created_at' => $registration->created_at?->toIso8601String(),
                'competition' => $registration->competition,
                'school' => $registration->school,
                'event' => $registration->event,
                'participants' => $registration->participants,
                'score' => ($publishScores && $registration->score) ? $registration->score : null,
            ],
            'enable_certificates' => (bool) $setting?->enable_certificates,
            'publish_scores' => $publishScores,
        ]);
    }
}
