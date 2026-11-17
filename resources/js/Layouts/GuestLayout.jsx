import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

function Icon({ path, className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

/**
 * Kerangka halaman publik. Semua warna diambil dari CSS variable tema event
 * (--primary-color / --secondary-color) yang disuntik app.blade.php.
 */
export default function GuestLayout({ title, children }) {
    const { event, theme, auth } = usePage().props;
    const [open, setOpen] = useState(false);

    const eventName = event?.event_name ?? 'Festival Pelajar Muslim';
    const editionTitle = theme?.edition_title && theme.edition_title !== eventName ? theme.edition_title : null;
    const logo = theme?.logo_url;
    const user = auth?.user ?? null;

    const nav = [
        { href: '/', label: 'Beranda' },
        { href: '/lomba', label: 'Cabang Lomba' },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
                    <Link href="/" className="flex min-w-0 items-center gap-3">
                        {logo ? (
                            <img src={logo} alt={eventName} className="h-9 w-9 rounded-xl object-cover" />
                        ) : (
                            <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                                style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                                aria-hidden="true"
                            >
                                FP
                            </span>
                        )}
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-slate-900">{eventName}</span>
                            <span className="block truncate text-[11px] uppercase tracking-wide text-slate-500">
                                {editionTitle ?? (event?.year ? `Edisi ${event.year}` : 'Halaman Publik')}
                            </span>
                        </span>
                    </Link>

                    <nav className="ml-auto hidden items-center gap-1 sm:flex">
                        {nav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-2 sm:ml-2">
                        <Link
                            href={user ? '/dashboard' : '/login'}
                            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
                        >
                            {user ? 'Dashboard' : 'Masuk'}
                        </Link>
                        <Link
                            href={user ? '/daftar' : '/klaim'}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                            style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                        >
                            {user ? 'Daftar Lomba' : 'Klaim Akun'}
                        </Link>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-label="Menu"
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
                        >
                            <Icon path="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {open && (
                    <nav className="border-t border-slate-200 bg-white px-4 py-2 sm:hidden">
                        {[...nav, { href: user ? '/dashboard' : '/login', label: user ? 'Dashboard' : 'Masuk' }].map(
                            (item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                >
                                    {item.label}
                                </Link>
                            ),
                        )}
                    </nav>
                )}
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-slate-200 bg-slate-50">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p>
                        {eventName}
                        {event?.year ? ` · ${event.year}` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/lomba" className="hover:text-slate-800">
                            Cabang Lomba
                        </Link>
                        <Link href="/klaim" className="hover:text-slate-800">
                            Klaim Akun Sekolah
                        </Link>
                        <Link href="/login" className="hover:text-slate-800">
                            Masuk
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
