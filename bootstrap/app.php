<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureFullAdmin;
use App\Http\Middleware\EnsureSchool;
use App\Http\Middleware\ForceHttps;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Di balik Cloudflare + Caddy, semua request masuk sebagai https.
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            ForceHttps::class,
            SecurityHeaders::class,
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'admin' => EnsureAdmin::class,
            'full-admin' => EnsureFullAdmin::class,
            'school' => EnsureSchool::class,
        ]);

        // Guests diarahkan ke halaman login sekolah.
        $middleware->redirectGuestsTo(fn () => route('login'));
        $middleware->redirectUsersTo(fn () => route('dashboard'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
