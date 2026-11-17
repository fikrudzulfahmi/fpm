<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Uji selalu pakai SQLite in-memory supaya tidak menyentuh database
     * staging. Env container menang atas phpunit.xml, jadi dipaksa di sini
     * sebelum aplikasi dibuat.
     */
    protected function setUp(): void
    {
        foreach ([
            'APP_ENV' => 'testing',
            'DB_CONNECTION' => 'sqlite',
            'DB_DATABASE' => ':memory:',
            'DB_URL' => '',
            'CACHE_STORE' => 'array',
            'SESSION_DRIVER' => 'array',
        ] as $key => $value) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }

        // Hapus cache config agar putenv di atas jadi efektif
        if (file_exists(__DIR__.'/../bootstrap/cache/config.php')) {
            @unlink(__DIR__.'/../bootstrap/cache/config.php');
        }

        parent::setUp();
    }
}
