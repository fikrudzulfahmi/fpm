import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';

function StatCard({ label, value, accent }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-black ${accent ?? 'text-slate-900'}`}>{value}</p>
        </div>
    );
}

function SchoolRow({ school, onEdit, onRelease, onDelete }) {
    return (
        <tr className="align-top">
            <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{school.school_name}</p>
                <p className="text-xs text-slate-500">NPSN {school.npsn}</p>
                {school.address && <p className="mt-1 text-xs text-slate-500">{school.address}</p>}
            </td>
            <td className="px-4 py-3">
                {school.is_claimed ? (
                    <div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            Terklaim
                        </span>
                        {school.account && (
                            <p className="mt-1 text-xs text-slate-500">
                                {school.account.username} · {school.account.whatsapp || 'tanpa WA'}
                            </p>
                        )}
                    </div>
                ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                        Belum klaim
                    </span>
                )}
            </td>
            <td className="px-4 py-3 text-sm text-slate-600">{school.active_registrations}</td>
            <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(school)}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Edit
                    </button>
                    {school.is_claimed && (
                        <button
                            type="button"
                            onClick={() => onRelease(school)}
                            className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
                        >
                            Lepas klaim
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onDelete(school)}
                        className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100"
                    >
                        Hapus
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function SchoolIndex({ schools, filters = {}, counts = {} }) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [panel, setPanel] = useState(null); // 'create' | 'import' | 'edit'
    const [editing, setEditing] = useState(null);

    const createForm = useForm({ npsn: '', school_name: '', address: '' });
    const editForm = useForm({ npsn: '', school_name: '', address: '' });
    const importForm = useForm({ rows: '' });

    const applyFilter = (event) => {
        event?.preventDefault();
        router.get('/admin/sekolah', { q: search, status }, { preserveState: true, replace: true });
    };

    const submitCreate = (event) => {
        event.preventDefault();
        createForm.post('/admin/sekolah', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setPanel(null);
            },
        });
    };

    const startEdit = (school) => {
        setEditing(school);
        editForm.setData({
            npsn: school.npsn ?? '',
            school_name: school.school_name ?? '',
            address: school.address ?? '',
        });
        editForm.clearErrors();
        setPanel('edit');
    };

    const submitEdit = (event) => {
        event.preventDefault();
        editForm.put(`/admin/sekolah/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setPanel(null);
                setEditing(null);
            },
        });
    };

    const submitImport = (event) => {
        event.preventDefault();
        importForm.post('/admin/sekolah/impor', {
            preserveScroll: true,
            onSuccess: () => {
                importForm.reset();
                setPanel(null);
            },
        });
    };

    const release = (school) => {
        if (!window.confirm(`Lepas klaim ${school.school_name}? Akun operator sekolah akan dihapus.`)) return;
        router.post(`/admin/sekolah/${school.id}/lepas-klaim`, {}, { preserveScroll: true });
    };

    const destroy = (school) => {
        if (!window.confirm(`Hapus ${school.school_name}?`)) return;
        router.delete(`/admin/sekolah/${school.id}`, { preserveScroll: true });
    };

    const rows = schools?.data ?? [];
    const links = schools?.links ?? [];

    return (
        <AppLayout title="Master Sekolah">
            <Head title="Master Sekolah" />

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Master Data Sekolah</h2>
                    <p className="text-sm text-slate-500">
                        Referensi NPSN untuk klaim akun operator sekolah.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setPanel(panel === 'import' ? null : 'import')}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Impor massal
                    </button>
                    <button
                        type="button"
                        onClick={() => setPanel(panel === 'create' ? null : 'create')}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                    >
                        Tambah sekolah
                    </button>
                </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <StatCard label="Total sekolah" value={counts.total ?? 0} />
                <StatCard label="Sudah klaim" value={counts.claimed ?? 0} accent="text-emerald-600" />
                <StatCard label="Belum klaim" value={counts.unclaimed ?? 0} accent="text-amber-600" />
            </div>

            {panel === 'create' && (
                <form onSubmit={submitCreate} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
                    <div>
                        <label htmlFor="npsn" className="mb-1 block text-xs font-medium text-slate-600">NPSN (8 digit)</label>
                        <input
                            id="npsn"
                            value={createForm.data.npsn}
                            onChange={(e) => createForm.setData('npsn', e.target.value.replace(/\D/g, '').slice(0, 8))}
                            inputMode="numeric"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {createForm.errors.npsn && <p className="mt-1 text-xs text-rose-600">{createForm.errors.npsn}</p>}
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="school_name" className="mb-1 block text-xs font-medium text-slate-600">Nama sekolah</label>
                        <input
                            id="school_name"
                            value={createForm.data.school_name}
                            onChange={(e) => createForm.setData('school_name', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {createForm.errors.school_name && <p className="mt-1 text-xs text-rose-600">{createForm.errors.school_name}</p>}
                    </div>
                    <div>
                        <label htmlFor="address" className="mb-1 block text-xs font-medium text-slate-600">Alamat</label>
                        <input
                            id="address"
                            value={createForm.data.address}
                            onChange={(e) => createForm.setData('address', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="sm:col-span-4">
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                        >
                            Simpan sekolah
                        </button>
                    </div>
                </form>
            )}

            {panel === 'import' && (
                <form onSubmit={submitImport} className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <label htmlFor="rows" className="mb-1 block text-sm font-semibold text-slate-700">
                        Satu baris satu sekolah: <code className="rounded bg-slate-100 px-1">NPSN;Nama Sekolah;Alamat</code>
                    </label>
                    <textarea
                        id="rows"
                        rows={6}
                        value={importForm.data.rows}
                        onChange={(e) => importForm.setData('rows', e.target.value)}
                        placeholder={'20512345;SMP Negeri 1 Blitar;Jl. Kenari 1\n20512346;MTs Nurul Huda;Jl. Melati 2'}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                    />
                    {importForm.errors.rows && <p className="mt-1 text-xs text-rose-600">{importForm.errors.rows}</p>}
                    <button
                        type="submit"
                        disabled={importForm.processing}
                        className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                    >
                        Impor
                    </button>
                </form>
            )}

            {panel === 'edit' && editing && (
                <form onSubmit={submitEdit} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
                    <div className="sm:col-span-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">Edit: {editing.school_name}</p>
                        <button type="button" onClick={() => setPanel(null)} className="text-xs font-semibold text-slate-500">Tutup</button>
                    </div>
                    <div>
                        <label htmlFor="edit-npsn" className="mb-1 block text-xs font-medium text-slate-600">NPSN</label>
                        <input
                            id="edit-npsn"
                            value={editForm.data.npsn}
                            onChange={(e) => editForm.setData('npsn', e.target.value.replace(/\D/g, '').slice(0, 8))}
                            inputMode="numeric"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {editForm.errors.npsn && <p className="mt-1 text-xs text-rose-600">{editForm.errors.npsn}</p>}
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="edit-name" className="mb-1 block text-xs font-medium text-slate-600">Nama sekolah</label>
                        <input
                            id="edit-name"
                            value={editForm.data.school_name}
                            onChange={(e) => editForm.setData('school_name', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {editForm.errors.school_name && <p className="mt-1 text-xs text-rose-600">{editForm.errors.school_name}</p>}
                    </div>
                    <div>
                        <label htmlFor="edit-address" className="mb-1 block text-xs font-medium text-slate-600">Alamat</label>
                        <input
                            id="edit-address"
                            value={editForm.data.address}
                            onChange={(e) => editForm.setData('address', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="sm:col-span-4">
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                        >
                            Simpan perubahan
                        </button>
                    </div>
                </form>
            )}

            <form onSubmit={applyFilter} className="mb-4 flex flex-wrap items-center gap-2">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama, NPSN, alamat…"
                    className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                    <option value="">Semua status</option>
                    <option value="claimed">Sudah klaim</option>
                    <option value="unclaimed">Belum klaim</option>
                </select>
                <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                    Filter
                </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-2 font-semibold">Sekolah</th>
                                <th className="px-4 py-2 font-semibold">Klaim</th>
                                <th className="px-4 py-2 font-semibold">Pendaftaran aktif</th>
                                <th className="px-4 py-2 font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((school) => (
                                <SchoolRow
                                    key={school.id}
                                    school={school}
                                    onEdit={startEdit}
                                    onRelease={release}
                                    onDelete={destroy}
                                />
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                                        Tidak ada sekolah yang cocok.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {links.length > 3 && (
                    <div className="flex flex-wrap gap-1 border-t border-slate-100 px-4 py-3">
                        {links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                                    link.active
                                        ? 'bg-slate-900 text-white'
                                        : link.url
                                          ? 'text-slate-600 hover:bg-slate-100'
                                          : 'cursor-not-allowed text-slate-300'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
