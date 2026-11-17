import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import Modal from '../../../Components/Modal';
import ConfirmDialog from '../../../Components/ConfirmDialog';

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
    rulesText: '',
    prize_note: '',
};

function splitRules(text) {
    return String(text ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}

function StatCard({ label, value, accent }) {
    return (
        <div className="panel panel--pad-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-black ${accent ?? 'text-slate-900'}`}>{value}</p>
        </div>
    );
}

function CompetitionForm({ open, formId, title, subtitle, form, onSubmit, onCancel, lockSlug, submitLabel = 'Simpan cabang lomba' }) {
    const isGroup = form.data.category_type === 'group';

    return (
        <Modal
            open={open}
            onClose={onCancel}
            title={title}
            subtitle={subtitle}
            size="lg"
            footer={
                <>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
                        Batal
                    </button>
                    <button type="submit" form={formId} className="btn btn--dark btn--sm" disabled={form.processing}>
                        {form.processing ? 'Menyimpan…' : submitLabel}
                    </button>
                </>
            }
        >
            <form id={formId} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
                <label htmlFor={`${formId}-name`} className="mb-1 block text-xs font-medium text-slate-600">
                    Nama cabang lomba
                </label>
                <input
                    id={`${formId}-name`}
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
                <label htmlFor={`${formId}-slug`} className="mb-1 block text-xs font-medium text-slate-600">
                    Slug URL
                </label>
                <input
                    id={`${formId}-slug`}
                    value={form.data.slug}
                    onChange={(e) => form.setData('slug', slugify(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                />
                {form.errors.slug && <p className="mt-1 text-xs text-rose-600">{form.errors.slug}</p>}
            </div>

            <div>
                <label htmlFor={`${formId}-type`} className="mb-1 block text-xs font-medium text-slate-600">
                    Jenis peserta
                </label>
                <select
                    id={`${formId}-type`}
                    value={form.data.category_type}
                    onChange={(e) => form.setData('category_type', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                    <option value="individual">Individu</option>
                    <option value="group">Kelompok</option>
                </select>
            </div>

            <div>
                <label htmlFor={`${formId}-gender`} className="mb-1 block text-xs font-medium text-slate-600">
                    Kategori gender
                </label>
                <select
                    id={`${formId}-gender`}
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
                <label htmlFor={`${formId}-gq`} className="mb-1 block text-xs font-medium text-slate-600">
                    Kuota total
                </label>
                <input
                    id={`${formId}-gq`}
                    type="number"
                    min={1}
                    value={form.data.global_quota}
                    onChange={(e) => form.setData('global_quota', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                {form.errors.global_quota && <p className="mt-1 text-xs text-rose-600">{form.errors.global_quota}</p>}
            </div>

            <div>
                <label htmlFor={`${formId}-sq`} className="mb-1 block text-xs font-medium text-slate-600">
                    Kuota per sekolah
                </label>
                <input
                    id={`${formId}-sq`}
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
                        <label htmlFor={`${formId}-min`} className="mb-1 block text-xs font-medium text-slate-600">
                            Anggota minimal
                        </label>
                        <input
                            id={`${formId}-min`}
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
                        <label htmlFor={`${formId}-max`} className="mb-1 block text-xs font-medium text-slate-600">
                            Anggota maksimal
                        </label>
                        <input
                            id={`${formId}-max`}
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
                <label htmlFor={`${formId}-sort`} className="mb-1 block text-xs font-medium text-slate-600">
                    Urutan tampil
                </label>
                <input
                    id={`${formId}-sort`}
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
                <label htmlFor={`${formId}-desc`} className="mb-1 block text-xs font-medium text-slate-600">
                    Deskripsi / ketentuan
                </label>
                <textarea
                    id={`${formId}-desc`}
                    rows={2}
                    value={form.data.description ?? ''}
                    onChange={(e) => form.setData('description', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Ringkasan satu kalimat untuk kartu lomba."
                />
            </div>

            <div className="sm:col-span-3">
                <label htmlFor={`${formId}-rules`} className="mb-1 block text-xs font-medium text-slate-600">
                    Ketentuan lomba <span className="text-slate-400">(satu poin per baris)</span>
                </label>
                <textarea
                    id={`${formId}-rules`}
                    rows={4}
                    value={form.data.rulesText ?? ''}
                    onChange={(e) => form.setData('rulesText', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={'Maksimal 15 orang dan 1 grup per sekolah.\nDurasi tampil 10 menit.'}
                />
            </div>

            <div className="sm:col-span-3">
                <label htmlFor={`${formId}-prize`} className="mb-1 block text-xs font-medium text-slate-600">
                    Penghargaan
                </label>
                <input
                    id={`${formId}-prize`}
                    type="text"
                    value={form.data.prize_note ?? ''}
                    onChange={(e) => form.setData('prize_note', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Juara I–III, Harapan I–III, Best Vocal."
                />
            </div>

            </form>
        </Modal>
    );
}

export default function CompetitionIndex({ event, competitions = [], stats = {} }) {
    const [panel, setPanel] = useState(null);
    const [editing, setEditing] = useState(null);
    const [confirmCompetition, setConfirmCompetition] = useState(null);
    const [pjFor, setPjFor] = useState(null);

    const createForm = useForm({ ...empty });
    const editForm = useForm({ ...empty });
    const pjForm = useForm({ name: '', email: '', username: '', whatsapp: '', password: '' });

    const openPj = (competition) => {
        pjForm.reset();
        pjForm.clearErrors();
        setPjFor(competition);
    };

    const submitPj = (e) => {
        e.preventDefault();

        pjForm.post(`/admin/lomba/${pjFor.id}/pj-akun`, {
            preserveScroll: true,
            onSuccess: () => {
                setPjFor(null);
                pjForm.reset();
            },
        });
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.transform((data) => ({ ...data, rules: splitRules(data.rulesText) }));
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
            rulesText: (competition.rules ?? []).join('\n'),
            prize_note: competition.prize_note ?? '',
        });
        editForm.clearErrors();
        setPanel('edit');
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.transform((data) => ({ ...data, rules: splitRules(data.rulesText) }));
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

    const destroy = (competition) => setConfirmCompetition(competition);

    const runDelete = () => {
        if (!confirmCompetition) return;

        router.delete(`/admin/lomba/${confirmCompetition.id}`, {
            preserveScroll: true,
            onFinish: () => setConfirmCompetition(null),
        });
    };

    return (
        <AppLayout title="Manajemen Lomba">
            <Head title="Manajemen Lomba" />

            <div className="page-head-row">
                <div>
                    <h2 className="page-title">Manajemen Cabang Lomba</h2>
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
                        style={{ backgroundColor: 'var(--primary-color, #064b3d)' }}
                    >
                        Tambah cabang
                    </button>
                </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-4">
                <StatCard label="Cabang lomba" value={stats.total ?? 0} />
                <StatCard label="Pendaftaran dibuka" value={stats.open ?? 0} accent="text-[#0a5b4a]" />
                <StatCard label="Total kuota" value={stats.quota ?? 0} />
                <StatCard label="Slot terpakai" value={stats.used ?? 0} accent="text-[#b45309]" />
            </div>

            <CompetitionForm
                open={panel === 'create'}
                formId="competition-create"
                title="Tambah cabang lomba"
                subtitle="Kuota, jenis peserta, dan status pendaftaran."
                form={createForm}
                onSubmit={submitCreate}
                onCancel={() => setPanel(null)}
                lockSlug={false}
                submitLabel="Simpan cabang"
            />

            <CompetitionForm
                open={panel === 'edit' && Boolean(editing)}
                formId="competition-edit"
                title="Edit cabang lomba"
                subtitle={editing?.name}
                form={editForm}
                onSubmit={submitEdit}
                onCancel={() => {
                    setPanel(null);
                    setEditing(null);
                }}
                lockSlug
                submitLabel="Simpan perubahan"
            />

            <div className="panel panel--flush">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-2 font-semibold">Cabang</th>
                                <th className="px-4 py-2 font-semibold">Jenis</th>
                                <th className="px-4 py-2 font-semibold">Kuota</th>
                                <th className="px-4 py-2 font-semibold">Status</th>
                                <th className="px-4 py-2 font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="data-table__body">
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
                                                    onClick={() => openPj(competition)}
                                                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                                                >
                                                    Akun PJ
                                                    {competition.pj_count > 0 ? ` (${competition.pj_count})` : ''}
                                                </button>
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
            <Modal
                open={Boolean(pjFor)}
                onClose={() => setPjFor(null)}
                title="Akun PJ Lomba"
                subtitle={pjFor ? pjFor.name : undefined}
                footer={
                    <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPjFor(null)}>
                            Batal
                        </button>
                        <button type="submit" form="pj-account-form" className="btn btn--dark btn--sm" disabled={pjForm.processing}>
                            {pjForm.processing ? 'Menyimpan…' : 'Buat akun PJ'}
                        </button>
                    </>
                }
            >
                <form id="pj-account-form" onSubmit={submitPj} className="grid gap-3 sm:grid-cols-2">
                    <p className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-900">
                        Akun ini hanya bisa melihat peserta &amp; menilai cabang <strong>{pjFor?.name}</strong>.
                    </p>

                    <div className="sm:col-span-2">
                        <label htmlFor="pj-name" className="mb-1 block text-xs font-medium text-slate-600">Nama lengkap</label>
                        <input
                            id="pj-name"
                            value={pjForm.data.name}
                            onChange={(e) => pjForm.setData('name', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Nama PJ Lomba"
                        />
                        {pjForm.errors.name && <p className="mt-1 text-xs text-rose-600">{pjForm.errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="pj-username" className="mb-1 block text-xs font-medium text-slate-600">Username</label>
                        <input
                            id="pj-username"
                            value={pjForm.data.username}
                            onChange={(e) => pjForm.setData('username', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="pjmtq"
                        />
                        {pjForm.errors.username && <p className="mt-1 text-xs text-rose-600">{pjForm.errors.username}</p>}
                    </div>

                    <div>
                        <label htmlFor="pj-email" className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                        <input
                            id="pj-email"
                            type="email"
                            value={pjForm.data.email}
                            onChange={(e) => pjForm.setData('email', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="pj@contoh.sch.id"
                        />
                        {pjForm.errors.email && <p className="mt-1 text-xs text-rose-600">{pjForm.errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="pj-wa" className="mb-1 block text-xs font-medium text-slate-600">WhatsApp</label>
                        <input
                            id="pj-wa"
                            value={pjForm.data.whatsapp}
                            onChange={(e) => pjForm.setData('whatsapp', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="08xxxxxxxxxx"
                        />
                    </div>

                    <div>
                        <label htmlFor="pj-password" className="mb-1 block text-xs font-medium text-slate-600">Sandi awal</label>
                        <input
                            id="pj-password"
                            type="text"
                            value={pjForm.data.password}
                            onChange={(e) => pjForm.setData('password', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Minimal 8 karakter"
                        />
                        {pjForm.errors.password && <p className="mt-1 text-xs text-rose-600">{pjForm.errors.password}</p>}
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={Boolean(confirmCompetition)}
                title="Hapus cabang lomba?"
                message={`Cabang ${confirmCompetition?.name} akan dihapus. Pendaftaran dan nilai yang terkait ikut terhapus permanen.`}
                confirmLabel="Hapus cabang"
                onConfirm={runDelete}
                onClose={() => setConfirmCompetition(null)}
            />
        </AppLayout>
    );
}
