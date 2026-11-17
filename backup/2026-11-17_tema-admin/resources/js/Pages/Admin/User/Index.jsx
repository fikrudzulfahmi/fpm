import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';

const emptyForm = {
    name: '',
    email: '',
    username: '',
    whatsapp: '',
    password: '',
    password_confirmation: '',
    access_level: 'juri',
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

function AccountForm({ title, form, onSubmit, onCancel, withPassword }) {
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

            {[
                ['name', 'Nama lengkap', 'text'],
                ['email', 'Email', 'email'],
                ['username', 'Username', 'text'],
                ['whatsapp', 'No. WhatsApp', 'tel'],
            ].map(([key, label, type]) => (
                <div key={key}>
                    <label htmlFor={`${title}-${key}`} className="mb-1 block text-xs font-medium text-slate-600">
                        {label}
                    </label>
                    <input
                        id={`${title}-${key}`}
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
                        <label htmlFor={`${title}-password`} className="mb-1 block text-xs font-medium text-slate-600">
                            Password
                        </label>
                        <input
                            id={`${title}-password`}
                            type="password"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {form.errors.password && <p className="mt-1 text-xs text-rose-600">{form.errors.password}</p>}
                    </div>
                    <div>
                        <label htmlFor={`${title}-password2`} className="mb-1 block text-xs font-medium text-slate-600">
                            Ulangi password
                        </label>
                        <input
                            id={`${title}-password2`}
                            type="password"
                            value={form.data.password_confirmation ?? ''}
                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                </>
            )}

            <div>
                <label htmlFor={`${title}-access`} className="mb-1 block text-xs font-medium text-slate-600">
                    Hak akses
                </label>
                <select
                    id={`${title}-access`}
                    value={form.data.access_level}
                    onChange={(e) => form.setData('access_level', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                    <option value="juri">Juri — hanya penilaian</option>
                    <option value="full">Panitia penuh — semua menu</option>
                </select>
                {form.errors.access_level && <p className="mt-1 text-xs text-rose-600">{form.errors.access_level}</p>}
            </div>

            <div className="sm:col-span-3">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                >
                    {form.processing ? 'Menyimpan…' : 'Simpan'}
                </button>
            </div>
        </form>
    );
}

export default function UserIndex({ users = [], filters = {} }) {
    const [panel, setPanel] = useState(null);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState(filters.q ?? '');

    const createForm = useForm({ ...emptyForm });
    const editForm = useForm({ name: '', email: '', username: '', whatsapp: '', access_level: 'juri', is_active: true });
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
        passwordForm.post(`/admin/akun/${editing.id}/reset-password`, {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const destroy = (user) => {
        if (!window.confirm(`Hapus akun ${user.username}?`)) return;
        router.delete(`/admin/akun/${user.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout title="Akun Panitia & Juri">
            <Head title="Akun Panitia & Juri" />

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Akun Panitia & Juri</h2>
                    <p className="text-sm text-slate-500">
                        Juri hanya melihat menu penilaian; panitia penuh mengelola seluruh data.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setPanel(panel === 'create' ? null : 'create')}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                >
                    Tambah akun
                </button>
            </div>

            {panel === 'create' && (
                <AccountForm
                    title="Akun baru"
                    form={createForm}
                    onSubmit={submitCreate}
                    onCancel={() => setPanel(null)}
                    withPassword
                />
            )}

            {panel === 'edit' && editing && (
                <>
                    <AccountForm
                        title={`Edit: ${editing.username}`}
                        form={editForm}
                        onSubmit={submitEdit}
                        onCancel={() => setPanel(null)}
                        withPassword={false}
                    />

                    <form
                        onSubmit={submitPassword}
                        className="mb-5 grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:grid-cols-3"
                    >
                        <div className="sm:col-span-3">
                            <p className="text-sm font-semibold text-amber-900">Reset password</p>
                        </div>
                        <div>
                            <label htmlFor="new-password" className="mb-1 block text-xs font-medium text-amber-900">
                                Password baru
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                            />
                            {passwordForm.errors.password && (
                                <p className="mt-1 text-xs text-rose-700">{passwordForm.errors.password}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="new-password2" className="mb-1 block text-xs font-medium text-amber-900">
                                Ulangi
                            </label>
                            <input
                                id="new-password2"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </>
            )}

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

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-2 font-semibold">Akun</th>
                                <th className="px-4 py-2 font-semibold">Akses</th>
                                <th className="px-4 py-2 font-semibold">Status</th>
                                <th className="px-4 py-2 font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => {
                                const isEditing = panel === 'edit' && editing?.id === user.id;

                                return (
                                    <tr key={user.id} className={isEditing ? 'bg-slate-50' : undefined}>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-900">
                                                {user.name}
                                                {user.is_self && <span className="ml-2 text-xs font-normal text-slate-400">(Anda)</span>}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {user.username} · {user.email}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge tone={user.access_level === 'full' ? 'sky' : 'amber'}>
                                                {user.access_level === 'full' ? 'Panitia penuh' : 'Juri'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge tone={user.is_active ? 'emerald' : 'slate'}>
                                                {user.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(user)}
                                                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Edit
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
                                        </td>
                                    </tr>
                                );
                            })}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                                        Belum ada akun panitia/juri.
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
