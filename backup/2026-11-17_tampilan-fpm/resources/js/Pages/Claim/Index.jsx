import { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Field from '../../Components/Field';
import { waLink } from '../../lib/format';

function waToken() {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function StepHeader({ step, title, hint }) {
    return (
        <div className="mb-4 flex items-start gap-3">
            <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
            >
                {step}
            </span>
            <div>
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
            </div>
        </div>
    );
}

function WhatsappButton({ number, message }) {
    const href = waLink(number, message);
    if (!href) {
        return (
            <p className="text-sm text-slate-500">
                Nomor WhatsApp panitia belum disetel. Hubungi panitia lewat sekolah lain atau media sosial resmi.
            </p>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.16c-.24.68-1.42 1.31-1.96 1.36-.54.05-1.05.24-3.54-.74-2.99-1.18-4.87-4.27-5.02-4.47-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.83 2.04.9 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.13.65-.08.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.71.81 2.01.96.3.15.5.22.57.35.07.13.07.75-.17 1.43z" />
            </svg>
            Hubungi Panitia via WhatsApp
        </a>
    );
}

export default function ClaimIndex({ admin_whatsapp: waFromServer }) {
    const { event } = usePage().props;
    const [waNumber, setWaNumber] = useState(waFromServer ?? null);

    const [npsn, setNpsn] = useState('');
    const [checking, setChecking] = useState(false);
    const [checkError, setCheckError] = useState(null);
    const [result, setResult] = useState(null); // { status, school }

    const form = useForm({
        npsn: '',
        name: '',
        email: '',
        username: '',
        password: '',
        password_confirmation: '',
        whatsapp: '',
    });

    const cekNpsn = async (e) => {
        e.preventDefault();
        setCheckError(null);

        if (!/^\d{8}$/.test(npsn.trim())) {
            setCheckError('NPSN harus tepat 8 digit angka.');
            return;
        }

        setChecking(true);

        try {
            const res = await fetch(`/klaim/cek?npsn=${encodeURIComponent(npsn.trim())}`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': waToken(),
                },
                body: JSON.stringify({ npsn: npsn.trim() }),
            });

            if (res.status === 422) {
                const body = await res.json().catch(() => ({}));
                setCheckError(body?.errors?.npsn?.[0] ?? 'NPSN tidak valid.');
                return;
            }

            if (!res.ok) {
                setCheckError('Gagal memeriksa NPSN. Coba lagi sebentar.');
                return;
            }

            const body = await res.json();
            if (body.admin_whatsapp && !waNumber) setWaNumber(body.admin_whatsapp);

            const status = body.status ?? (body.not_found ? 'not_found' : body.claimed ? 'claimed' : 'available');
            setResult({ status, school: body.school ?? null });

            if (status === 'available') {
                form.setData('npsn', npsn.trim());
            }
        } catch {
            setCheckError('Jaringan bermasalah. Periksa koneksi lalu coba lagi.');
        } finally {
            setChecking(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        form.post('/klaim/daftar');
    };

    const resetCheck = () => {
        setResult(null);
        setCheckError(null);
    };

    return (
        <>
            <Head title="Klaim Akun Sekolah" />

            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
                <div className="w-full max-w-2xl">
                    <div className="mb-6 text-center">
                        <div
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg"
                            style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                            aria-hidden="true"
                        >
                            FP
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">{event?.event_name ?? 'Festival Pelajar Muslim'}</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Klaim akun sekolah dengan NPSN untuk mendaftarkan peserta.
                        </p>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        {/* Step 1 — cek NPSN */}
                        <section>
                            <StepHeader
                                step="1"
                                title="Cek NPSN Sekolah"
                                hint="Masukkan 8 digit NPSN yang terdaftar di data panitia."
                            />

                            <form onSubmit={cekNpsn} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <div className="flex-1">
                                    <Field
                                        label="NPSN"
                                        name="npsn"
                                        inputMode="numeric"
                                        maxLength={8}
                                        placeholder="20514401"
                                        value={npsn}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setNpsn(v);
                                            setResult(null);
                                        }}
                                        error={checkError}
                                        className="[&_label]:sr-only"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={checking || npsn.length !== 10}
                                    className="mt-0 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 sm:mt-0"
                                    style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                                >
                                    {checking ? 'Memeriksa…' : 'Cek NPSN'}
                                </button>
                            </form>
                        </section>

                        {/* Hasil cek */}
                        {result?.status === 'claimed' && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm font-semibold text-amber-900">Sekolah sudah diklaim</p>
                                <p className="mt-1 text-sm text-amber-800">
                                    NPSN {result.school?.npsn ?? npsn} ({result.school?.school_name ?? 'sekolah ini'}) sudah
                                    memiliki akun. Masuk memakai akun tersebut, atau hubungi panitia bila lupa kata sandi.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                                        style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                                    >
                                        Ke Halaman Masuk
                                    </Link>
                                    <WhatsappButton
                                        number={waNumber}
                                        message={`Halo panitia, akun sekolah NPSN ${result.school?.npsn ?? npsn} sudah diklaim tapi saya tidak bisa masuk.`}
                                    />
                                </div>
                            </div>
                        )}

                        {result?.status === 'not_found' && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                                <p className="text-sm font-semibold text-rose-900">NPSN tidak ditemukan</p>
                                <p className="mt-1 text-sm text-rose-800">
                                    NPSN {npsn} belum ada di data sekolah panitia. Hubungi panitia untuk menambahkan sekolah
                                    Anda lebih dulu.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <WhatsappButton
                                        number={waNumber}
                                        message={`Halo panitia, sekolah kami (NPSN ${npsn}) belum terdaftar. Mohon dibantu.`}
                                    />
                                    <button
                                        type="button"
                                        onClick={resetCheck}
                                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                                    >
                                        Coba NPSN Lain
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2 — formulir akun */}
                        {result?.status === 'available' && (
                            <section className="border-t border-slate-100 pt-4">
                                <StepHeader
                                    step="2"
                                    title="Buat Akun Sekolah"
                                    hint={
                                        result.school
                                            ? `${result.school.school_name} · NPSN ${result.school.npsn}`
                                            : 'Lengkapi data akun penanggung jawab.'
                                    }
                                />

                                <form onSubmit={submit} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Nama Penanggung Jawab"
                                            name="name"
                                            required
                                            value={form.data.name}
                                            error={form.errors}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            placeholder="Nama lengkap"
                                            className="sm:col-span-2"
                                        />
                                        <Field
                                            label="Email"
                                            name="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            value={form.data.email}
                                            error={form.errors}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            placeholder="sekolah@contoh.sch.id"
                                        />
                                        <Field
                                            label="Username"
                                            name="username"
                                            required
                                            autoComplete="username"
                                            value={form.data.username}
                                            error={form.errors}
                                            onChange={(e) => form.setData('username', e.target.value)}
                                            placeholder="sman1contoh"
                                            hint="Huruf, angka, garis bawah, atau tanda hubung."
                                        />
                                        <Field
                                            label="Kata Sandi"
                                            name="password"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={form.data.password}
                                            error={form.errors}
                                            onChange={(e) => form.setData('password', e.target.value)}
                                            hint="Minimal 8 karakter."
                                        />
                                        <Field
                                            label="Ulangi Kata Sandi"
                                            name="password_confirmation"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={form.data.password_confirmation}
                                            error={form.errors}
                                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                        />
                                        <Field
                                            label="Nomor WhatsApp"
                                            name="whatsapp"
                                            required
                                            inputMode="tel"
                                            value={form.data.whatsapp}
                                            error={form.errors}
                                            onChange={(e) => form.setData('whatsapp', e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                        <Field
                                            label="NPSN"
                                            name="npsn"
                                            required
                                            readOnly
                                            value={form.data.npsn}
                                            error={form.errors}
                                            className="[&_input]:bg-slate-100"
                                        />
                                    </div>

                                    {form.errors?.npsn && (
                                        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                            {form.errors.npsn}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={form.processing}
                                            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                                            style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                                        >
                                            {form.processing ? 'Menyimpan…' : 'Buat Akun & Masuk'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetCheck}
                                            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                        >
                                            Ganti NPSN
                                        </button>
                                    </div>
                                </form>
                            </section>
                        )}
                    </div>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Sudah punya akun?{' '}
                        <Link
                            href="/login"
                            className="font-semibold underline decoration-2 underline-offset-2"
                            style={{ color: 'var(--primary-color, #0f766e)' }}
                        >
                            Masuk
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
