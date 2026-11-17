import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

function Card({ label, value, hint, href, accent }) {
    const body = (
        <>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
            {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </>
    );

    const cls = `block rounded-xl border bg-white p-5 shadow-sm ${
        accent ? 'border-l-4' : 'border-slate-200'
    } ${href ? 'transition hover:shadow-md' : ''}`;

    const style = accent ? { borderLeftColor: accent } : undefined;

    return href ? (
        <Link href={href} className={cls} style={style}>
            {body}
        </Link>
    ) : (
        <div className={cls} style={style}>
            {body}
        </div>
    );
}

export default function AdminDashboard({ stats }) {
    const s = stats ?? {};
    const perCompetition = s.per_competition ?? [];

    return (
        <AppLayout title="Dashboard Panitia">
            <Head title="Dashboard Panitia" />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Ringkasan Event</h2>
                    <p className="text-sm text-slate-500">Pantau pendaftaran dan kuota tiap cabang lomba.</p>
                </div>
                <Link
                    href="/admin/pendaftaran?status=pending"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                    style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                >
                    Verifikasi Pendaftaran Pending
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card label="Total Pendaftaran" value={s.total_registrations ?? 0} />
                <Card label="Menunggu Verifikasi" value={s.pending_count ?? 0} accent="#f59e0b" href="/admin/pendaftaran?status=pending" />
                <Card label="Disetujui" value={s.approved_count ?? 0} accent="#10b981" href="/admin/pendaftaran?status=approved" />
                <Card label="Cabang Lomba" value={perCompetition.length} />
            </div>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Per Cabang Lomba</h3>
                    <Link href="/admin/nilai" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                        Input nilai →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-2 font-semibold">Lomba</th>
                                <th className="px-3 py-2 font-semibold">Jenis</th>
                                <th className="px-3 py-2 font-semibold">Terpakai</th>
                                <th className="px-3 py-2 font-semibold">Kuota</th>
                                <th className="px-3 py-2 font-semibold">Sisa Global</th>
                                <th className="px-5 py-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {perCompetition.map((c) => {
                                const full = Number(c.remaining_global) <= 0;
                                return (
                                    <tr key={c.id}>
                                        <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                                        <td className="px-3 py-3 text-slate-600">
                                            {c.category_type === 'group' ? 'Beregu' : 'Individu'}
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">{c.approved_count}</td>
                                        <td className="px-3 py-3 text-slate-600">{c.global_quota}</td>
                                        <td className="px-3 py-3 font-semibold text-slate-800">{c.remaining_global}</td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                                    full
                                                        ? 'bg-rose-100 text-rose-700 ring-rose-200'
                                                        : 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                                                }`}
                                            >
                                                {full ? 'Penuh' : 'Terbuka'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {perCompetition.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                                        Belum ada cabang lomba pada event aktif.{' '}
                                        <Link href="/admin/event" className="font-semibold text-slate-700 underline">
                                            Tambahkan lomba
                                        </Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AppLayout>
    );
}
