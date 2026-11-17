<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * Desain sertifikat peserta & piagam juara untuk event aktif.
 */
class CertificateSettingController extends Controller
{
    private const COLOR_RULE = ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'];

    public function index(Request $request): Response
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $setting = $event->setting();

        $sample = Registration::with(['participants', 'competition', 'school'])
            ->where('event_id', $event->id)
            ->where('status', 'approved')
            ->orderByDesc('id')
            ->first();

        $awards = Registration::with(['participants:id,registration_id,full_name', 'competition:id,name', 'school:id,school_name', 'score'])
            ->where('event_id', $event->id)
            ->where('status', 'approved')
            ->whereHas('score', fn ($query) => $query->whereNotNull('rank'))
            ->get()
            ->sortBy(fn (Registration $r) => [$r->competition?->name, $r->score?->rank])
            ->values()
            ->map(fn (Registration $r) => [
                'id' => $r->id,
                'display_name' => $r->displayName(),
                'school' => $r->school?->school_name,
                'competition' => $r->competition?->name,
                'rank' => $r->score?->rank,
                'score_value' => $r->score?->score_value,
            ]);

        return Inertia::render('Admin/Certificate/Index', [
            'event' => [
                'id' => $event->id,
                'event_name' => $event->event_name,
                'year' => $event->year,
            ],
            'settings' => [
                'publish_scores' => (bool) $setting->publish_scores,
                'enable_certificates' => (bool) $setting->enable_certificates,
            ],
            'certificate' => $setting->certificateConfig(),
            'award' => $setting->awardConfig(),
            'awards' => $awards,
            'sample_registration_id' => $sample?->id,
            'sample' => [
                'name' => $sample?->displayName() ?? 'Nama Peserta',
                'school' => $sample?->school?->school_name ?? 'Nama Sekolah',
                'competition' => $sample?->competition?->name ?? 'Cabang Lomba',
                'nisn' => $sample?->participants->first()?->nisn,
            ],
            'layouts_default' => [
                'certificate' => Setting::defaultLayout('certificate'),
                'award' => Setting::defaultLayout('award'),
            ],
            'logo_url' => $event->theme()['logo_url'] ?? null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $data = $request->validate([
            'publish_scores' => ['sometimes', 'boolean'],
            'enable_certificates' => ['sometimes', 'boolean'],

            'certificate.title' => ['required', 'string', 'max:80'],
            'certificate.subtitle' => ['nullable', 'string', 'max:80'],
            'certificate.footer' => ['nullable', 'string', 'max:160'],
            'certificate.bg_color' => self::COLOR_RULE,
            'certificate.text_color' => self::COLOR_RULE,
            'certificate.accent_color' => self::COLOR_RULE,
            'certificate.signer_name' => ['nullable', 'string', 'max:120'],
            'certificate.signer_title' => ['nullable', 'string', 'max:120'],
            'certificate.signer2_name' => ['nullable', 'string', 'max:120'],
            'certificate.signer2_title' => ['nullable', 'string', 'max:120'],
            'certificate.show_signature' => ['sometimes', 'boolean'],
            'certificate.show_logo' => ['sometimes', 'boolean'],
            'certificate.layout' => ['sometimes', 'array'],
            'certificate.layout.*.x' => ['numeric', 'min:0', 'max:100'],
            'certificate.layout.*.y' => ['numeric', 'min:0', 'max:100'],
            'certificate.layout.*.w' => ['numeric', 'min:3', 'max:100'],
            'certificate.layout.*.size' => ['numeric', 'min:4', 'max:72'],
            'certificate.layout.*.align' => ['in:left,center,right'],

            'award.bg_color' => self::COLOR_RULE,
            'award.text_color' => self::COLOR_RULE,
            'award.accent_color' => self::COLOR_RULE,
            'award.signer_name' => ['nullable', 'string', 'max:120'],
            'award.signer_title' => ['nullable', 'string', 'max:120'],
            'award.place' => ['nullable', 'string', 'max:80'],
            'award.number_prefix' => ['nullable', 'string', 'max:40'],
            'award.show_logo' => ['sometimes', 'boolean'],
            'award.layout' => ['sometimes', 'array'],
            'award.layout.*.x' => ['numeric', 'min:0', 'max:100'],
            'award.layout.*.y' => ['numeric', 'min:0', 'max:100'],
            'award.layout.*.w' => ['numeric', 'min:3', 'max:100'],
            'award.layout.*.size' => ['numeric', 'min:4', 'max:72'],
            'award.layout.*.align' => ['in:left,center,right'],
        ]);

        $setting = $event->setting();

        $certificate = array_merge(
            $setting->certificateConfig(),
            array_filter($data['certificate'] ?? [], fn ($value) => $value !== null)
        );
        if (isset($data['certificate']['layout'])) {
            $certificate['layout'] = $this->sanitizeLayout($data['certificate']['layout'], 'certificate');
        }

        $award = array_merge(
            $setting->awardConfig(),
            array_filter($data['award'] ?? [], fn ($value) => $value !== null)
        );

        if (isset($data['award']['layout'])) {
            $award['layout'] = $this->sanitizeLayout($data['award']['layout'], 'award');
        }

        $setting->fill([
            'publish_scores' => $data['publish_scores'] ?? $setting->publish_scores,
            'enable_certificates' => $data['enable_certificates'] ?? $setting->enable_certificates,
            'certificate_template_config' => $certificate,
            'award_config' => $award,
        ])->save();

        return back()->with('success', 'Desain sertifikat & piagam disimpan.');
    }

    /**
     * Batasi tata letak ke kunci yang dikenal, angka dibulatkan 2 desimal.
     */
    private function sanitizeLayout(array $layout, string $type): array
    {
        $defaults = Setting::defaultLayout($type);
        $clean = [];

        foreach ($defaults as $key => $default) {
            if (! isset($layout[$key]) || ! is_array($layout[$key])) {
                continue;
            }

            $item = array_merge($default, $layout[$key]);

            $clean[$key] = [
                'x' => round(max(0, min(100, (float) $item['x'])), 2),
                'y' => round(max(0, min(100, (float) $item['y'])), 2),
                'w' => round(max(3, min(100, (float) $item['w'])), 2),
                'size' => round(max(4, min(72, (float) $item['size'])), 2),
                'align' => in_array($item['align'], ['left', 'center', 'right'], true) ? $item['align'] : $default['align'],
            ];
        }

        return array_merge($defaults, $clean);
    }

    /**
     * Unggah latar sertifikat atau piagam.
     */
    public function uploadBackground(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'target' => ['required', 'in:certificate,award'],
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $path = $this->storeImage($data['image'], 'branding/certificates');
        $setting = $event->setting();

        if ($data['target'] === 'award') {
            $config = $setting->awardConfig();
            $this->deleteStored($config['bg_image_url'] ?? null);
            $config['bg_image_url'] = $path;
            $setting->update(['award_config' => $config]);
        } else {
            $config = $setting->certificateConfig();
            $this->deleteStored($config['bg_image_url'] ?? null);
            $config['bg_image_url'] = $path;
            $setting->update(['certificate_template_config' => $config]);
        }

        return back()->with('success', 'Latar berhasil diunggah.');
    }

    public function deleteBackground(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'target' => ['required', 'in:certificate,award'],
        ]);

        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $setting = $event->setting();

