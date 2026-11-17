<?php

namespace Tests\Feature;

use App\Models\Competition;
use App\Models\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicPagesTest extends TestCase
{
    use RefreshDatabase;

    private function seedEvent(): Event
    {
        $event = Event::create([
            'event_name' => 'Festival Pelajar Muslim',
            'year' => 2026,
            'is_active' => true,
            'theme_config' => ['primary' => '#0f766e', 'secondary' => '#c9a45c', 'edition_title' => 'FPM XIV 2026'],
        ]);

        Competition::create([
            'event_id' => $event->id,
            'name' => 'Cerdas Cermat PAI',
            'slug' => 'cerdas-cermat-pai',
            'category_type' => 'group',
            'global_quota' => 12,
            'school_quota' => 1,
            'min_group_members' => 3,
            'max_group_members' => 3,
            'is_open' => true,
            'sort_order' => 1,
            'description' => 'Satu tim 3 siswa per sekolah.',
        ]);

        return $event;
    }

    public function test_landing_is_public_and_shows_event_and_competitions(): void
    {
        $this->seedEvent();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guest/Landing')
                ->where('event_info.event_name', 'Festival Pelajar Muslim')
                ->where('event_info.tagline', 'FPM XIV 2026')
                ->has('competitions', 1)
                ->where('competitions.0.name', 'Cerdas Cermat PAI')
                ->where('competitions.0.remaining_quota', 12)
                ->where('totals.competitions', 1));
    }

    public function test_lomba_index_lists_competitions_without_auth(): void
    {
        $this->seedEvent();

        $this->get('/lomba')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guest/Lomba')
                ->has('competitions', 1)
                ->where('competitions.0.category_type', 'group')
                ->where('competitions.0.is_open', true));
    }

    public function test_lomba_detail_by_slug(): void
    {
        $this->seedEvent();

        // Single reg exists in seed = used_quota 1
        $this->get('/lomba/cerdas-cermat-pai')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guest/LombaShow')
                ->where('competition.name', 'Cerdas Cermat PAI')
                ->where('competition.global_quota', 12)
                ->where('competition.remaining_quota', 12));

        $this->get('/lomba/slug-tidak-ada')->assertNotFound();
    }

    public function test_public_pages_render_without_any_event(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Guest/Landing'));
        $this->get('/lomba')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Guest/Lomba'));
    }
}
