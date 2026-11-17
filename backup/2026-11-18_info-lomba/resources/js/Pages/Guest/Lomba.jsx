import { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import GuestLayout from '../../Layouts/GuestLayout';

const categoryLabel = {
    individual: 'Individu',
    group: 'Kelompok',
};

const FILTERS = [
    { key: 'all', label: 'Semua' },
    { key: 'individual', label: 'Individu' },
    { key: 'group', label: 'Kelompok' },
    { key: 'open', label: 'Masih dibuka' },
];

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}

function statusOf(c) {
    if (!c.is_open) return { label: 'Ditutup', tone: 'badge--closed' };
    if (c.is_full) return { label: 'Kuota penuh', tone: 'badge--closed' };
    return { label: 'Buka', tone: 'badge--open' };
}

function QuotaBar({ used = 0, total = 0 }) {
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    const rest = Math.max(0, total - used);
    const tone = rest === 0 ? ' quota__fill--full' : rest <= Math.max(1, Math.round(total * 0.15)) ? ' quota__fill--low' : '';

    return (
        <div className="quota">
            <div className="quota__label">
                <span>Kuota tersisa</span>
                <span>
                    <strong>{rest}</strong> / {total}
                </span>
            </div>
            <div className="quota__bar">
                <div className={`quota__fill${tone}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function Lomba({ event_info, competitions = [] }) {
    const { auth, site } = usePage().props;
    const user = auth?.user ?? null;
    const [filter, setFilter] = useState('all');

    const eventName = event_info?.event_name ?? 'Festival Pelajar Muslim XII';
    const audienceShort = site?.audience_short ?? 'SMP/MTs';
    const registration = site?.registration ?? {
        window_label: '20 November 2026 – 22 Januari 2027',
        end_label: 'Jumat, 22 Januari 2027',
    };
    const isAdmin = user?.role === 'admin';
    const primaryHref = isAdmin ? '/dashboard' : user ? '/daftar' : '/klaim';

    const visible = useMemo(() => {
        if (filter === 'all') return competitions;

        if (filter === 'open') {
            return competitions.filter((c) => c.is_open && !c.is_full);
        }

        return competitions.filter((c) => c.category_type === filter);
    }, [competitions, filter]);

    const totalQuota = competitions.reduce((sum, c) => sum + (c.remaining_quota ?? 0), 0);

    return (
        <GuestLayout title="Cabang Lomba">
            <Head title="Cabang Lomba" />

            <section className="page-head">
                <div className="container page-head__inner">
                    <ol className="crumbs">
                        <li>
                            <Link href="/">Beranda</Link>
                        </li>
                        <li aria-current="page">Lomba</li>
                    </ol>
                    <span className="eyebrow eyebrow--gold">Kompetisi</span>
                    <h1>Cabang lomba</h1>
                    <p>
                        {competitions.length > 0
                            ? `${competitions.length} cabang untuk ${audienceShort} se-Karesidenan Kediri. Pendaftaran ${registration.window_label}. Pilih kategori untuk mempersempit daftar, lalu buka ketentuan tiap cabang.`
                            : `Panitia ${eventName} belum mempublikasikan cabang lomba.`}
                    </p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    {competitions.length === 0 ? (
                        <div className="empty-state">
                            Belum ada cabang lomba yang dipublikasikan. Silakan cek kembali nanti.
                        </div>
                    ) : (
                        <>
                            <div className="filters" role="group" aria-label="Filter cabang lomba">
                                {FILTERS.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className="chip"
                                        aria-pressed={filter === item.key ? 'true' : 'false'}
                                        onClick={() => setFilter(item.key)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {visible.length === 0 ? (
                                <div className="empty-state">Tidak ada cabang lomba pada kategori ini.</div>
                            ) : (
                                <div className="cards" data-detail="true">
                                    {visible.map((c, i) => {
                                        const s = statusOf(c);

                                        return (
                                            <article
                                                className="lomba-card reveal"
                                                key={c.id}
                                                style={{ '--d': `${(i % 6) * 60}ms` }}
                                            >
                                                <div className="lomba-card__top">
                                                    <span className="lomba-card__num">
                                                        {String(i + 1).padStart(2, '0')}
                                                    </span>
                                                    <span className={`badge ${s.tone}`}>{s.label}</span>
                                                </div>

                                                <h3>{c.name}</h3>
                                                <p className="lomba-card__meta">
                                                    {categoryLabel[c.category_type] ?? c.category_type}
                                                    {c.gender_mode === 'separate' ? ' · Putra & Putri' : ''}
                                                </p>
                                                <p>
                                                    {c.description ??
                                                        'Panitia belum menambahkan deskripsi untuk cabang ini.'}
                                                </p>

                                                {c.category_type === 'group' && c.min_group_members ? (
                                                    <details className="lomba-card__more">
                                                        <summary>Ketentuan peserta</summary>
                                                        <ul>
                                                            <li>
                                                                Satu tim terdiri dari {c.min_group_members}
                                                                {c.max_group_members && c.max_group_members !== c.min_group_members
                                                                    ? `–${c.max_group_members}`
                                                                    : ''}{' '}
                                                                siswa.
                                                            </li>
                                                            <li>Setiap siswa hanya boleh mengikuti satu cabang lomba.</li>
                                                            <li>
                                                                Pendaftaran dilakukan oleh sekolah melalui akun
                                                                sekolah.
                                                            </li>
                                                        </ul>
                                                    </details>
                                                ) : (
                                                    <details className="lomba-card__more">
                                                        <summary>Ketentuan peserta</summary>
                                                        <ul>
                                                            <li>
                                                                Lomba individu: satu peserta untuk satu
                                                                pendaftaran.
                                                            </li>
                                                            {c.gender_mode === 'separate' && (
                                                                <li>
                                                                    Kategori Putra dan Putri dipisah dengan kuota
                                                                    masing-masing.
                                                                </li>
                                                            )}
                                                            <li>Setiap siswa hanya boleh mengikuti satu cabang lomba.</li>
                                                            <li>
                                                                Pendaftaran dilakukan oleh sekolah melalui akun
                                                                sekolah.
                                                            </li>
                                                        </ul>
                                                    </details>
                                                )}

                                                <QuotaBar used={c.used_quota} total={c.global_quota} />

                                                <div className="lomba-card__foot">
                                                    <span>{c.remaining_quota} slot tersisa</span>
                                                    <Link href={`/lomba/${c.slug}`}>
                                                        Detail
                                                        <ArrowIcon />
                                                    </Link>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    <div className="form-note" style={{ marginTop: '30px', maxWidth: '70ch' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 11v5M12 8h.01" />
                        </svg>
                        <span>
                            Pendaftaran FPM XII <strong>tidak dipungut biaya</strong>. Pendaftaran ditutup{' '}
                            <strong>{registration.end_label}</strong>. Kuota setiap cabang terbatas — saat
                            ini tersisa <strong>{totalQuota}</strong> slot dari seluruh cabang. Kuota
                            tersisa = kuota global dikurangi pendaftaran yang menunggu verifikasi dan
                            disetujui.
                        </span>
                    </div>
                </div>
            </section>

            <section className="section section--paper">
                <div className="container">
                    <div className="section-head">
                        <div>
                            <span className="eyebrow">Alur pendaftaran</span>
                            <h2 className="h2">Tiga langkah, selesai.</h2>
                            <p className="lead">
                                Pendaftaran dilakukan daring. Tidak perlu datang ke sekolah untuk mengambil
                                formulir.
                            </p>
                        </div>
                        <Link className="link-more" href={primaryHref}>
                            {isAdmin ? 'Buka dashboard' : user ? 'Ke formulir pendaftaran' : 'Klaim akun dulu'}
                            <ArrowIcon />
                        </Link>
                    </div>

                    <ol className="steps">
                        <li>
                            <span className="steps__date">Langkah 1</span>
                            <h3>Pilih cabang lomba</h3>
                            <p>Tentukan cabang dan format peserta (individu atau tim) sesuai ketentuan.</p>
                        </li>
                        <li>
                            <span className="steps__date">Langkah 2</span>
                            <h3>Isi formulir daring</h3>
                            <p>Lengkapi NISN, nama peserta, guru pendamping, dan surat rekomendasi.</p>
                        </li>
                        <li>
                            <span className="steps__date">Langkah 3</span>
                            <h3>Tunggu konfirmasi</h3>
                            <p>Panitia memverifikasi berkas, lalu mengirim informasi technical meeting.</p>
                        </li>
                    </ol>
                </div>
            </section>

            <section className="section section--tight">
                <div className="container">
                    <div className="cta-band reveal">
                        <div>
                            <h2>Sudah menemukan cabangnya?</h2>
                            <p>
                                Satu akun sekolah untuk semua cabang. Isi data peserta dengan teliti agar
                                proses verifikasi lebih cepat.
                            </p>
                        </div>
                        <div className="btn-row">
                            <Link className="btn btn--gold" href={primaryHref}>
                                {isAdmin ? 'Buka dashboard' : user ? 'Daftar sekarang' : 'Klaim akun sekolah'}
                                <ArrowIcon />
                            </Link>
                            <Link className="btn btn--ghost-light" href="/#faq">
                                Baca FAQ
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </GuestLayout>
    );
}
