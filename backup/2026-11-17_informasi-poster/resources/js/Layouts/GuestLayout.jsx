import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { waLink } from '../lib/format';

const SCHOOL_NAME = 'SMKS Islam 1 Kota Blitar';
const ICON = {
    arrow: 'M5 12h14M13 6l6 6-6 6',
    menu: 'M4 7h16M4 12h16M4 17h16',
    close: 'M6 6l12 12M18 6L6 18',
    mail: 'M3 6.5h18v11H3zM3.6 7l7.5 5.2c.55.4 1.3.4 1.85 0L20.4 7',
    pin: 'M20 10c0 5.2-6.3 10.4-7.4 11.3a1 1 0 0 1-1.2 0C10.3 20.4 4 15.2 4 10a8 8 0 1 1 16 0',
    pinDot: 'M12 7.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2',
    top: 'M12 19V5M6 11l6-6 6 6',
};

function Icon({ path, className = '' }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={path} />
        </svg>
    );
}

function WaIcon({ className = '' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.35-1.4a9.9 9.9 0 0 0 4.69 1.2h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.47 2 12.04 2m0 17.98a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.82.83-3.03-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.52 3.68-8.19 8.2-8.19 2.19 0 4.24.85 5.79 2.4a8.13 8.13 0 0 1 2.4 5.8c0 4.51-3.68 8.19-8.2 8.19m4.5-6.13c-.25-.13-1.46-.72-1.69-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.16-.29.19-.54.06a6.6 6.6 0 0 1-1.95-1.2 7.35 7.35 0 0 1-1.35-1.68c-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.83-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.64 4.2 3.7.58.26 1.04.4 1.4.52.59.19 1.13.16 1.55.1.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.17-.47-.3" />
        </svg>
    );
}

const NAV = [
    { href: '/', hash: '', label: 'Beranda' },
    { href: '/lomba', hash: '', label: 'Cabang Lomba' },
    { href: '/', hash: '#tentang', label: 'Tentang' },
    { href: '/', hash: '#alur', label: 'Alur' },
    { href: '/', hash: '#faq', label: 'FAQ' },
];

/**
 * Kerangka halaman publik dengan design system template FPM XII
 * (hijau–emas–krem, navbar pil mengambang, menu layar penuh di mobile).
 * Warna tema event tetap dihormati oleh elemen panel/admin yang memakai
 * var(--primary-color).
 */
