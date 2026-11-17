import { Link, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import GuestLayout from '../../Layouts/GuestLayout';

const categoryLabel = {
    individual: 'Individu',
    group: 'Kelompok',
};

function status(c) {
    if (!c.is_open) return { label: 'Ditutup', tone: 'bg-slate-100 text-slate-600' };
    if (c.is_full) return { label: 'Kuota penuh', tone: 'bg-rose-50 text-rose-700' };
    return { label: 'Buka', tone: 'bg-emerald-50 text-emerald-700' };
}

function QuotaBar({ used, total }) {
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: 'var(--primary-color, #0f766e)' }}
            />
        </div>
    );
}

export default function LombaShow({ event_info, competition }) {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;
    const s = status(competition);

    return (
        <GuestLayout title={competition.name}>
            <Head title={competition.name} />

            <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/" className="hover:text-slate-900">
                        Beranda
                    </Link>
                    <span>/</span>
                    <Link href="/lomba" className="hover:text-slate-900">
                        Cabang Lomba
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-900">{competition.name}</span>
                </div>

                {/* Header */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{competition.name}</h1>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {categoryLabel[competition.category_type] ?? competition.category_type}
                                {competition.gender_mode === 'separate' && ' · Kategori Putra & Putri'}
                            </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${s.tone}`}>
                            {s.label}
                        </span>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-slate-700">
                        {competition.description ?? 'Panitia belum menambahkan deskripsi untuk cabang ini.'}
                    </p>

                    <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kuota Global</dt>
                            <dd className="mt-1 text-2xl font-black text-slate-900">{competition.global_quota}</dd>
                            {competition.gender_mode === 'separate' && (
                                <p className="text-[11px] text-slate-400">per kategori Putra/Putri</p>
                            )}
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Terpakai</dt>
                            <dd className="mt-1 text-2xl font-black text-slate-900">{competition.used_quota}</dd>
                            {competition.gender_mode === 'separate' && (
                                <p className="text-[11px] text-slate-400">
                                    Putra {competition.used_putra ?? 0} · Putri {competition.used_putri ?? 0}
                                </p>
                            )}
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tersisa</dt>
                            <dd className="mt-1 text-2xl font-black text-emerald-600">
                                {competition.remaining_quota}
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-4">
                        <QuotaBar used={competition.used_quota} total={competition.global_quota} />
                    </div>

                    {competition.category_type === 'group' && competition.min_group_members && (
                        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Lomba Kelompok</p>
                            <p className="mt-1 text-sm text-blue-900">
                                Satu tim terdiri dari <strong>{competition.min_group_members}</strong> hingga{' '}
                                <strong>{competition.max_group_members}</strong> siswa.
                            </p>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href={user ? '/daftar' : '/klaim'}
                        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                        style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                    >
                        {user ? 'Daftar Lomba Ini' : 'Klaim Akun Sekolah'}
                    </Link>
                    <Link
                        href="/lomba"
                        className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-100"
                    >
                        Kembali ke Daftar Lomba
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