        if ($data['target'] === 'award') {
            $config = $setting->awardConfig();
            $this->deleteStored($config['bg_image_url'] ?? null);
            $config['bg_image_url'] = null;
            $setting->update(['award_config' => $config]);
        } else {
            $config = $setting->certificateConfig();
            $this->deleteStored($config['bg_image_url'] ?? null);
            $config['bg_image_url'] = null;
            $setting->update(['certificate_template_config' => $config]);
        }

        return back()->with('success', 'Latar dihapus.');
    }

    /**
     * Pratinjau PDF sertifikat/piagam memakai data pendaftaran contoh.
     */
    public function preview(Request $request): HttpResponse
    {
        $event = Event::current();
        abort_if(! $event, 404, 'Belum ada event.');

        $type = $request->query('type') === 'award' ? 'award' : 'certificate';
        $registrationId = $request->integer('registration_id') ?: null;

        $registration = Registration::with(['participants', 'competition', 'school', 'score', 'event'])
            ->where('event_id', $event->id)
            ->when($registrationId, fn ($query) => $query->whereKey($registrationId))
            ->when(! $registrationId && $type === 'award', fn ($query) => $query
                ->whereHas('score', fn ($score) => $score->whereNotNull('rank'))
                ->orderByDesc('id'))
            ->when(! $registrationId && $type === 'certificate', fn ($query) => $query
                ->where('status', 'approved')
                ->orderByDesc('id'))
            ->first();

        abort_if(! $registration, 404, 'Belum ada pendaftaran yang bisa dijadikan contoh.');

        $setting = $event->setting();
        $theme = $event->theme();
        $competition = $registration->competition;
        $school = $registration->school;
        $registrationEvent = $registration->event ?? $event;

        if ($type === 'award') {
            $score = $registration->score;
            abort_if(! $score || $score->rank === null, 422, 'Pendaftaran contoh belum punya peringkat.');

            $pdf = Pdf::loadView('pdf.award', [
                'registration' => $registration,
                'competition' => $competition,
                'school' => $school,
                'score' => $score,
                'event' => $registrationEvent,
                'theme' => $theme,
                'config' => $setting->awardConfig(),
                'setting' => $setting,
            ]);
        } else {
            $pdf = Pdf::loadView('pdf.certificate', [
                'registration' => $registration,
                'school' => $school,
                'competition' => $competition,
                'registrationEvent' => $registrationEvent,
                'theme' => $theme,
                'config' => $setting->certificateConfig(),
                'setting' => $setting,
            ]);
        }

        return $pdf->setPaper('a4', 'landscape')->stream("pratinjau-{$type}.pdf", ['Attachment' => false]);
    }

    /**
     * Simpan gambar ke public/uploads/... dan kembalikan URL publiknya.
     */
    private function storeImage(UploadedFile $file, string $folder): string
    {
        $name = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'latar';

        // Ekstensi ditentukan dari MIME (hasil validasi `image`), bukan nama
        // berkas kiriman klien — mencegah berkas gambar bernama .php tersimpan
        // sebagai skrip yang bisa dieksekusi web server.
        $extension = match ($file->getMimeType()) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'image/avif' => 'avif',
            default => 'jpg',
        };

        $filename = $name.'-'.Str::random(6).'.'.$extension;

        $destination = public_path('uploads/'.$folder);
        $file->move($destination, $filename);

        return '/uploads/'.$folder.'/'.$filename;
    }

    /**
     * Hapus berkas lama agar storage tidak menumpuk.
     */
    private function deleteStored(?string $url): void
    {
        if (! $url || ! str_starts_with($url, '/uploads/')) {
            return;
        }

        $path = public_path(ltrim($url, '/'));

        if (is_file($path)) {
            @unlink($path);
        }
    }
}
