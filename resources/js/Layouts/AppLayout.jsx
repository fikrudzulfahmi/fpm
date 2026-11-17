import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import FlashMessage from '../Components/FlashMessage';

function Icon({ path, className = 'h-5 w-5' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

const icons = {
    home: 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
    plus: 'M12 4.5v15m7.5-7.5h-15',
    list: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
    trophy: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
    calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75',
    school: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
    users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    flag: 'M3 3v18m0-13.5h9.75l1.5 3h6v9h-6l-1.5-3H3',
    certificate: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
};

export default function AppLayout({ title, children }) {
    const { auth, event, theme } = usePage().props;
    const user = auth?.user ?? null;
    const [open, setOpen] = useState(false);

    // Tutup drawer mobile setiap kali path berubah.
    const { url } = usePage();
    useEffect(() => {
        setOpen(false);
    }, [url]);

    const isAdmin = user?.role === 'admin';
    const eventName = event?.event_name ?? 'Festival Pelajar Muslim';
    const year = event?.year;

    const nav = isAdmin
        ? [
              { href: '/dashboard', label: 'Dashboard', icon: icons.home },
              { href: '/admin/pendaftaran', label: 'Verifikasi Pendaftaran', icon: icons.list },
              { href: '/admin/nilai', label: 'Penilaian', icon: icons.trophy },
              { href: '/admin/event', label: 'Event & Lomba', icon: icons.calendar },
              { href: '/admin/lomba', label: 'Manajemen Lomba', icon: icons.flag },
              { href: '/admin/sekolah', label: 'Master Sekolah', icon: icons.school },
              { href: '/admin/akun', label: 'Akun Panitia & Juri', icon: icons.users },
              { href: '/admin/sertifikat', label: 'Sertifikat & Piagam', icon: icons.certificate },
          ]
        : [
              { href: '/dashboard', label: 'Dashboard', icon: icons.home },
              { href: '/daftar', label: 'Pendaftaran Baru', icon: icons.plus },
          ];

    const current = (href) => (url === href || url.startsWith(`${href}/`) ? true : false);

    const sidebar = (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ring-1 ring-white/20"
                    style={{ backgroundColor: 'var(--secondary-color, #c9a45c)' }}
                >
                    FP
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{eventName}</p>
                    <p className="text-[11px] uppercase tracking-wide text-white/60">
                        {year ? `Edisi ${year}` : 'Panitia & Sekolah'}
                    </p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {nav.map((item) => {
                    const active = current(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                active ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <Icon path={item.icon} />
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 px-3 py-3">
                <div className="mb-2 px-2">
                    <p className="truncate text-sm font-semibold text-white">{user?.name ?? 'Pengguna'}</p>
                    <p className="truncate text-[11px] text-white/60">
                        {isAdmin ? 'Panitia' : user?.school?.school_name ?? 'Akun sekolah'}
                    </p>
                </div>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                    <Icon path={icons.logout} />
                    Keluar
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-full bg-slate-50">
            <aside
                className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"
                style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
            >
                {sidebar}
            </aside>

            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button
                        type="button"
                        aria-label="Tutup menu"
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <aside
                        className="absolute inset-y-0 left-0 w-64 shadow-xl"
                        style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                    >
                        {sidebar}
                    </aside>
                </div>
            )}

            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                        aria-label="Buka menu"
                    >
                        <Icon path="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" className="h-6 w-6" />
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {eventName}
                            {theme?.edition_title && theme.edition_title !== eventName ? ` · ${theme.edition_title}` : ''}
                        </p>
                        <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {isAdmin ? 'Panitia' : 'Sekolah'}
                        </span>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
                    <FlashMessage />
                    {children}
                </main>
            </div>
        </div>
    );
}
