import { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import StatusBadge, { AiStatusBadge } from '../../../Components/StatusBadge';
import { formatDate } from '../../../lib/format';

const PAGE_LABEL = {
    '&laquo; Previous': '‹ Sebelumnya',
    'Next &raquo;': 'Berikutnya ›',
};

function Pagination({ links }) {
    if (!links || links.length <= 3) return null;

    return (
        <nav className="flex flex-wrap items-center justify-center gap-1 px-5 py-4">
            {links.map((link, i) => {
                const label = PAGE_LABEL[link.label] ?? link.label.replace(/&[^;]+;/g, '').trim();

                if (!link.url) {
                    return (
                        <span
                            key={i}
                            className="rounded-md px-3 py-1.5 text-sm text-slate-300"
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url}
                        preserveState
                        preserveScroll
                        className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                            link.active
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                        }`}
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </nav>
    );
}

export default function RegistrationIndex({ registrations, filters, competitions, counts }) {
    const rows = registrations?.data ?? [];
    const f = filters ?? {};
    const c = counts ?? {};

    const [q, setQ] = useState(f.q ?? '');
    const [status, setStatus] = useState(f.status ?? '');
    const [competitionId, setCompetitionId] = useState(f.competition_id ?? '');

    // Selaraskan state lokal bila server mengembalikan filter berbeda.
    useEffect(() => {
        setQ(f.q ?? '');
        setStatus(f.status ?? '');
        setCompetitionId(f.competition_id ?? '');
    }, [f.q, f.status, f.competition_id]);

    const apply = (overrides = {}) => {
        const params = {
            q: q || undefined,
            status: status || undefined,
            competition_id: competitionId || undefined,
            ...overrides,
        };

        router.get('/admin/pendaftaran', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitFilters = (e) => {
        e.preventDefault();
        apply();
    };

    const resetFilters = () => {
        setQ('');
        setStatus('');
        setCompetitionId('');
        router.get('/admin/pendaftaran', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const statusTabs = [
        { key: '', label: 'Semua', count: (c.pending ?? 0) + (c.approved ?? 0) + (c.rejected ?? 0) },
        { key: 'pending', label: 'Menunggu', count: c.pending ?? 0 },
        { key: 'approved', label: 'Disetujui', count: c.approved ?? 0 },
        { key: 'rejected', label: 'Ditolak', count: c.rejected ?? 0 },
    ];

    return (
        <AppLayout title="Verifikasi Pendaftaran">
            <Head title="Verifikasi Pendaftaran" />

            <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">Pendaftaran Masuk</h2>
                <p className="text-sm text-slate-500">Saring, tinjau, lalu setujui atau tolak pendaftaran.</p>
            </div>

            <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                {statusTabs.map((tab) => {
                    const active = (f.status ?? '') === tab.key;
                    return (
                        <button
                            key={tab.key || 'all'}
                            type="button"
                            onClick={() => {
                                setStatus(tab.key);
                                apply({ status: tab.key || undefined });
                            }}
                            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                                active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 text-xs ${active ? 'text-slate-500' : 'text-slate-400'}`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <form
                onSubmit={submitFilters}
                className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
            >
                <div className="lg:col-span-2">
                    <label htmlFor="filter-q" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cari
                    </label>
                    <input
                        id="filter-q"
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Nama sekolah, peserta, grup, atau NISN"
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                <div>
                    <label htmlFor="filter-status" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                    </label>
                    <select
                        id="filter-status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    >
                        <option value="">Semua status</option>
                        <option value="pending">Menunggu</option>
                        <option value="approved">Disetujui</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="filter-competition"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                        Cabang Lomba
                    </label>
                    <select
                        id="filter-competition"
                        value={competitionId}
                        onChange={(e) => setCompetitionId(e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    >
                        <option value="">Semua lomba</option>
                        {(competitions ?? []).map((comp) => (
                            <option key={comp.id} value={comp.id}>
                                {comp.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
                    <button
                        type="submit"
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                        style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                    >
                        Terapkan
                    </button>
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                    >
                        Reset
                    </button>
                </div>
            </form>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-3 font-semibold">#</th>
                                <th className="px-3 py-3 font-semibold">Nama</th>
                                <th className="px-3 py-3 font-semibold">Sekolah</th>
                                <th className="px-3 py-3 font-semibold">Lomba</th>
                                <th className="px-3 py-3 font-semibold">Peserta</th>
                                <th className="px-3 py-3 font-semibold">Status</th>
                                <th className="px-3 py-3 font-semibold">AI</th>
                                <th className="px-3 py-3 font-semibold">Tanggal</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50/70">
                                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{r.id}</td>
                                    <td className="px-3 py-3 font-medium text-slate-900">{r.display_name}</td>
                                    <td className="px-3 py-3 text-slate-600">{r.school ?? '-'}</td>
                                    <td className="px-3 py-3 text-slate-600">{r.competition ?? '-'}</td>
                                    <td className="px-3 py-3 text-slate-600">{r.participant_count}</td>
                                    <td className="px-3 py-3">
                                        <StatusBadge status={r.status} />
                                    </td>
                                    <td className="px-3 py-3">
                                        <AiStatusBadge status={r.ai_status} />
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-slate-500">{formatDate(r.created_at)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <Link
                                            href={`/admin/pendaftaran/${r.id}`}
                                            className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                                        >
                                            Tinjau
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">
                                        Tidak ada pendaftaran yang cocok dengan filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={registrations?.links ?? []} />
            </div>
        </AppLayout>
    );
}
