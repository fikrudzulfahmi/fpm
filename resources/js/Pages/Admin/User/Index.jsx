import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import Modal from '../../../Components/Modal';
import DataTable from '../../../Components/DataTable';
import ConfirmDialog from '../../../Components/ConfirmDialog';

const emptyForm = {
    name: '',
    email: '',
    username: '',
    whatsapp: '',
    password: '',
    password_confirmation: '',
    access_level: 'pj',
    competition_id: '',
};

function Badge({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-600 ring-slate-200',
        emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
        amber: 'bg-amber-100 text-amber-700 ring-amber-200',
        sky: 'bg-sky-100 text-sky-700 ring-sky-200',
    };

    return (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tones[tone]}`}>
            {children}
        </span>
    );
}

function AccountForm({ open, formId, title, subtitle, form, onSubmit, onCancel, withPassword, competitions = [], submitLabel = 'Simpan' }) {
    return (
        <Modal
            open={open}
            onClose={onCancel}
            title={title}
            subtitle={subtitle}
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
            <form id={formId} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
                {[
                    ['name', 'Nama lengkap', 'text'],
                    ['email', 'Email', 'email'],
                    ['username', 'Username', 'text'],
                    ['whatsapp', 'No. WhatsApp', 'tel'],
                ].map(([key, label, type]) => (
                    <div key={key}>
                        <label htmlFor={`${formId}-${key}`} className="mb-1 block text-xs font-medium text-slate-600">
                            {label}
                        </label>
                        <input
                            id={`${formId}-${key}`}
                            type={type}
                            value={form.data[key]}
                            onChange={(e) => form.setData(key, e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {form.errors[key] && <p className="mt-1 text-xs text-rose-600">{form.errors[key]}</p>}
                    </div>
                ))}

                {withPassword && (
                    <>
                        <div>
                            <label htmlFor={`${formId}-password`} className="mb-1 block text-xs font-medium text-slate-600">
                                Password
                            </label>
                            <input
                                id={`${formId}-password`}
                                type="password"
                                autoComplete="new-password"
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            {form.errors.password && <p className="mt-1 text-xs text-rose-600">{form.errors.password}</p>}
                        </div>
                        <div>
                            <label htmlFor={`${formId}-password2`} className="mb-1 block text-xs font-medium text-slate-600">
                                Ulangi password
                            </label>
                            <input
                                id={`${formId}-password2`}
                                type="password"
                                autoComplete="new-password"
                                value={form.data.password_confirmation ?? ''}
                                onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                    </>
                )}

                <div className="sm:col-span-2">
                    <label htmlFor={`${formId}-access`} className="mb-1 block text-xs font-medium text-slate-600">
                        Hak akses
                    </label>
                    <select
                        id={`${formId}-access`}
                        value={form.data.access_level}
                        onChange={(e) => form.setData('access_level', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="pj">PJ Lomba — peserta &amp; nilai satu cabang</option>
                        <option value="full">Panitia penuh — semua menu</option>
                    </select>
                    {form.errors.access_level && <p className="mt-1 text-xs text-rose-600">{form.errors.access_level}</p>}
                </div>

                {form.data.access_level === 'pj' && (
                    <div className="sm:col-span-2">
                        <label htmlFor={`${formId}-competition`} className="mb-1 block text-xs font-medium text-slate-600">
                            Cabang lomba yang ditangani
                        </label>
                        <select
                            id={`${formId}-competition`}
                            value={form.data.competition_id ?? ''}
                            onChange={(e) => form.setData('competition_id', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="">— Pilih cabang lomba —</option>
                            {competitions.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {form.errors.competition_id && (
                            <p className="mt-1 text-xs text-rose-600">{form.errors.competition_id}</p>
                        )}
                        <p className="mt-1 text-[11.5px] text-slate-500">
                            PJ hanya bisa melihat pendaftar dan menginput nilai cabang ini.
                        </p>
                    </div>
                )}
            </form>
        </Modal>
    );
}

export default function UserIndex({ users = [], competitions = [], filters = {} }) {
    const [panel, setPanel] = useState(null);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState(filters.q ?? '');
    const rows = users?.data ?? users ?? [];
    const [confirmUser, setConfirmUser] = useState(null);
    const [passwordFor, setPasswordFor] = useState(null);

    const createForm = useForm({ ...emptyForm });
    const editForm = useForm({ name: '', email: '', username: '', whatsapp: '', access_level: 'pj', competition_id: '', is_active: true });
    const passwordForm = useForm({ password: '', password_confirmation: '' });

    const submitCreate = (event) => {
        event.preventDefault();
        createForm.post('/admin/akun', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setPanel(null);
            },
        });
    };

    const startEdit = (user) => {
        setEditing(user);
        editForm.setData({
            name: user.name ?? '',
            email: user.email ?? '',
            username: user.username ?? '',
            whatsapp: user.whatsapp ?? '',
            access_level: user.access_level ?? 'full',
            competition_id: user.competition_id ?? '',
            is_active: Boolean(user.is_active),
        });
        editForm.clearErrors();
        passwordForm.reset();
        setPanel('edit');
    };

    const submitEdit = (event) => {
        event.preventDefault();
        editForm.put(`/admin/akun/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setPanel(null);
                setEditing(null);
            },
        });
    };

    const submitPassword = (event) => {
        event.preventDefault();
        if (!passwordFor) return;

        passwordForm.post(`/admin/akun/${passwordFor.id}/reset-password`, {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                setPasswordFor(null);
            },
        });
    };

    const destroy = (user) => setConfirmUser(user);

    const runDelete = () => {
        if (!confirmUser) return;

        router.delete(`/admin/akun/${confirmUser.id}`, {
            preserveScroll: true,
            onFinish: () => setConfirmUser(null),
        });
    };

    return (
        <AppLayout title="Akun Panitia & PJ Lomba">
            <Head title="Akun Panitia & PJ Lomba" />

            <div className="page-head-row">
                <div>
                    <h2 className="page-title">Akun Panitia &amp; PJ Lomba</h2>
                    <p className="text-sm text-slate-500">
                        PJ Lomba hanya melihat peserta & menilai cabang lombanya; panitia penuh mengelola seluruh data.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setPanel(panel === 'create' ? null : 'create')}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: 'var(--primary-color, #064b3d)' }}
                >
                    Tambah akun
                </button>
            </div>

            <AccountForm
                open={panel === 'create'}
                formId="account-create"
                title="Tambah akun"
                subtitle="Akun baru untuk panitia penuh atau PJ Lomba."
                form={createForm}
                onSubmit={submitCreate}
                onCancel={() => setPanel(null)}
                competitions={competitions}
                withPassword
                submitLabel="Simpan akun"
            />

            <AccountForm
                open={panel === 'edit' && Boolean(editing)}
                formId="account-edit"
                title="Edit akun"
                subtitle={editing?.username}
                form={editForm}
                onSubmit={submitEdit}
                competitions={competitions}
                onCancel={() => {
                    setPanel(null);
                    setEditing(null);
                }}
                submitLabel="Simpan perubahan"
            />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    router.get('/admin/akun', { q: search }, { preserveState: true, replace: true });
                }}
                className="mb-4 flex flex-wrap items-center gap-2"
            >
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama, username, email…"
                    className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                    Cari
                </button>
            </form>

            <DataTable
                title="Daftar akun"
                subtitle="Panitia penuh mengelola semua menu; PJ Lomba hanya cabangnya."
                columns={[
                    {
                        key: 'account',
                        label: 'Akun',
                        render: (user) => (
                            <>
                                <p className="font-semibold text-slate-900">
                                    {user.name}
                                    {user.is_self && <span className="ml-2 text-xs font-normal text-slate-400">(Anda)</span>}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {user.username} · {user.email}
                                </p>
                            </>
                        ),
                    },
                    {
                        key: 'access',
                        label: 'Akses',
                        render: (user) => (
                            <>
                                <Badge tone={user.access_level === 'full' ? 'sky' : 'amber'}>
                                    {user.access_level === 'full' ? 'Panitia penuh' : 'PJ Lomba'}
                                </Badge>
                                {user.access_level === 'pj' && (
                                    <p className="mt-1 text-[11.5px] text-slate-500">
                                        {user.competition_name ?? 'Belum ada cabang'}
                                    </p>
                                )}
                            </>
                        ),
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        render: (user) => (
                            <Badge tone={user.is_active ? 'emerald' : 'slate'}>
                                {user.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                        ),
                    },
                    {
                        key: 'actions',
                        label: 'Aksi',
                        align: 'right',
                        render: (user) => (
                            <div className="flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => startEdit(user)}
                                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        passwordForm.reset();
                                        passwordForm.clearErrors();
                                        setPasswordFor(user);
                                    }}
                                    className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                                >
                                    Reset sandi
                                </button>
                                {!user.is_self && (
                                    <button
                                        type="button"
                                        onClick={() => destroy(user)}
                                        className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        ),
                    },
                ]}
                rows={rows}
                rowKey={(user) => user.id}
                paginator={users?.links ? users : null}
                paginationLabel="akun"
                empty="Belum ada akun panitia/PJ Lomba."
            />

            <Modal
                open={Boolean(passwordFor)}
                onClose={() => setPasswordFor(null)}
                title="Reset password"
                subtitle={passwordFor ? `Akun ${passwordFor.username}` : undefined}
                footer={
                    <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPasswordFor(null)}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="account-password-form"
                            className="btn btn--dark btn--sm"
                            disabled={passwordForm.processing}
                        >
                            {passwordForm.processing ? 'Menyimpan…' : 'Reset password'}
                        </button>
                    </>
                }
            >
                <form id="account-password-form" onSubmit={submitPassword} className="grid gap-3">
                    <div>
                        <label htmlFor="new-password" className="mb-1 block text-xs font-medium text-slate-600">
                            Password baru
                        </label>
                        <input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            value={passwordForm.data.password}
                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {passwordForm.errors.password && <p className="mt-1 text-xs text-rose-600">{passwordForm.errors.password}</p>}
                    </div>
                    <div>
                        <label htmlFor="new-password2" className="mb-1 block text-xs font-medium text-slate-600">
                            Ulangi password
                        </label>
                        <input
                            id="new-password2"
                            type="password"
                            autoComplete="new-password"
                            value={passwordForm.data.password_confirmation}
                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={Boolean(confirmUser)}
                title="Hapus akun?"
                message={`Akun ${confirmUser?.username} akan dihapus dan tidak bisa dipakai lagi.`}
                confirmLabel="Hapus akun"
                onConfirm={runDelete}
                onClose={() => setConfirmUser(null)}
            />
        </AppLayout>
    );
}
