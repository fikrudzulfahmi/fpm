import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import { useConfirm } from '../../../Components/ConfirmProvider';
import Modal from '../../../Components/Modal';

const DEFAULT_PRIMARY = '#064b3d';
const DEFAULT_SECONDARY = '#f3d95b';

function EventSettings({ event }) {
    const [open, setOpen] = useState(false);

    const form = useForm({
        admin_whatsapp: event.settings?.admin_whatsapp ?? '',
        publish_scores: Boolean(event.settings?.publish_scores),
        enable_certificates: Boolean(event.settings?.enable_certificates),
    });

    const save = (e) => {
        e.preventDefault();
        form.post(`/admin/event/${event.id}/setelan`, { preserveScroll: true });
    };

    return (
        <>
            <div className="border-t border-slate-100 px-4 py-3">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800"
                >
                    Setelan Event
                    <span className="text-slate-400">›</span>
                </button>
            </div>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Setelan event"
                subtitle={event.event_name}
                footer={
                    <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>
                            Tutup
                        </button>
                        <button
                            type="submit"
                            form={`settings-${event.id}`}
                            className="btn btn--dark btn--sm"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Menyimpan…' : 'Simpan setelan'}
                        </button>
                    </>
                }
            >
                <form id={`settings-${event.id}`} onSubmit={save} className="grid gap-4">
                    <div>
                        <label htmlFor={`wa-${event.id}`} className="mb-1 block text-xs font-medium text-slate-600">
                            WhatsApp Panitia
                        </label>
                        <input
                            id={`wa-${event.id}`}
                            type="tel"
                            value={form.data.admin_whatsapp}
                            onChange={(e) => form.setData('admin_whatsapp', e.target.value)}
                            placeholder="08xxxxxxxxxx"
                            className="block w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none"
                        />
                        {form.errors.admin_whatsapp && (
                            <p className="mt-1 text-xs text-rose-600">{form.errors.admin_whatsapp}</p>
                        )}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={form.data.publish_scores}
                            onChange={(e) => form.setData('publish_scores', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300"
                        />
                        Publikasikan nilai
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={form.data.enable_certificates}
                            onChange={(e) => form.setData('enable_certificates', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300"
                        />
                        Buka unduh sertifikat
                    </label>
                </form>
            </Modal>
        </>
    );
}
function EventBranding({ event }) {
    const confirm = useConfirm();
    const [open, setOpen] = useState(false);
    const logoForm = useForm({ logo: null });
    const logo = event.theme?.logo_url ?? null;

    const metaForm = useForm({
        event_name: event.event_name ?? '',
        year: event.year ?? '',
        theme_config: {
            primary: event.theme?.primary ?? DEFAULT_PRIMARY,
            secondary: event.theme?.secondary ?? DEFAULT_SECONDARY,
            edition_title: event.theme?.edition_title ?? '',
        },
    });

    const setTheme = (key, value) => {
        metaForm.setData('theme_config', { ...metaForm.data.theme_config, [key]: value });
    };

    const saveMeta = (e) => {
        e.preventDefault();
        metaForm.put(`/admin/event/${event.id}`, { preserveScroll: true, preserveState: true });
    };

    const uploadLogo = (e) => {
        e.preventDefault();
        if (!logoForm.data.logo) return;
        logoForm.post(`/admin/event/${event.id}/logo`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => logoForm.reset('logo'),
        });
    };

    const removeLogo = async () => {
        const ok = await confirm({
            title: 'Hapus logo event?',
            message: 'Logo event akan dihapus dan tampilan publik kembali memakai logo bawaan FPM.',
            confirmLabel: 'Hapus logo',
        });
        if (!ok) return;

        router.delete(`/admin/event/${event.id}/logo`, { preserveScroll: true });
    };

    return (
        <>
            <div className="border-t border-slate-100 px-5 py-3">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800"
                >
                    Identitas & Tema (white-label)
                    <span className="text-slate-400">›</span>
                </button>
            </div>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Identitas & tema event"
                subtitle={event.event_name}
                size="lg"
                footer={
                    <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>
                            Tutup
                        </button>
                        <button
                            type="submit"
                            form={`meta-${event.id}`}
                            className="btn btn--dark btn--sm"
                            disabled={metaForm.processing}
                        >
                            {metaForm.processing ? 'Menyimpan…' : 'Simpan identitas'}
                        </button>
                    </>
                }
            >
                <div className="grid gap-5 pt-1 lg:grid-cols-[200px,1fr]">
                    <div>
                        <p className="mb-2 text-xs font-semibold text-slate-600">Logo event</p>
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                            {logo ? (
                                <img src={logo} alt={`Logo ${event.event_name}`} className="h-full w-full object-contain" />
                            ) : (
                                <span className="text-[11px] text-slate-400">Belum ada</span>
                            )}
                        </div>
                        <form onSubmit={uploadLogo} className="mt-2 space-y-2">
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                onChange={(e) => logoForm.setData('logo', e.target.files?.[0] ?? null)}
                                className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-900 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white"
                            />
                            {logoForm.errors.logo && <p className="text-xs text-rose-600">{logoForm.errors.logo}</p>}
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={logoForm.processing || !logoForm.data.logo}
                                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--primary-color, #064b3d)' }}
                                >
                                    {logoForm.processing ? 'Mengunggah…' : 'Unggah'}
                                </button>
                                {logo && (
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100"
                                    >
                                        Hapus logo
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400">PNG/JPG/WebP/SVG, maks 2 MB.</p>
                        </form>
                    </div>

                    <form id={`meta-${event.id}`} onSubmit={saveMeta} className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor={`name-${event.id}`} className="mb-1 block text-xs font-medium text-slate-600">
                                Nama event
                            </label>
                            <input
                                id={`name-${event.id}`}
                                value={metaForm.data.event_name}
                                onChange={(e) => metaForm.setData('event_name', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            {metaForm.errors.event_name && (
                                <p className="mt-1 text-xs text-rose-600">{metaForm.errors.event_name}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor={`year-${event.id}`} className="mb-1 block text-xs font-medium text-slate-600">
                                Tahun
                            </label>
                            <input
                                id={`year-${event.id}`}
                                type="number"
                                min="2000"
                                max="2100"
                                value={metaForm.data.year}
                                onChange={(e) => metaForm.setData('year', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            {metaForm.errors.year && <p className="mt-1 text-xs text-rose-600">{metaForm.errors.year}</p>}
                        </div>

                        <div>
                            <label htmlFor={`edition-${event.id}`} className="mb-1 block text-xs font-medium text-slate-600">
                                Judul edisi
                            </label>
                            <input
                                id={`edition-${event.id}`}
                                value={metaForm.data.theme_config.edition_title}
                                onChange={(e) => setTheme('edition_title', e.target.value)}
                                placeholder="Festival Pelajar Muslim XII 2027"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            {metaForm.errors['theme_config.edition_title'] && (
                                <p className="mt-1 text-xs text-rose-600">{metaForm.errors['theme_config.edition_title']}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor={`primary-${event.id}`} className="mb-1 block text-xs font-medium text-slate-600">
                                Warna primer
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id={`primary-${event.id}`}
                                    type="color"
                                    value={metaForm.data.theme_config.primary}
                                    onChange={(e) => setTheme('primary', e.target.value)}
                                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                                />
                                <span className="font-mono text-xs text-slate-500">{metaForm.data.theme_config.primary}</span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor={`secondary-${event.id}`} className="mb-1 block text-xs font-medium text-slate-600">
                                Warna sekunder
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id={`secondary-${event.id}`}
                                    type="color"
                                    value={metaForm.data.theme_config.secondary}
                                    onChange={(e) => setTheme('secondary', e.target.value)}
                                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                                />
                                <span className="font-mono text-xs text-slate-500">{metaForm.data.theme_config.secondary}</span>
                            </div>
                        </div>

                    </form>
                </div>
            </Modal>
        </>
    );
}

export default function EventIndex({ events = [] }) {
    const confirm = useConfirm();
    const [createOpen, setCreateOpen] = useState(false);
    const createForm = useForm({
        event_name: '',
        year: new Date().getFullYear() + 1,
        theme_config: { primary: DEFAULT_PRIMARY, secondary: DEFAULT_SECONDARY, edition_title: '' },
    });

    const setTheme = (key, value) => {
        createForm.setData('theme_config', { ...createForm.data.theme_config, [key]: value });
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post('/admin/event', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset('event_name');
                setCreateOpen(false);
            },
        });
    };

    const activate = async (id) => {
        const ok = await confirm({
            title: 'Aktifkan event ini?',
            message: 'Event lain otomatis dinonaktifkan. Pendaftaran publik akan memakai event ini.',
            confirmLabel: 'Aktifkan',
            tone: 'primary',
        });
        if (!ok) return;

        router.post(`/admin/event/${id}/aktifkan`, {}, { preserveScroll: true });
    };

    const destroy = async (event) => {
        const ok = await confirm({
            title: 'Hapus event?',
            message: `Event "${event.event_name}" beserta cabang lomba dan pendaftarannya akan dihapus permanen.`,
            confirmLabel: 'Hapus event',
        });
        if (!ok) return;

        router.delete(`/admin/event/${event.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout title="Event & Lomba">
            <Head title="Event & Lomba" />

            <div className="page-head-row mb-5">
                <div>
                    <h2 className="page-title">Manajemen Event</h2>
                    <p className="text-sm text-slate-500">
                        Hanya satu event yang aktif pada satu waktu. Setelan nilai dan sertifikat disimpan per event.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: 'var(--primary-color, #064b3d)' }}
                >
                    Buat event
                </button>
            </div>

            <section className="panel panel--flush mb-6">
                <div className="border-b border-slate-100 px-5 py-3">
                    <h3 className="panel__title">Daftar Event</h3>
                </div>

                {events.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-slate-400">Belum ada event. Buat event pertama di bawah.</p>
                ) : (
                    <ul className="data-table__body">
                        {events.map((event) => (
                            <li key={event.id}>
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        {event.theme?.logo_url ? (
                                            <img
                                                src={event.theme.logo_url}
                                                alt={`Logo ${event.event_name}`}
                                                className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                                            />
                                        ) : (
                                            <span
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white"
                                                style={{ backgroundColor: event.theme?.primary ?? DEFAULT_PRIMARY }}
                                                aria-hidden="true"
                                            >
                                                FPM
                                            </span>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate font-semibold text-slate-900">{event.event_name}</p>
                                                {event.is_active ? (
                                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {event.year}
                                                {event.theme?.edition_title ? ` · ${event.theme.edition_title}` : ''} ·{' '}
                                                {event.competitions_count ?? 0} lomba · {event.registrations_count ?? 0} pendaftaran
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1" title="Palet warna event">
                                            <span
                                                className="h-4 w-4 rounded-full ring-1 ring-inset ring-slate-200"
                                                style={{ backgroundColor: event.theme?.primary ?? DEFAULT_PRIMARY }}
                                            />
                                            <span
                                                className="h-4 w-4 rounded-full ring-1 ring-inset ring-slate-200"
                                                style={{ backgroundColor: event.theme?.secondary ?? DEFAULT_SECONDARY }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => activate(event.id)}
                                            disabled={event.is_active}
                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-40"
                                            style={{ backgroundColor: 'var(--primary-color, #064b3d)' }}
                                        >
                                            Aktifkan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => destroy(event)}
                                            disabled={event.is_active}
                                            title={event.is_active ? 'Event aktif tidak bisa dihapus' : 'Hapus event'}
                                            className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100 disabled:opacity-40"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>

                                <div className="px-5 pb-3">
                                    <EventBranding event={event} />
                                    <EventSettings event={event} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Buat event baru"
                subtitle="Event aktif dipakai halaman publik dan pendaftaran."
                size="lg"
                footer={
                    <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCreateOpen(false)}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="event-create-form"
                            className="btn btn--dark btn--sm"
                            disabled={createForm.processing}
                        >
                            {createForm.processing ? 'Menyimpan…' : 'Buat event'}
                        </button>
                    </>
                }
            >
                <form id="event-create-form" onSubmit={submitCreate} className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor="event_name" className="mb-1 block text-sm font-medium text-slate-700">
                            Nama Event <span className="text-rose-600">*</span>
                        </label>
                        <input
                            id="event_name"
                            type="text"
                            value={createForm.data.event_name}
                            onChange={(e) => createForm.setData('event_name', e.target.value)}
                            placeholder="Festival Pelajar Muslim"
                            className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 ${
                                createForm.errors.event_name
                                    ? 'border-rose-400 focus:ring-rose-200'
                                    : 'border-slate-300 focus:ring-slate-200'
                            }`}
                        />
                        {createForm.errors.event_name && (
                            <p className="mt-1 text-xs text-rose-600">{createForm.errors.event_name}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="year" className="mb-1 block text-sm font-medium text-slate-700">
                            Tahun <span className="text-rose-600">*</span>
                        </label>
                        <input
                            id="year"
                            type="number"
                            min="2000"
                            max="2100"
                            value={createForm.data.year}
                            onChange={(e) => createForm.setData('year', e.target.value)}
                            className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 ${
                                createForm.errors.year ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-slate-200'
                            }`}
                        />
                        {createForm.errors.year && <p className="mt-1 text-xs text-rose-600">{createForm.errors.year}</p>}
                    </div>

                    <div>
                        <label htmlFor="edition_title" className="mb-1 block text-sm font-medium text-slate-700">
                            Judul Edisi
                        </label>
                        <input
                            id="edition_title"
                            type="text"
                            value={createForm.data.theme_config.edition_title}
                            onChange={(e) => setTheme('edition_title', e.target.value)}
                            placeholder="Edisi XII 2027"
                            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                        {createForm.errors['theme_config.edition_title'] && (
                            <p className="mt-1 text-xs text-rose-600">{createForm.errors['theme_config.edition_title']}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="primary" className="mb-1 block text-sm font-medium text-slate-700">
                            Warna Primer
                        </label>
                        <input
                            id="primary"
                            type="color"
                            value={createForm.data.theme_config?.primary ?? DEFAULT_PRIMARY}
                            onChange={(e) => setTheme('primary', e.target.value)}
                            className="block h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                        />
                    </div>

                    <div>
                        <label htmlFor="secondary" className="mb-1 block text-sm font-medium text-slate-700">
                            Warna Sekunder
                        </label>
                        <input
                            id="secondary"
                            type="color"
                            value={createForm.data.theme_config?.secondary ?? DEFAULT_SECONDARY}
                            onChange={(e) => setTheme('secondary', e.target.value)}
                            className="block h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                        />
                    </div>

                </form>
            </Modal>
        </AppLayout>
    );
}
