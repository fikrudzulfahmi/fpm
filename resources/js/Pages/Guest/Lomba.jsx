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

export default function Lomba({ event_info, competitions = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;

    return (
        <GuestLayout title="Cabang Lomba">
            <Head title="Cabang Lomba" />

            <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {event_info?.event_name ?? 'Festival Pelajar Muslim'}
                </p>
                <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Cabang Lomba</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Daftar cabang pada {event_info?.tagline ?? 'edisi ini'} beserta kuota yang masih tersedia. Kuota
                    tersisa = kuota global dikurangi pendaftaran yang menunggu verifikasi dan disetujui.
                </p>

                {competitions.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                        Panitia belum mempublikasikan cabang lomba.
                    </div>
                ) : (
                    <>
                        {/* Tabel desktop */}
                        <div className="mt-8 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Nama Cabang</th>
                                        <th className="px-4 py-3 font-semibold">Kategori</th>
                                        <th className="px-4 py-3 font-semibold">Kuota Tersisa</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {competitions.map((c) => {
                                        const s = status(c);

                                        return (
                                            <tr key={c.id} className="align-top hover:bg-slate-50/70">
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/lomba/${c.slug}`}
                                                        className="font-semibold text-slate-900 hover:underline"
                                                    >
                                                        {c.name}
                                                    </Link>
                                                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                                        {c.description ?? '-'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {categoryLabel[c.category_type] ?? c.category_type}
                                                    {c.gender_mode === 'separate' && (
                                                        <span className="mt-1 block text-xs font-semibold text-indigo-600">
                                                            Putra &amp; Putri
                                                        </span>
                                                    )}
                                                    {c.category_type === 'group' && c.min_group_members && (
                                                        <span className="block text-xs text-slate-400">
                                                            {c.min_group_members}–{c.max_group_members} siswa/tim
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-bold text-slate-900">{c.remaining_quota}</span>
                                                    <span className="text-slate-400"> / {c.global_quota}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${s.tone}`}
                                                    >
                                                        {s.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/lomba/${c.slug}`}
                                                        className="text-xs font-semibold underline decoration-2 underline-offset-4"
                                                        style={{ color: 'var(--primary-color, #0f766e)' }}
                                                    >
                                                        Detail
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Kartu mobile */}
                        <div className="mt-6 space-y-3 md:hidden">
                            {competitions.map((c) => {
                                const s = status(c);

                                return (
                                    <Link
                                        key={c.id}
                                        href={`/lomba/${c.slug}`}
                                        className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-bold text-slate-900">{c.name}</p>
                                            <span
                                                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${s.tone}`}
                                            >
                                                {s.label}
                                            </span>
                                        </div>
                                        <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                            <div>
                                                <dt className="text-slate-400">Kategori</dt>
                                                <dd className="font-semibold text-slate-700">
                                                    {categoryLabel[c.category_type] ?? c.category_type}
                                                    {c.gender_mode === 'separate' && ' · Putra/Putri'}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-slate-400">Kuota tersisa</dt>
                                                <dd className="font-semibold text-slate-700">
                                                    {c.remaining_quota} / {c.global_quota}
                                                </dd>
                                            </div>
                                        </dl>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="mt-8 flex flex-wrap gap-2">
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
        </GuestLayout>
    );
}
