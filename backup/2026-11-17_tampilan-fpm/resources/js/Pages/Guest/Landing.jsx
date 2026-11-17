import { Head, Link, usePage } from '@inertiajs/react';
import GuestLayout from '../../Layouts/GuestLayout';

const categoryLabel = {
    individual: 'Individu',
    group: 'Kelompok',
};

function QuotaBar({ used, total }) {
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: 'var(--primary-color, #0f766e)' }}
            />
        </div>
    );
}

export default function Landing({ event_info, competitions = [], totals = {} }) {
    const { theme, auth } = usePage().props;
    const user = auth?.user ?? null;
    const eventName = event_info?.event_name ?? 'Festival Pelajar Muslim';
    const tagline = event_info?.tagline ?? eventName;

    return (
        <GuestLayout title="Beranda">
            <Head title="Beranda" />

            {/* Hero */}
            <section
                className="relative overflow-hidden text-white"
                style={{
                    backgroundImage:
                        'linear-gradient(135deg, var(--primary-color, #0f766e) 0%, rgba(15,23,42,0.92) 100%)',
                }}
            >
                <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                    <p
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-900"
                        style={{ backgroundColor: 'var(--secondary-color, #c9a45c)' }}
                    >
                        {event_info?.year ? `Edisi ${event_info.year}` : 'Segera Hadir'}
                    </p>

                    <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{eventName}</h1>
                    <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">{tagline}</p>

                    <div className="mt-6 flex flex-wrap gap-3 text-sm">
                        <span className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold ring-1 ring-inset ring-white/20">
                            {totals.competitions ?? competitions.length} cabang lomba
                        </span>
                        <span className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold ring-1 ring-inset ring-white/20">
                            {totals.open_competitions ?? 0} sedang dibuka
                        </span>
                        <span className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold ring-1 ring-inset ring-white/20">
                            {totals.remaining_quota ?? 0} kuota tersisa
                        </span>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        {user ? (
                            <Link
                                href="/daftar"
                                className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:opacity-95"
                                style={{ backgroundColor: 'var(--secondary-color, #c9a45c)' }}
                            >
                                Daftar Lomba Sekarang
                            </Link>
                        ) : (
                            <Link
                                href="/klaim"
                                className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:opacity-95"
                                style={{ backgroundColor: 'var(--secondary-color, #c9a45c)' }}
                            >
                                Klaim Akun Sekolah
                            </Link>
                        )}
                        <Link
                            href={user ? '/dashboard' : '/login'}
                            className="inline-flex items-center justify-center rounded-lg bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-inset ring-white/25 transition hover:bg-white/20"
                        >
                            {user ? 'Ke Dashboard' : 'Masuk ke Akun'}
                        </Link>
                        <Link
                            href="/lomba"
                            className="inline-flex items-center justify-center rounded-lg bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-inset ring-white/25 transition hover:bg-white/20"
                        >
                            Lihat Semua Cabang
                        </Link>
                    </div>
                </div>
            </section>

            {/* Ringkasan cabang */}
            <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Cabang Lomba</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {competitions.length > 0
                                ? `${competitions.length} cabang diperlombakan pada edisi ini.`
                                : 'Panitia belum menetapkan cabang lomba.'}
                        </p>
                    </div>
                    <Link
                        href="/lomba"
                        className="text-sm font-semibold underline decoration-2 underline-offset-4"
                        style={{ color: 'var(--primary-color, #0f766e)' }}
                    >
                        Lihat tabel lengkap
                    </Link>
                </div>

                {competitions.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                        Belum ada cabang lomba yang dipublikasikan.
                    </div>
                ) : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {competitions.map((c) => {
                            const closed = !c.is_open || c.is_full;

                            return (
                                <Link
                                    key={c.id}
                                    href={`/lomba/${c.slug}`}
                                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-sm font-bold text-slate-900 group-hover:underline">
                                            {c.name}
                                        </h3>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                                closed ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                            }`}
                                        >
                                            {closed ? (c.is_full ? 'Kuota penuh' : 'Ditutup') : 'Buka'}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        {categoryLabel[c.category_type] ?? c.category_type}
                                    </p>

                                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                                        {c.description ?? 'Belum ada deskripsi.'}
                                    </p>

                                    <div className="mt-auto pt-4">
                                        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
                                            <span>Kuota tersisa</span>
                                            <span>
                                                {c.remaining_quota} / {c.global_quota}
                                            </span>
                                        </div>
                                        <QuotaBar used={c.used_quota} total={c.global_quota} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* CTA bawah */}
            <section className="border-t border-slate-200 bg-slate-50">
                <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Siap mendaftarkan peserta?</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Sekolah mengklaim akun dengan NPSN, lalu mendaftarkan peserta per cabang lomba.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={user ? '/daftar' : '/klaim'}
                            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                            style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                        >
                            {user ? 'Daftar Lomba' : 'Klaim Akun Sekolah'}
                        </Link>
                        <Link
                            href={user ? '/dashboard' : '/login'}
                            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-100"
                        >
                            {user ? 'Dashboard' : 'Masuk'}
                        </Link>
                    </div>
                </div>
            </section>
        </GuestLayout>
    );
}
