import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import { pageLinkLabel } from '../../../lib/format';
import Modal from '../../../Components/Modal';
import ConfirmDialog from '../../../Components/ConfirmDialog';
import TablePagination from '../../../Components/TablePagination';

function StatCard({ label, value, accent }) {
    return (
        <div className="panel panel--pad-sm">
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
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'release'|'delete', school }

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

    const release = (school) => setConfirmAction({ type: 'release', school });

    const destroy = (school) => setConfirmAction({ type: 'delete', school });

    const runConfirm = () => {
        if (!confirmAction) return;

        const { type, school } = confirmAction;
        const options = { preserveScroll: true, onFinish: () => setConfirmAction(null) };

        if (type === 'release') {
            router.post(`/admin/sekolah/${school.id}/lepas-klaim`, {}, options);
        } else {
            router.delete(`/admin/sekolah/${school.id}`, options);
        }
    };

    const rows = schools?.data ?? [];
    const links = schools?.links ?? [];

    return (
        <AppLayout title="Master Sekolah">
            <Head title="Master Sekolah" />

            <div className="page-head-row">
                <div>
                    <h2 className="page-title">Master Data Sekolah</h2>
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
                        style={{ backgroundColor: 'var(--primary-color, #064b3d)' }}
                    >
                        Tambah sekolah
                    </button>
                </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <StatCard label="Total sekolah" value={counts.total ?? 0} />
                <StatCard label="Sudah klaim" value={counts.claimed ?? 0} accent="text-[#0a5b4a]" />
                <StatCard label="Belum klaim" value={counts.unclaimed ?? 0} accent="text-[#b45309]" />
            </div>

            <Modal
                open={panel === 'create'}
                onClose={() => setPanel(null)}
                title="Tambah sekolah"
                subtitle="NPSN 8 digit sesuai data panitia."
                footer={
                    <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPanel(null)}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="school-create-form"
                            className="btn btn--dark btn--sm"
                            disabled={createForm.processing}
                        >
                            {createForm.processing ? 'Menyimpan…' : 'Simpan sekolah'}
                        </button>
                    </>
                }
            >
                <form id="school-create-form" onSubmit={submitCreate} className="grid gap-3 sm:grid-cols-2">
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
                    <div className="sm:col-span-2">
                        <label htmlFor="address" className="mb-1 block text-xs font-medium text-slate-600">Alamat</label>
                        <input
                            id="address"
                            value={createForm.data.address}
                            onChange={(e) => createForm.setData('address', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                </form>
            </Modal>

            <Modal
                open={panel === 'import'}
                onClose={() => setPanel(null)}
                title="Impor massal sekolah"
                subtitle="Satu baris satu sekolah — NPSN;Nama Sekolah;Alamat."
                footer={
                    <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPanel(null)}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="school-import-form"
                            className="btn btn--dark btn--sm"
                            disabled={importForm.processing}
                        >
                            {importForm.processing ? 'Mengimpor…' : 'Impor'}
                        </button>
                    </>
                }
            >
                <form id="school-import-form" onSubmit={submitImport}>
                    <label htmlFor="rows" className="mb-1 block text-sm font-semibold text-slate-700">
                        Satu baris satu sekolah: <code className="rounded bg-slate-100 px-1">NPSN;Nama Sekolah;Alamat</code>
                    </label>
                    <textarea
                        id="rows"
                        rows={8}
                        value={importForm.data.rows}
                        onChange={(e) => importForm.setData('rows', e.target.value)}
                        placeholder={'20512345;SMP Negeri 1 Blitar;Jl. Kenari 1\n20512346;MTs Nurul Huda;Jl. Melati 2'}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                    />
                    {importForm.errors.rows && <p className="mt-1 text-xs text-rose-600">{importForm.errors.rows}</p>}
                </form>
            </Modal>

            <Modal
                open={panel === 'edit' && Boolean(editing)}
                onClose={() => {
                    setPanel(null);
                    setEditing(null);
                }}
                title="Edit sekolah"
                subtitle={editing?.school_name}
                footer={
                    <>
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                                setPanel(null);
                                setEditing(null);
                            }}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="school-edit-form"
                            className="btn btn--dark btn--sm"
                            disabled={editForm.processing}
                        >
                            {editForm.processing ? 'Menyimpan…' : 'Simpan perubahan'}
                        </button>
                    </>
                }
            >
                <form id="school-edit-form" onSubmit={submitEdit} className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
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
                    <div className="sm:col-span-2">
                        <label htmlFor="edit-address" className="mb-1 block text-xs font-medium text-slate-600">Alamat</label>
                        <input
                            id="edit-address"
                            value={editForm.data.address}
                            onChange={(e) => editForm.setData('address', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                </form>
            </Modal>

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

            <div className="table-card">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-2 font-semibold">Sekolah</th>
                                <th className="px-4 py-2 font-semibold">Klaim</th>
                                <th className="px-4 py-2 font-semibold">Pendaftaran aktif</th>
                                <th className="px-4 py-2 font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="data-table__body">
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

                <TablePagination paginator={schools} label="sekolah" />
            </div>
            <ConfirmDialog
                open={Boolean(confirmAction)}
                title={confirmAction?.type === 'release' ? 'Lepas klaim sekolah?' : 'Hapus sekolah?'}
                message={
                    confirmAction?.type === 'release'
                        ? `Klaim ${confirmAction.school.school_name} akan dilepas dan akun operator sekolah dihapus. Data pendaftaran tetap tersimpan.`
                        : `${confirmAction?.school?.school_name} akan dihapus permanen dari master data.`
                }
                confirmLabel={confirmAction?.type === 'release' ? 'Lepas klaim' : 'Hapus sekolah'}
                onConfirm={runConfirm}
                onClose={() => setConfirmAction(null)}
            />
        </AppLayout>
    );
}