export default function GuestLayout({ title, children }) {
    const { event, theme, auth } = usePage().props;
    const pageUrl = usePage().url;
    const [open, setOpen] = useState(false);
    const [stuck, setStuck] = useState(false);
    const [showTop, setShowTop] = useState(false);
    const rootRef = useRef(null);

    const eventName = event?.event_name ?? 'Festival Pelajar Muslim';
    const editionTitle = theme?.edition_title && theme.edition_title !== eventName ? theme.edition_title : null;
    const year = event?.year ?? null;
    const logo = theme?.logo_url ?? '/branding/logo-mark.png';
    const lightLogo = theme?.logo_url ?? '/branding/logo-mark-light.png';
    const whatsapp = event?.admin_whatsapp ?? null;
    const wa = waLink(whatsapp, 'Halo panitia FPM, saya ingin bertanya.');
    const user = auth?.user ?? null;

    const isActive = (item) => {
        if (item.hash) return false;
        if (item.href === '/') return pageUrl === '/' || pageUrl === '';
        return pageUrl === item.href || pageUrl.startsWith(`${item.href}/`) || pageUrl.startsWith(`${item.href}?`);
    };

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY || document.documentElement.scrollTop;
            setStuck(y > 24);
            setShowTop(y > 480);
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Tutup menu mobile setiap pindah halaman.
    useEffect(() => {
        setOpen(false);
    }, [pageUrl]);

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

    // Animasi masuk untuk elemen .reveal (diulang setiap ganti halaman).
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;

        const items = Array.from(root.querySelectorAll('.reveal:not(.is-in)'));
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if (!items.length) return undefined;

        if (reduce || typeof IntersectionObserver === 'undefined') {
            items.forEach((el) => el.classList.add('is-in'));

            return undefined;
        }

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-in');
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        items.forEach((el) => io.observe(el));

        return () => io.disconnect();
    }, [pageUrl]);

    const mobileMenu = (
        <div
            className={`menu${open ? ' is-open' : ''}`}
            id="menu"
            aria-hidden={open ? 'false' : 'true'}
        >
            <ul className="menu__list">
                {NAV.map((item, i) => (
                    <li key={`${item.href}${item.hash}`}>
                        {item.hash ? (
                            <a href={`${item.href}${item.hash}`} onClick={() => setOpen(false)}>
                                <span className="menu__num">0{i + 1}</span>
                                {item.label}
                                <Icon path={ICON.arrow} />
                            </a>
                        ) : (
                            <Link
                                href={item.href}
                                aria-current={isActive(item) ? 'page' : undefined}
                                onClick={() => setOpen(false)}
                            >
                                <span className="menu__num">0{i + 1}</span>
                                {item.label}
                                <Icon path={ICON.arrow} />
                            </Link>
                        )}
                    </li>
                ))}
            </ul>

            <Link href={user ? '/daftar' : '/klaim'} className="btn btn--gold menu__cta">
                {user ? 'Daftar lomba' : 'Klaim akun sekolah'}
                <Icon path={ICON.arrow} />
            </Link>
            <p className="menu__note">Pendaftaran tidak dipungut biaya.</p>
        </div>
    );

    return (
        <div className="fpm-site" id="top" ref={rootRef}>
            <a className="skip-link" href="#main">
                Lewati ke konten
            </a>

            <header className={`site-head${stuck ? ' is-stuck' : ''}`} data-open={open ? 'true' : 'false'}>
                <div className="site-head__inner">
                    <Link href="/" className="brand" aria-label={`${eventName} — beranda`}>
                        <img className="brand__mark" src={logo} alt="" width="33" height="38" />
                        <span className="brand__text">
                            <strong>{editionTitle ?? eventName}</strong>
                            <span>{SCHOOL_NAME}</span>
                        </span>
                    </Link>

                    <nav className="nav" id="nav" aria-label="Navigasi utama">
                        <ul className="nav__list">
                            {NAV.map((item) =>
                                item.hash ? (
                                    <li key={`${item.href}${item.hash}`}>
                                        <a href={`${item.href}${item.hash}`}>{item.label}</a>
                                    </li>
                                ) : (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            aria-current={isActive(item) ? 'page' : undefined}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ),
                            )}
                        </ul>
                        <Link
                            href={user ? '/daftar' : '/klaim'}
                            className="btn btn--gold btn--sm nav__cta"
                        >
                            {user ? 'Daftar' : 'Klaim akun'}
                            <Icon path={ICON.arrow} />
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className="nav-toggle"
                        aria-expanded={open ? 'true' : 'false'}
                        aria-controls="menu"
                        aria-label={open ? 'Tutup menu' : 'Buka menu'}
                        onClick={() => setOpen((v) => !v)}
                    >
                        <Icon path={open ? ICON.close : ICON.menu} />
                    </button>
                </div>
            </header>

            {mobileMenu}

            <main id="main">{children}</main>

            <footer className="site-foot">
                <div className="container">
                    <div className="site-foot__grid">
                        <div className="site-foot__brand">
                            <Link href="/" className="brand" aria-label={`${eventName} — beranda`}>
                                <img className="brand__mark" src={lightLogo} alt="" width="50" height="58" />
                                <span className="brand__text">
                                    <strong>{eventName}</strong>
                                    <span>{SCHOOL_NAME}</span>
                                </span>
                            </Link>
                            <p>
                                Ruang bertemu, berlomba, dan bertumbuh bagi pelajar Muslim. Digelar oleh{' '}
                                {SCHOOL_NAME}.
                            </p>
                            <div className="socials">
                                {wa && (
                                    <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp panitia">
                                        <WaIcon />
                                    </a>
                                )}
                                <a href="#main" aria-label="Kembali ke atas halaman">
                                    <Icon path={ICON.top} />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h3>Jelajahi</h3>
                            <ul>
                                <li>
                                    <Link href="/">Beranda</Link>
                                </li>
                                <li>
                                    <Link href="/lomba">Cabang lomba</Link>
                                </li>
                                <li>
                                    <a href="/#tentang">Tentang festival</a>
                                </li>
                                <li>
                                    <a href="/#faq">Pertanyaan umum</a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3>Pendaftaran</h3>
                            <ul>
                                <li>
                                    <Link href={user ? '/daftar' : '/klaim'}>
                                        {user ? 'Formulir pendaftaran' : 'Klaim akun sekolah'}
                                    </Link>
                                </li>
                                <li>
                                    <Link href={user ? '/dashboard' : '/login'}>
                                        {user ? 'Dashboard' : 'Masuk ke akun'}
                                    </Link>
                                </li>
                                <li>
                                    <a href="/#alur">Alur pendaftaran</a>
                                </li>
                                {wa && (
                                    <li>
                                        <a href={wa} target="_blank" rel="noopener noreferrer">
                                            WhatsApp panitia
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="site-foot__bottom">
                        <span>
                            © {year ?? new Date().getFullYear()} {eventName} · {SCHOOL_NAME}
                        </span>
                        <span>Pendaftaran tidak dipungut biaya.</span>
                    </div>
                </div>
            </footer>

            <div className="fab-stack">
                {wa && (
                    <a
                        className="fab fab--wa"
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Chat WhatsApp panitia"
                    >
                        <span className="fab__tip">Chat panitia</span>
                        <WaIcon />
                    </a>
                )}
                <div className={`fab-slot${showTop ? ' is-open' : ''}`}>
                    <button
                        className="fab fab--top"
                        type="button"
                        aria-label="Kembali ke atas"
                        tabIndex={showTop ? 0 : -1}
                        aria-hidden={showTop ? 'false' : 'true'}
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
                                    ? 'auto'
                                    : 'smooth',
                            })
                        }
                    >
                        <Icon path={ICON.top} />
                    </button>
                </div>
            </div>
        </div>
    );
}
