<?php

use App\Http\Controllers\Admin\CertificateSettingController;
use App\Http\Controllers\Admin\CompetitionController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\RegistrationController as AdminRegistrationController;
use App\Http\Controllers\Admin\SchoolController;
use App\Http\Controllers\Admin\ScoreController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LetterController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Publik
|--------------------------------------------------------------------------
*/

// Halaman publik (guest) — tanpa auth.
Route::get('/', [PublicController::class, 'index'])->name('home');
Route::get('/lomba', [PublicController::class, 'lomba'])->name('lomba.index');
Route::get('/lomba/{competition:slug}', [PublicController::class, 'show'])->name('lomba.show');

/*
|--------------------------------------------------------------------------
| Autentikasi
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1')
        ->name('login.store');

    Route::get('/klaim', [ClaimController::class, 'index'])->name('klaim.index');
    Route::post('/klaim/cek', [ClaimController::class, 'cek'])
        ->middleware('throttle:20,1')
        ->name('klaim.cek');
    Route::post('/klaim/daftar', [ClaimController::class, 'daftar'])
        ->middleware('throttle:10,1')
        ->name('klaim.daftar');
});

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

/*
|--------------------------------------------------------------------------
| Dashboard (admin atau sekolah, ditentukan di controller)
|--------------------------------------------------------------------------
*/

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware('auth')
    ->name('dashboard');

/*
|--------------------------------------------------------------------------
| Area sekolah
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'school'])->group(function () {
    Route::get('/daftar', [RegistrationController::class, 'create'])->name('pendaftaran.create');
    Route::post('/daftar', [RegistrationController::class, 'store'])->name('pendaftaran.store');

    Route::get('/pendaftaran/{registration}', [RegistrationController::class, 'show'])
        ->name('pendaftaran.show');

    Route::get('/api/nisn-check', [RegistrationController::class, 'nisnCheck'])
        ->middleware('throttle:60,1')
        ->name('api.nisn-check');

    Route::get('/sertifikat/{registration}', [CertificateController::class, 'participant'])
        ->name('sertifikat.participant');

    Route::get('/sertifikat/{registration}/peserta/{participant}', [CertificateController::class, 'perParticipant'])
        ->name('sertifikat.per-peserta');

    Route::get('/pendaftaran/{registration}/surat', [LetterController::class, 'show'])
        ->name('pendaftaran.surat');
});

/*
|--------------------------------------------------------------------------
| Area panitia — boleh diakses admin penuh & juri
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Nilai (juri & panitia)
        Route::get('/nilai', [ScoreController::class, 'index'])->name('nilai.index');
        Route::post('/nilai', [ScoreController::class, 'upsert'])->name('nilai.upsert');
        Route::post('/nilai/publikasi', [ScoreController::class, 'publish'])->name('nilai.publish');

        // Unduh piagam juara (juri tidak butuh, tapi tidak merugikan)
        Route::get('/piagam/{registration}', [CertificateController::class, 'award'])
            ->name('piagam');

        Route::get('/piagam/{registration}/peserta/{participant}', [CertificateController::class, 'perParticipant'])
            ->name('piagam.per-peserta');
    });

/*
|--------------------------------------------------------------------------
| Area panitia penuh — manajemen data induk
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'admin', 'full-admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Pendaftaran
        Route::get('/pendaftaran', [AdminRegistrationController::class, 'index'])
            ->name('pendaftaran.index');
        Route::get('/pendaftaran/{registration}', [AdminRegistrationController::class, 'show'])
            ->name('pendaftaran.show');
        Route::post('/pendaftaran/{registration}/setujui', [AdminRegistrationController::class, 'approve'])
            ->name('pendaftaran.approve');
        Route::post('/pendaftaran/{registration}/tolak', [AdminRegistrationController::class, 'reject'])
            ->name('pendaftaran.reject');
        Route::post('/pendaftaran/{registration}/verifikasi-ulang', [AdminRegistrationController::class, 'reverifyAi'])
            ->name('pendaftaran.reverify-ai');

        Route::get('/pendaftaran/{registration}/surat', [LetterController::class, 'show'])
            ->name('pendaftaran.surat-unduh');

        // Master sekolah
        Route::get('/sekolah', [SchoolController::class, 'index'])->name('sekolah.index');
        Route::post('/sekolah', [SchoolController::class, 'store'])->name('sekolah.store');
        Route::post('/sekolah/impor', [SchoolController::class, 'import'])->name('sekolah.import');
        Route::put('/sekolah/{school}', [SchoolController::class, 'update'])->name('sekolah.update');
        Route::delete('/sekolah/{school}', [SchoolController::class, 'destroy'])->name('sekolah.destroy');
        Route::post('/sekolah/{school}/lepas-klaim', [SchoolController::class, 'release'])
            ->name('sekolah.release');

        // Akun panitia & juri
        Route::get('/akun', [UserController::class, 'index'])->name('akun.index');
        Route::post('/akun', [UserController::class, 'store'])->name('akun.store');
        Route::put('/akun/{user}', [UserController::class, 'update'])->name('akun.update');
        Route::post('/akun/{user}/reset-password', [UserController::class, 'resetPassword'])
            ->name('akun.reset-password');
        Route::delete('/akun/{user}', [UserController::class, 'destroy'])->name('akun.destroy');

        // Event & cabang lomba
        Route::get('/event', [EventController::class, 'index'])->name('events.index');
        Route::post('/event', [EventController::class, 'store'])->name('events.store');
        Route::put('/event/{event}', [EventController::class, 'update'])->name('events.update');
        Route::delete('/event/{event}', [EventController::class, 'destroy'])->name('events.destroy');
        Route::post('/event/{event}/aktifkan', [EventController::class, 'activate'])
            ->name('events.activate');
        Route::post('/event/{event}/logo', [EventController::class, 'uploadLogo'])
            ->name('events.logo');
        Route::delete('/event/{event}/logo', [EventController::class, 'deleteLogo'])
            ->name('events.logo.destroy');
        Route::put('/event/{event}/setelan', [EventController::class, 'updateSettings'])
            ->name('events.settings');

        // Manajemen cabang lomba (event aktif)
        Route::get('/lomba', [CompetitionController::class, 'index'])->name('competitions.index');
        Route::post('/lomba', [CompetitionController::class, 'store'])->name('competitions.store');
        Route::put('/lomba/{competition}', [CompetitionController::class, 'update'])
            ->name('competitions.update');
        Route::post('/lomba/{competition}/status', [CompetitionController::class, 'toggleOpen'])
            ->name('competitions.status');
        Route::post('/lomba/{competition}/undian', [CompetitionController::class, 'drawOrder'])
            ->name('competitions.draw');
        Route::delete('/lomba/{competition}', [CompetitionController::class, 'destroy'])
            ->name('competitions.destroy');

        // Sertifikat peserta & piagam juara
        Route::get('/sertifikat', [CertificateSettingController::class, 'index'])->name('sertifikat.index');
        Route::put('/sertifikat', [CertificateSettingController::class, 'update'])->name('sertifikat.update');
        Route::post('/sertifikat/latar', [CertificateSettingController::class, 'uploadBackground'])
            ->name('sertifikat.latar');
        Route::delete('/sertifikat/latar', [CertificateSettingController::class, 'deleteBackground'])
            ->name('sertifikat.latar.destroy');
        Route::get('/sertifikat/pratinjau', [CertificateSettingController::class, 'preview'])
            ->name('sertifikat.pratinjau');
    });
