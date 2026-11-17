import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';

const slugify = (value) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);

const empty = {
    name: '',
    slug: '',
    category_type: 'individual',
    gender_mode: 'mixed',
    global_quota: 20,
    school_quota: 2,
    min_group_members: 2,
    max_group_members: 5,
    is_open: true,
    sort_order: 0,
    description: '',
};

function StatCard({ label, value, accent }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-black ${accent ?? 'text-slate-900'}`}>{value}</p>
        </div>
    );
}

function CompetitionForm({ title, form, onSubmit, onCancel, lockSlug }) {
    const isGroup = form.data.category_type === 'group';

    return (
        <form onSubmit={onSubmit} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
            <div className="sm:col-span-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="text-xs font-semibold text-slate-500">
                        Tutup
                    </button>
                )}
            </div>

            <div className="sm:col-span-2">
                <label htmlFor={`${title}-name`} className="mb-1 block text-xs font-medium text-slate-600">
                    Nama cabang lomba
                </label>
                <input
                    id={`${title}-name`}
                    value={form.data.name}
                    onChange={(e) => {
                        const name = e.target.value;
                        form.setData((data) => ({
                            ...data,
                            name,
                            slug: lockSlug ? data.slug : slugify(name),
                        }));
                    }}
                    placeholder="Musabaqah Tilawatil Quran"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                {form.errors.name && <p className="mt-1 text-xs text-rose-600">{form.errors.name}</p>}
            </div>

            <div>
                <label htmlFor={`${title}-slug`} className="mb-1 block text-xs font-medium text-slate-600">
                    Slug URL
                </label>
                <input
                    id={`${title}-slug`}
                    value={form.data.slug}
                    onChange={(e) => form.setData('slug', slugify(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                />
                {form.errors.slug && <p className="mt-1 text-xs text-rose-600">{form.errors.slug}</p>}
            </div>

            <div>
                <label htmlFor={`${title}-type`} className="mb-1 block text-xs font-medium text-slate-600">
                    Jenis peserta
                </label>
                <select
                    id={`${title}-type`}
                    value={form.data.category_type}
                    onChange={(e) => form.setData('category_type', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                    <option value="individual">Individu</option>
                    <option value="group">Kelompok</option>
                </select>
            </div>

            <div>
                <label htmlFor={`${title}-gender`} className="mb-1 block text-xs font-medium text-slate-600">
                    Kategori gender
                </label>
                <select
                    id={`${title}-gender`}
                    value={form.data.gender_mode}
                    onChange={(e) => form.setData('gender_mode', e.target.value)}
                    disabled={form.data.category_type === 'group'}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                >
                    <option value="mixed">Campuran (satu peringkat)</option>
                    <option value="separate">Terpisah Putra &amp; Putri</option>
                </select>
                {form.data.category_type === 'group' && (
                    <p className="mt-1 text-[11px] text-slate-400">Hanya untuk lomba individu.</p>
                )}
                {form.errors.gender_mode && <p className="mt-1 text-xs text-rose-600">{form.errors.gender_mode}</p>}
            </div>

            <div>
                <label htmlFor={`${title}-gq`} className="mb-1 block text-xs font-medium text-slate-600">
                    Kuota total
                </label>
                <input
                    id={`${title}-gq`}
                    type="number"
                    min={1}
                    value={form.data.global_quota}
                    onChange={(e) => form.setData('global_quota', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                {form.errors.global_quota && <p className="mt-1 text-xs text-rose-600">{form.errors.global_quota}</p>}
            </div>

            <div>
                <label htmlFor={`${title}-sq`} className="mb-1 block text-xs font-medium text-slate-600">
                    Kuota per sekolah
                </label>
                <input
                    id={`${title}-sq`}
                    type="number"
                    min={1}
                    value={form.data.school_quota}
                    onChange={(e) => form.setData('school_quota', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                {form.errors.school_quota && <p className="mt-1 text-xs text-rose-600">{form.errors.school_quota}</p>}
            </div>

            {isGroup && (
                <>
                    <div>
                        <label htmlFor={`${title}-min`} className="mb-1 block text-xs font-medium text-slate-600">
                            Anggota minimal
                        </label>
                        <input
                            id={`${title}-min`}
                            type="number"
                            min={1}
                            value={form.data.min_group_members ?? ''}
                            onChange={(e) => form.setData('min_group_members', e.target.value === '' ? null : Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {form.errors.min_group_members && (
                            <p className="mt-1 text-xs text-rose-600">{form.errors.min_group_members}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor={`${title}-max`} className="mb-1 block text-xs font-medium text-slate-600">
                            Anggota maksimal
                        </label>
                        <input
                            id={`${title}-max`}
                            type="number"
                            min={1}
                            value={form.data.max_group_members ?? ''}
                            onChange={(e) => form.setData('max_group_members', e.target.value === '' ? null : Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {form.errors.max_group_members && (
                            <p className="mt-1 text-xs text-rose-600">{form.errors.max_group_members}</p>
                        )}
                    </div>
                </>
            )}

            <div>
                <label htmlFor={`${title}-sort`} className="mb-1 block text-xs font-medium text-slate-600">
                    Urutan tampil
                </label>
                <input
                    id={`${title}-sort`}
                    type="number"
                    min={0}
                    value={form.data.sort_order}
                    onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
            </div>

            <label className="flex items-center gap-2 self-end text-sm text-slate-700">
                <input
                    type="checkbox"
                    checked={form.data.is_open}
                    onChange={(e) => form.setData('is_open', e.target.checked)}
                    className="h-4 w-4"
                />
                Pendaftaran dibuka
            </label>

            <div className="sm:col-span-3">
                <label htmlFor={`${title}-desc`} className="mb-1 block text-xs font-medium text-slate-600">
                    Deskripsi / ketentuan
                </label>
                <textarea
                    id={`${title}-desc`}
                    rows={3}
                    value={form.data.description ?? ''}
                    onChange={(e) => form.setData('description', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
            </div>

            <div className="sm:col-span-3">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                >
                    {form.processing ? 'Menyimpan…' : 'Simpan cabang lomba'}
                </button>
            </div>
        </form>
    );
}

export default function CompetitionIndex({ event, competitions = [], stats = {} }) {
    const [panel, setPanel] = useState(null);
    const [editing, setEditing] = useState(null);

    const createForm = useForm({ ...empty });
    const editForm = useForm({ ...empty });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post('/admin/lomba', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setPanel(null);
            },
        });
    };

    const startEdit = (competition) => {
        setEditing(competition);
        editForm.setData({
            name: competition.name ?? '',
            slug: competition.slug ?? '',
            category_type: competition.category_type ?? 'individual',
            gender_mode: competition.gender_mode ?? 'mixed',
            global_quota: competition.global_quota ?? 1,
            school_quota: competition.school_quota ?? 1,
            min_group_members: competition.min_group_members ?? null,
            max_group_members: competition.max_group_members ?? null,
            is_open: Boolean(competition.is_open),
            sort_order: competition.sort_order ?? 0,
            description: competition.description ?? '',
        });
        editForm.clearErrors();
        setPanel('edit');
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/admin/lomba/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setPanel(null);
                setEditing(null);
            },
        });
    };

    const toggleStatus = (competition) => {
        router.post(`/admin/lomba/${competition.id}/status`, {}, { preserveScroll: true });
    };

    const destroy = (competition) => {
        if (!window.confirm(`Hapus cabang ${competition.name}? Pendaftaran yang sudah ditolak ikut terhapus.`)) return;
        router.delete(`/admin/lomba/${competition.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout title="Manajemen Lomba">
            <Head title="Manajemen Lomba" />

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Manajemen Cabang Lomba</h2>
                    <p className="text-sm text-slate-500">
                        {event?.event_name} {event?.year} — atur kuota, jenis peserta, dan buka/tutup pendaftaran.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/lomba"
                        target="_blank"
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Lihat halaman publik
                    </Link>
                    <button
                        type="button"
                        onClick={() => setPanel(panel === 'create' ? null : 'create')}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                    >
                        Tambah cabang
                    </button>
                </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-4">
                <StatCard label="Cabang lomba" value={stats.total ?? 0} />
                <StatCard label="Pendaftaran dibuka" value={stats.open ?? 0} accent="text-emerald-600" />
                <StatCard label="Total kuota" value={stats.quota ?? 0} />
                <StatCard label="Slot terpakai" value={stats.used ?? 0} accent="text-amber-600" />
            </div>

            {panel === 'create' && (
                <CompetitionForm
                    title="Cabang baru"
                    form={createForm}
                    onSubmit={submitCreate}
                    onCancel={() => setPanel(null)}
                    lockSlug={false}
                />
            )}

            {panel === 'edit' && editing && (
                <CompetitionForm
                    title={`Edit: ${editing.name}`}
                    form={editForm}
                    onSubmit={submitEdit}
                    onCancel={() => setPanel(null)}
                    lockSlug
                />
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-2 font-semibold">Cabang</th>
                                <th className="px-4 py-2 font-semibold">Jenis</th>
                                <th className="px-4 py-2 font-semibold">Kuota</th>
                                <th className="px-4 py-2 font-semibold">Status</th>
                                <th className="px-4 py-2 font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {competitions.map((competition) => {
                                const pct = competition.global_quota
                                    ? Math.min(100, Math.round((competition.used_slots / competition.global_quota) * 100))
                                    : 0;

                                return (
                                    <tr key={competition.id} className={panel === 'edit' && editing?.id === competition.id ? 'bg-slate-50' : undefined}>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-900">{competition.name}</p>
                                            <p className="font-mono text-xs text-slate-500">/lomba/{competition.slug}</p>
                                            <p className="text-xs text-slate-400">Urutan {competition.sort_order}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                                                {competition.category_type === 'group' ? 'Kelompok' : 'Individu'}
                                            </span>
                                            {competition.gender_mode === 'separate' && (
                                                <p className="mt-1">
                                                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                                                        Putra &amp; Putri terpisah
                                                    </span>
                                                </p>
                                            )}
                                            {competition.category_type === 'group' && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {competition.min_group_members ?? '-'}–{competition.max_group_members ?? '-'} anggota
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {competition.used_slots}/{competition.global_quota}
                                            </p>
                                            <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className={`h-full rounded-full ${pct >= 90 ? 'bg-rose-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Maks {competition.school_quota}/sekolah · sisa {competition.remaining_slots}
                                            </p>
                                            {competition.gender_mode === 'separate' && (
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    <span className="font-semibold text-sky-700">P {competition.used_putra ?? 0}</span>
                                                    {' · '}
                                                    <span className="font-semibold text-pink-700">W {competition.used_putri ?? 0}</span>
                                                    {' '}(kuota per kategori)
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleStatus(competition)}
                                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                                                    competition.is_open
                                                        ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                                                        : 'bg-rose-100 text-rose-700 ring-rose-200'
                                                }`}
                                            >
                                                {competition.is_open ? 'Dibuka' : 'Ditutup'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(competition)}
                                                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(competition)}
                                                    className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {competitions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                                        Belum ada cabang lomba. Tambahkan yang pertama.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
