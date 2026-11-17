import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ToastProvider } from '../Components/Toast';
import { ConfirmProvider } from '../Components/ConfirmProvider';

function Icon({ path, className = '' }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            aria-hidden="true"
        >
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

/**
 * Kerangka panel panitia & sekolah dengan tema FPM XII.
 * Permukaan: krem–putih, aksen hijau tua + emas; kartu tanpa shadow dasar.
 */
export default function AppLayout({ title, children }) {
    const { auth, event, theme } = usePage().props;
    const user = auth?.user ?? null;
    const { url } = usePage();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(false);
    }, [url]);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const isAdmin = user?.role === 'admin';
    const eventName = event?.event_name ?? 'Festival Pelajar Muslim';
    const year = event?.year;
    const roleLabel = isAdmin ? (user?.access_level === 'juri' ? 'Juri' : 'Panitia') : 'Akun Sekolah';
    const initials = (user?.name ?? 'FPM')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

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

    const current = (href) => url === href || url.startsWith(`${href}/`) || url.startsWith(`${href}?`);

    const sidebar = (
        <>
            <Link href="/dashboard" className="admin-brand">
                <img
                    className="admin-brand__mark"
                    src={theme?.logo_url ?? '/branding/logo-mark.png'}
                    alt=""
                    width="38"
                    height="43"
                />
                <span className="min-w-0">
                    <span className="admin-brand__name block truncate">{eventName}</span>
                    <span className="admin-brand__sub block truncate">
                        {year ? `Edisi ${year}` : 'FPM'}
                    </span>
                </span>
            </Link>

            <nav className="admin-nav" aria-label="Navigasi panel">
                <span className="admin-nav__label">{isAdmin ? 'Menu panitia' : 'Menu sekolah'}</span>
                {nav.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`admin-nav__link${current(item.href) ? ' is-active' : ''}`}
                        aria-current={current(item.href) ? 'page' : undefined}
                    >
                        <Icon path={item.icon} />
                        <span className="truncate">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="admin-side__foot">
                <div className="admin-user">
                    <span className="admin-user__avatar" aria-hidden="true">
                        {initials}
                    </span>
                    <div className="min-w-0">
                        <p className="admin-user__name truncate">{user?.name ?? 'Pengguna'}</p>
                        <p className="admin-user__role truncate">
                            {isAdmin ? roleLabel : user?.school?.school_name ?? roleLabel}
                        </p>
                    </div>
                </div>
                <Link href="/logout" method="post" as="button" className="admin-logout">
                    <Icon path={icons.logout} />
                    Keluar
                </Link>
            </div>
        </>
    );

    return (
        <div className="fpm-admin">
            <ToastProvider>
                <ConfirmProvider>
                <div className="admin-shell">
                <aside className={`admin-side${open ? ' is-open' : ''}`} aria-label="Menu panel">
                    {sidebar}
                </aside>

                {open && (
                    <button
                        type="button"
                        className="admin-overlay"
                        aria-label="Tutup menu"
                        onClick={() => setOpen(false)}
                    />
                )}

                <div className="admin-main">
                    <header className="admin-top">
                        <button
                            type="button"
                            className="admin-menu-btn"
                            onClick={() => setOpen(true)}
                            aria-label="Buka menu"
                            aria-expanded={open ? 'true' : 'false'}
                        >
                            <Icon path="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" className="h-5 w-5" />
                        </button>

                        <div className="min-w-0 flex-1">
                            <p className="admin-top__event truncate">
                                {eventName}
                                {theme?.edition_title && theme.edition_title !== eventName
                                    ? ` · ${theme.edition_title}`
                                    : ''}
                            </p>
                            <h1 className="admin-top__title truncate">{title}</h1>
                        </div>

                        <div className="hidden items-center gap-2 sm:flex">
                            <Link href="/" className="admin-link-soft">
                                Lihat situs
                            </Link>
                            <span className="admin-chip">{roleLabel}</span>
                        </div>
                    </header>

                    <main className="admin-content">
                        {children}
                    </main>
                </div>
                </div>
                </ConfirmProvider>
            </ToastProvider>
        </div>
    );
}
