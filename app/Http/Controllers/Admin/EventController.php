<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    // ------------------------------------------------------------------ events

    public function index(): Response
    {
        $events = Event::withCount('competitions')
            ->withCount('registrations')
            ->orderByDesc('year')
            ->get()
            ->map(fn (Event $e) => [
                'id' => $e->id,
                'event_name' => $e->event_name,
                'year' => $e->year,
                'is_active' => $e->is_active,
                'theme' => $e->theme(),
                'competitions_count' => $e->competitions_count,
                'registrations_count' => $e->registrations_count,
                'settings' => [
                    'admin_whatsapp' => $e->setting()->admin_whatsapp,
                    'publish_scores' => (bool) $e->setting()->publish_scores,
                    'enable_certificates' => (bool) $e->setting()->enable_certificates,
                ],
            ]);

        return Inertia::render('Admin/Event/Index', [
            'events' => $events,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'event_name' => ['required', 'string', 'max:150'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100', 'unique:events,year'],
            'theme_config' => ['nullable', 'array'],
        ]);

        Event::create($data);

        return redirect()->route('admin.events.index')
            ->with('success', 'Event baru berhasil dibuat.');
    }

    public function update(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'event_name' => ['required', 'string', 'max:150'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100',
                Rule::unique('events', 'year')->ignore($event->id)],
            'theme_config' => ['nullable', 'array'],
            'theme_config.primary' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme_config.secondary' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme_config.edition_title' => ['nullable', 'string', 'max:120'],
        ]);

        // Gabungkan agar logo/edition_title yang tidak dikirim form tetap tersimpan.
        $theme = array_filter(
            array_merge($event->theme_config ?: [], $data['theme_config'] ?? []),
            fn ($value) => $value !== null && $value !== ''
        );
        $data['theme_config'] = $theme;

        $event->update($data);

        return redirect()->route('admin.events.index')
            ->with('success', 'Event diperbarui.');
    }

    /**
     * Unggah/ganti logo event. Disimpan di public/uploads/branding.
     */
    public function uploadLogo(Request $request, Event $event): RedirectResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048'],
        ]);

        $file = $request->file('logo');
        $filename = 'logo-'.Str::slug($event->year.'-'.$event->id).'-'.Str::random(6)
            .'.'.$file->getClientOriginalExtension();
        $file->move(public_path('uploads/branding'), $filename);

        $theme = $event->theme_config ?: [];
        $old = $theme['logo_url'] ?? null;
        $theme['logo_url'] = '/uploads/branding/'.$filename;

        $event->update(['theme_config' => $theme]);
        $this->deleteStored($old);

        return back()->with('success', 'Logo event diperbarui.');
    }

    public function deleteLogo(Event $event): RedirectResponse
    {
        $theme = $event->theme_config ?: [];
        $old = $theme['logo_url'] ?? null;
        $theme['logo_url'] = null;

        $event->update(['theme_config' => $theme]);
        $this->deleteStored($old);

        return back()->with('success', 'Logo event dihapus.');
    }

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

    public function destroy(Event $event): RedirectResponse
    {
        abort_if($event->is_active, 422, 'Event aktif tidak bisa dihapus langsung. Nonaktifkan dulu.');
        abort_if($event->registrations()->exists(), 422, 'Event sudah memiliki pendaftaran; tidak bisa dihapus.');

        $event->delete();

        return redirect()->route('admin.events.index')
            ->with('success', 'Event dihapus.');
    }

    /**
     * Jadikan hanya event ini yang aktif.
     */
    public function activate(Event $event): RedirectResponse
    {
        Event::query()->update(['is_active' => false]);
        $event->update(['is_active' => true]);

        return redirect()->route('admin.events.index')
            ->with('success', "Event \"{$event->event_name}\" sekarang aktif.");
    }

    /**
     * Simpan setelan publish/certificate pada event yang diminta.
     * Bisa dipanggil dari halaman event maupun dari skor.
     */
    public function updateSettings(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'publish_scores' => ['sometimes', 'boolean'],
            'enable_certificates' => ['sometimes', 'boolean'],
            'certificate_template_config' => ['sometimes', 'nullable', 'array'],
            'admin_whatsapp' => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);

        $setting = $event->setting();
        $setting->fill($data)->save();

        return back()->with('success', 'Setelan disimpan.');
    }
}
