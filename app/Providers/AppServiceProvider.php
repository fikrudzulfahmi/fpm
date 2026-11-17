<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Aplikasi berbahasa Indonesia: pastikan pesan validasi, auth, dan tanggal
        // memakai locale id meski .env server masih APP_LOCALE=en.
        app()->setLocale('id');
    }
}
