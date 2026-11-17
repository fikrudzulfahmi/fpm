<?php

namespace App\Http\Controllers;

use App\Models\Competition;
use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman publik (tanpa auth): landing event + daftar cabang lomba.
 */
class PublicController extends Controller
{
    public function index(): Response
    {
        $event = Event::current();

        return Inertia::render('Guest/Landing', [
            'event_info' => $this->eventInfo($event),
            'competitions' => $this->competitions($event),
            'totals' => [
                'competitions' => $event ? $event->competitions()->count() : 0,
                'open_competitions' => $event
                    ? $event->competitions()->where('is_open', true)->count()
                    : 0,
                'remaining_quota' => $this->competitions($event)
                    ->sum(fn (array $c) => $c['remaining_quota']),
            ],
        ]);
    }

    public function lomba(): Response
    {
        $event = Event::current();

        return Inertia::render('Guest/Lomba', [
            'event_info' => $this->eventInfo($event),
            'competitions' => $this->competitions($event),
        ]);
    }

    public function show(Competition $competition): Response
    {
        $event = Event::current();

        return Inertia::render('Guest/LombaShow', [
            'event_info' => $this->eventInfo($event),
            'competition' => [
                'id' => $competition->id,
                'name' => $competition->name,
                'slug' => $competition->slug,
                'category_type' => $competition->category_type,
                'gender_mode' => $competition->gender_mode,
                'used_putra' => $competition->approvedCount('L'),
                'used_putri' => $competition->approvedCount('P'),
                'description' => $competition->description,
                'global_quota' => $competition->global_quota,
                'used_quota' => $competition->approvedCount(),
                'remaining_quota' => $competition->remainingGlobalQuota(),
                'min_group_members' => $competition->min_group_members,
                'max_group_members' => $competition->max_group_members,
                'is_open' => (bool) $competition->is_open,
                'is_full' => $competition->isFull(),
            ],
        ]);
    }

    private function eventInfo(?Event $event): array
    {
        if (! $event) {
            return [
                'event_name' => 'Festival Pelajar Muslim',
                'tagline' => 'Event belum disiapkan panitia.',
                'year' => null,
            ];
        }

        $theme = $event->theme();

        return [
            'event_name' => $event->event_name,
            'tagline' => $theme['edition_title'] ?? $event->event_name,
            'year' => $event->year,
            'logo_url' => $theme['logo_url'] ?? null,
            'admin_whatsapp' => optional($event->setting())->admin_whatsapp,
        ];
    }

    private function competitions(?Event $event)
    {
        if (! $event) {
            return collect();
        }

        return $event->competitions()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Competition $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'category_type' => $c->category_type,
                'gender_mode' => $c->gender_mode,
                'used_putra' => $c->approvedCount('L'),
                'used_putri' => $c->approvedCount('P'),
                'description' => $c->description,
                'global_quota' => $c->global_quota,
                'used_quota' => $c->approvedCount(),
                'remaining_quota' => $c->remainingGlobalQuota(),
                'min_group_members' => $c->min_group_members,
                'max_group_members' => $c->max_group_members,
                'is_open' => (bool) $c->is_open,
                'is_full' => $c->isFull(),
            ])
            ->values();
    }
}
