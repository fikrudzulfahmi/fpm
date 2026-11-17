<?php

namespace App\Http\Controllers;

use App\Models\Competition;
use App\Models\Event;
use App\Models\Registration;
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
        $competitions = $this->competitions($event);

        return Inertia::render('Guest/Landing', [
            'event_info' => $this->eventInfo($event),
            'competitions' => $competitions,
            'totals' => [
                'competitions' => $competitions->count(),
                'open_competitions' => $competitions->where('is_open', true)->count(),
                'remaining_quota' => $competitions->sum(fn (array $c) => $c['remaining_quota']),
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

        // Jangan tampilkan cabang dari event lain/event lama lewat slug.
        abort_if(! $event || (int) $competition->event_id !== (int) $event->id, 404);

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

    /**
     * Daftar cabang + hitungan kuota. Hitungan diambil dari satu query
     * agregat supaya tidak N+1 (3 query per cabang) pada halaman publik.
     */
    private function competitions(?Event $event)
    {
        if (! $event) {
            return collect();
        }

        $competitions = $event->competitions()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $counts = Registration::query()
            ->where('event_id', $event->id)
            ->whereIn('status', ['pending', 'approved'])
            ->selectRaw('competition_id, gender, COUNT(*) as total')
            ->groupBy('competition_id', 'gender')
            ->get()
            ->groupBy('competition_id');

        return $competitions
            ->map(function (Competition $c) use ($counts) {
                $rows = $counts->get($c->id, collect());
                $putra = (int) ($rows->firstWhere('gender', 'L')?->total ?? 0);
                $putri = (int) ($rows->firstWhere('gender', 'P')?->total ?? 0);
                $used = (int) $rows->sum('total');

                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'category_type' => $c->category_type,
                    'gender_mode' => $c->gender_mode,
                    'used_putra' => $putra,
                    'used_putri' => $putri,
                    'description' => $c->description,
                    'global_quota' => $c->global_quota,
                    'used_quota' => $used,
                    'remaining_quota' => max(0, $c->global_quota - $used),
                    'min_group_members' => $c->min_group_members,
                    'max_group_members' => $c->max_group_members,
                    'is_open' => (bool) $c->is_open,
                    'is_full' => $used >= $c->global_quota,
                ];
            })
            ->values();
    }
}
