import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

function Card({ label, value, hint, href, accent }) {
    const body = (
        <>
            <span className="stat-card__label">{label}</span>
            <span className="stat-card__value">{value}</span>
            {hint && <span className="stat-card__hint">{hint}</span>}
        </>
    );

    const cls = 'stat-card';
    const style = accent ? { borderInlineStartWidth: '4px', borderInlineStartColor: accent } : undefined;

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

            <div className="page-head-row">
                <div>
                    <h2 className="page-title">Ringkasan Event</h2>
                    <p className="text-sm text-slate-500">Pantau pendaftaran dan kuota tiap cabang lomba.</p>
                </div>
                <Link
                    href="/admin/pendaftaran?status=pending"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                    style={{ backgroundColor: 'var(--primary-color, #064b3d)' }}
                >
                    Verifikasi Pendaftaran Pending
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card label="Total Pendaftaran" value={s.total_registrations ?? 0} />
                <Card label="Menunggu Verifikasi" value={s.pending_count ?? 0} accent="#b45309" href="/admin/pendaftaran?status=pending" />
                <Card label="Disetujui" value={s.approved_count ?? 0} accent="#0a5b4a" href="/admin/pendaftaran?status=approved" />
                <Card label="Cabang Lomba" value={perCompetition.length} />
            </div>

            <section className="panel panel--flush mt-6">
                <div className="panel__head">
                    <h3 className="panel__title">Per Cabang Lomba</h3>
                    <Link href="/admin/nilai" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                        Input nilai →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr className="data-table__head">
                                <th className="px-5 py-2 font-semibold">Lomba</th>
                                <th className="px-3 py-2 font-semibold">Jenis</th>
                                <th className="px-3 py-2 font-semibold">Terpakai</th>
                                <th className="px-3 py-2 font-semibold">Kuota</th>
                                <th className="px-3 py-2 font-semibold">Sisa Global</th>
                                <th className="px-5 py-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="data-table__body">
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
