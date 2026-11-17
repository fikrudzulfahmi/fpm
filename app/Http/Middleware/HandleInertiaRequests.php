<?php

namespace App\Http\Middleware;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $event = Event::current();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'whatsapp' => $user->whatsapp,
                    'role' => $user->role,
                    'is_juri' => (bool) $user->is_juri,
                    'access_level' => $user->access_level,
                    'is_pj' => $user->isPjOnly(),
                    'competition' => $user->competition ? [
                        'id' => $user->competition->id,
                        'name' => $user->competition->name,
                    ] : null,
                    'is_active' => (bool) $user->is_active,
                    'can_manage' => $user->canManage(),
                    'school' => $user->school ? [
                        'id' => $user->school->id,
                        'npsn' => $user->school->npsn,
                        'school_name' => $user->school->school_name,
                    ] : null,
                ] : null,
            ],
            'event' => $event ? [
                'id' => $event->id,
                'event_name' => $event->event_name,
                'year' => $event->year,
                'theme' => $event->theme(),
                // Dipakai tombol WhatsApp & footer halaman publik.
                'admin_whatsapp' => optional($event->setting())->admin_whatsapp,
            ] : null,
            // Tema dipakai root blade untuk inject CSS variables.
            'theme' => $event ? $event->theme() : null,
            // Informasi resmi festival (config/fpm.php): tanggal, lokasi, kontak.
            'site' => config('fpm'),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
