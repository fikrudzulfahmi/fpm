import { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Field from '../../Components/Field';
import { waLink } from '../../lib/format';

/** NPSN Indonesia selalu 8 digit — dipakai konsisten di klien dan server. */
const NPSN_LENGTH = 8;

function waToken() {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function StepHeader({ step, title, hint }) {
    return (
        <div className="fpm-claim-step">
            <span className="fpm-claim-step__num" aria-hidden="true">
                {step}
            </span>
            <div>
                <h2>{title}</h2>
                {hint && <p>{hint}</p>}
            </div>
        </div>
    );
}

function WhatsappButton({ number, message, children }) {
    const href = waLink(number, message);
    if (!href) {
        return (
            <p className="small muted">
                Nomor WhatsApp panitia belum disetel. Hubungi panitia lewat media sosial resmi sekolah.
            </p>
        );
    }

    return (
        <a href={href} target="_blank" rel="noreferrer noopener" className="btn btn--dark btn--sm">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="17" height="17">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.16c-.24.68-1.42 1.31-1.96 1.36-.54.05-1.05.24-3.54-.74-2.99-1.18-4.87-4.27-5.02-4.47-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.83 2.04.9 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.13.65-.08.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.71.81 2.01.96.3.15.5.22.57.35.07.13.07.75-.17 1.43z" />
            </svg>
            {children ?? 'Hubungi panitia via WhatsApp'}
        </a>
    );
}

export default function ClaimIndex({ admin_whatsapp: waFromServer }) {
    const { event, theme } = usePage().props;
    const [waNumber] = useState(waFromServer ?? event?.admin_whatsapp ?? null);

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

        if (!new RegExp(`^\\d{${NPSN_LENGTH}}$`).test(npsn.trim())) {
            setCheckError(`NPSN harus tepat ${NPSN_LENGTH} digit angka.`);
            return;
        }

        setChecking(true);

        try {
            const res = await fetch('/klaim/cek', {
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

    const eventName = event?.event_name ?? 'Festival Pelajar Muslim';
    const logo = theme?.logo_url ?? '/branding/logo-mark.png';

    return (
        <div className="fpm-site fpm-auth">
            <Head title="Klaim Akun Sekolah" />

            <div className="fpm-auth__inner fpm-auth__inner--wide">
                <Link href="/" className="brand fpm-auth__brand" aria-label={`${eventName} — beranda`}>
                    <img className="brand__mark" src={logo} alt="" width="40" height="46" />
                    <span className="brand__text">
                        <strong>{theme?.edition_title ?? eventName}</strong>
                        <span>SMKS Islam 1 Kota Blitar</span>
                    </span>
                </Link>

                <div className="form-card">
                    <span className="eyebrow">Akun sekolah</span>
                    <h1 className="h2" style={{ fontSize: 'clamp(1.55rem, 3vw, 1.95rem)' }}>
                        Klaim akun sekolah
                    </h1>
                    <p className="small muted" style={{ marginTop: '8px' }}>
                        Masukkan NPSN sekolah untuk mendaftarkan peserta FPM. Satu NPSN hanya boleh
                        diklaim satu akun.
                    </p>

                    {/* Step 1 — cek NPSN */}
                    <section style={{ marginTop: '26px' }}>
                        <StepHeader
                            step="1"
                            title="Cek NPSN sekolah"
                            hint={`Masukkan ${NPSN_LENGTH} digit NPSN yang terdaftar di data panitia.`}
                        />

                        <form onSubmit={cekNpsn}>
                            <div className="form-grid" style={{ alignItems: 'end' }}>
                                <Field
                                    label="NPSN"
                                    name="npsn"
                                    inputMode="numeric"
                                    maxLength={NPSN_LENGTH}
                                    placeholder="20514401"
                                    value={npsn}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, '').slice(0, NPSN_LENGTH);
                                        setNpsn(v);
                                        setResult(null);
                                        setCheckError(null);
                                    }}
                                    error={checkError}
                                    hint={`${npsn.length}/${NPSN_LENGTH} digit`}
                                />
                                <div style={{ paddingBottom: '26px' }}>
                                    <button
                                        type="submit"
                                        disabled={checking || npsn.length !== NPSN_LENGTH}
                                        className="btn btn--dark"
                                        style={{ width: '100%' }}
                                    >
                                        {checking ? 'Memeriksa…' : 'Cek NPSN'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </section>

                    {/* Hasil cek */}
                    {result?.status === 'claimed' && (
                        <div className="fpm-note" style={{ marginTop: '8px' }}>
                            <strong>Sekolah sudah diklaim</strong>
                            <span>
                                NPSN {result.school?.npsn ?? npsn} ({result.school?.school_name ?? 'sekolah ini'})
                                sudah memiliki akun. Masuk memakai akun tersebut, atau hubungi panitia bila lupa
                                kata sandi.
                            </span>
                            <div className="btn-row" style={{ marginTop: '6px' }}>
                                <Link href="/login" className="btn btn--gold btn--sm">
                                    Ke halaman masuk
                                </Link>
                                <WhatsappButton
                                    number={waNumber}
                                    message={`Halo panitia, akun sekolah NPSN ${result.school?.npsn ?? npsn} sudah diklaim tapi saya tidak bisa masuk.`}
                                />
                            </div>
                        </div>
                    )}

                    {result?.status === 'not_found' && (
                        <div className="fpm-note fpm-note--warn" style={{ marginTop: '8px' }}>
                            <strong>NPSN tidak ditemukan</strong>
                            <span>
                                NPSN {npsn} belum ada di data sekolah panitia. Hubungi panitia untuk
                                menambahkan sekolah Anda lebih dulu.
                            </span>
                            <div className="btn-row" style={{ marginTop: '6px' }}>
                                <WhatsappButton
                                    number={waNumber}
                                    message={`Halo panitia, sekolah kami (NPSN ${npsn}) belum terdaftar. Mohon dibantu.`}
                                />
                                <button type="button" onClick={resetCheck} className="btn btn--ghost btn--sm">
                                    Coba NPSN lain
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2 — formulir akun */}
                    {result?.status === 'available' && (
                        <section style={{ marginTop: '26px', borderTop: '1px solid var(--line)', paddingTop: '22px' }}>
                            <StepHeader
                                step="2"
                                title="Buat akun sekolah"
                                hint={
                                    result.school
                                        ? `${result.school.school_name} · NPSN ${result.school.npsn}`
                                        : 'Lengkapi data akun penanggung jawab.'
                                }
                            />

                            <form onSubmit={submit}>
                                <div className="form-grid">
                                    <Field
                                        label="Nama Penanggung Jawab"
                                        name="name"
                                        required
                                        value={form.data.name}
                                        error={form.errors}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="Nama lengkap"
                                        className="field--full"
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
                                    />
                                </div>

                                {form.errors?.npsn && (
                                    <div className="fpm-note fpm-note--warn" style={{ marginTop: '16px' }}>
                                        {form.errors.npsn}
                                    </div>
                                )}

                                <div className="btn-row" style={{ marginTop: '20px' }}>
                                    <button type="submit" disabled={form.processing} className="btn btn--gold">
                                        {form.processing ? 'Menyimpan…' : 'Buat akun & masuk'}
                                    </button>
                                    <button type="button" onClick={resetCheck} className="btn btn--ghost btn--sm">
                                        Ganti NPSN
                                    </button>
                                </div>

                                <p className="small muted" style={{ marginTop: '14px' }}>
                                    Dengan membuat akun, Anda bertanggung jawab atas kebenaran data peserta
                                    yang didaftarkan sekolah.
                                </p>
                            </form>
                        </section>
                    )}

                    <p className="fpm-auth__alt">
                        Sudah punya akun?{' '}
                        <Link href="/login">
                            <strong>Masuk</strong>
                        </Link>
                    </p>
                </div>

                <p className="fpm-auth__foot">
                    <Link href="/">Kembali ke beranda</Link>
                    {' · '}
                    <Link href="/lomba">Lihat cabang lomba</Link>
                </p>
            </div>
        </div>
    );
}
