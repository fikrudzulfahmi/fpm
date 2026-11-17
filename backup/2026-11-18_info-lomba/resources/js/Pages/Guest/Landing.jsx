import { Head, Link, usePage } from '@inertiajs/react';
import GuestLayout from '../../Layouts/GuestLayout';

const FAQ = [
    {
        q: 'Siapa yang boleh mengikuti FPM XII?',
        a: 'Pelajar aktif SMP/MTs se-Karesidenan Kediri. Setiap peserta didaftarkan oleh sekolah melalui akun sekolah, bukan mendaftar sendiri.',
    },
    {
        q: 'Kapan pendaftaran dan pelaksanaannya?',
        a: 'Pendaftaran online 20 November 2026 sampai 22 Januari 2027. Technical meeting Senin, 25 Januari 2027, dan pelaksanaan lomba Sabtu, 30 Januari 2027 di SMKS Islam 1 Kota Blitar.',
    },
    {
        q: 'Apakah pendaftaran dipungut biaya?',
        a: 'Tidak. Pendaftaran FPM XII gratis. Kuota tiap cabang tetap terbatas, jadi daftarkan tim lebih awal.',
    },
    {
        q: 'Bagaimana cara mendapatkan akun sekolah?',
        a: 'Buka halaman Klaim Akun, masukkan NPSN sekolah (8 digit) yang sudah terdaftar di data panitia, lalu lengkapi data penanggung jawab.',
    },
    {
        q: 'Apa syarat berkas pendaftaran?',
        a: 'Setiap pendaftaran melampirkan surat rekomendasi resmi sekolah (JPG, PNG, atau PDF maksimal 5 MB). Berkas diperiksa otomatis, lalu diverifikasi panitia.',
    },
    {
        q: 'Bagaimana sertifikat dan piagam diperoleh?',
        a: 'Setelah panitia membuka sertifikat, akun sekolah dapat mengunduh sertifikat peserta. Piagam juara diterbitkan panitia untuk peserta yang memperoleh peringkat.',
    },
];

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}

function MetaIcon({ children }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {children}
        </svg>
    );
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

export default function Landing({ event_info, competitions = [], totals = {} }) {
    const { theme, auth, site } = usePage().props;
    const user = auth?.user ?? null;
    const isAdmin = user?.role === 'admin';

    const eventName = event_info?.event_name ?? 'Festival Pelajar Muslim XII';
    const logo = theme?.logo_url ?? '/branding/logo-mark.png';

    const school = site?.school ?? 'SMKS Islam 1 Kota Blitar';
    const audience = site?.audience ?? 'SMP/MTs se-Karesidenan Kediri';
    const audienceShort = site?.audience_short ?? 'SMP/MTs';
    const occasion = site?.occasion ?? 'Harlah ke-59 SMKS Islam 1 Kota Blitar';
    const occasionShort = site?.occasion_short ?? 'Harlah ke-59';
    const venue = site?.venue ?? {
        name: school,
        address: 'Jl. Musi No. 6, Blitar 66117',
        city: 'Kota Blitar, Jawa Timur',
    };
    const registration = site?.registration ?? {
        start_label: 'Jumat, 20 November 2026',
        end_label: 'Jumat, 22 Januari 2027',
        window_label: '20 November 2026 – 22 Januari 2027',
    };
    const technicalMeeting = site?.technical_meeting ?? { label: 'Senin, 25 Januari 2027' };
    const eventDate = site?.event_date ?? { label: 'Sabtu, 30 Januari 2027', short: '30 Januari 2027' };

    const lastWord = eventName.trim().split(/\s+/).pop() ?? '';
    const hasRomanEdition = /^[IVXLC]+$/.test(lastWord);
    const edition = hasRomanEdition ? lastWord : site?.edition ?? 'XII';
    const headingText = hasRomanEdition
        ? eventName.trim().slice(0, -lastWord.length).trim()
        : eventName;

    const totalCompetitions = totals.competitions ?? competitions.length;
    const openCompetitions = totals.open_competitions ?? 0;
    const remainingQuota = totals.remaining_quota ?? 0;
    const pendaftaranDibuka = openCompetitions > 0;
    const featured = competitions.slice(0, 6);

    const primaryHref = isAdmin ? '/dashboard' : user ? '/daftar' : '/klaim';
    const primaryLabel = isAdmin ? 'Buka dashboard' : user ? 'Daftarkan tim' : 'Klaim akun sekolah';

    return (
        <GuestLayout title="Beranda">
            <Head title="Beranda" />

            {/* ============ HERO ============ */}
            <section className="hero">
                <div className="container hero__grid">
                    <div className="hero__copy">
                        <span className="hero__badge">
                            <span className="dot" aria-hidden="true" />
                            {pendaftaranDibuka ? 'Pendaftaran dibuka' : 'Pendaftaran ditutup'}
                            <span className="hero__free">Gratis</span>
                        </span>

                        <h1>
                            {headingText}
                            {hasRomanEdition && (
                                <>
                                    {' '}
                                    <span className="year">{edition}</span>
                                </>
                            )}
                        </h1>

                        <p className="hero__lead">
                            {audience}. {site?.tagline ?? occasion}. Ruang bertemu, berlomba, dan
                            bertumbuh bagi pelajar Muslim.
                        </p>

                        <ul className="hero__meta">
                            <li>
                                <MetaIcon>
                                    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                                    <path d="M8 3v4M16 3v4M3.5 10h17" />
                                </MetaIcon>
                                <span>{eventDate.label}</span>
                            </li>
                            <li>
                                <MetaIcon>
                                    <path d="M20 10c0 5.2-6.3 10.4-7.4 11.3a1 1 0 0 1-1.2 0C10.3 20.4 4 15.2 4 10a8 8 0 1 1 16 0" />
                                    <circle cx="12" cy="10" r="2.6" />
                                </MetaIcon>
                                <span>{venue.name}</span>
                            </li>
                            <li>
                                <MetaIcon>
                                    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
                                    <path d="M8 8h8M8 12h8M8 16h5" />
                                </MetaIcon>
                                <span>Pendaftaran {registration.window_label}</span>
                            </li>
                        </ul>

                        <div className="btn-row">
                            <Link className="btn btn--gold" href={primaryHref}>
                                {primaryLabel}
                                <ArrowIcon />
                            </Link>
                            <Link className="btn btn--ghost-light" href="/lomba">
                                Lihat cabang lomba
                            </Link>
                        </div>
                    </div>

                    <div className="hero__art">
                        <div className="pass-scene">
                            <div className="pass">
                                <div className="pass__top">
                                    <img className="pass__mark" src={logo} alt="" width="34" height="42" />
                                    <span className="pass__eyebrow">Festival Pelajar Muslim</span>
                                </div>

                                <div className="pass__title">
                                    <span>FPM</span>
                                    <strong>{edition}</strong>
                                </div>
                                <p className="pass__sub">{school}</p>

                                <div className="pass__perf" aria-hidden="true" />

                                <dl className="pass__facts">
                                    <div>
                                        <dt>Pelaksanaan</dt>
                                        <dd>{eventDate.short}</dd>
                                    </div>
                                    <div>
                                        <dt>Peserta</dt>
                                        <dd>{audienceShort}</dd>
                                    </div>
                                    <div>
                                        <dt>Cabang</dt>
                                        <dd>{totalCompetitions} lomba</dd>
                                    </div>
                                    <div>
                                        <dt>Biaya</dt>
                                        <dd className="is-free">Gratis</dd>
                                    </div>
                                </dl>

                                <div className="pass__foot">
                                    <span className="pass__barcode" aria-hidden="true">
                                        {Array.from({ length: 14 }).map((_, i) => (
                                            <i key={i} />
                                        ))}
                                    </span>
                                    <span className="pass__code">{occasionShort}</span>
                                </div>
                            </div>

                            <span className="pass-sticker" aria-hidden="true">
                                Gratis
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ FAKTA RINGKAS ============ */}
            <div className="facts">
                <div className="container">
                    <div className="facts__card">
                        <div className="fact">
                            <span className="fact__label">
                                <MetaIcon>
                                    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                                    <path d="M8 3v4M16 3v4M3.5 10h17" />
                                </MetaIcon>
                                Pelaksanaan
                            </span>
                            <span className="fact__value">
                                {eventDate.short}
                                <span>{occasion}</span>
                            </span>
                        </div>
                        <div className="fact">
                            <span className="fact__label">
                                <MetaIcon>
                                    <path d="M20 10c0 5.2-6.3 10.4-7.4 11.3a1 1 0 0 1-1.2 0C10.3 20.4 4 15.2 4 10a8 8 0 1 1 16 0" />
                                    <circle cx="12" cy="10" r="2.6" />
                                </MetaIcon>
                                Tempat
                            </span>
                            <span className="fact__value">
                                {venue.name}
                                <span>{venue.address}</span>
                            </span>
                        </div>
                        <div className="fact">
                            <span className="fact__label">
                                <MetaIcon>
                                    <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
                                    <circle cx="10" cy="7.5" r="3.2" />
                                    <path d="M20 19v-1.4a3.4 3.4 0 0 0-2.6-3.3" />
                                </MetaIcon>
                                Peserta
                            </span>
                            <span className="fact__value">
                                {audience}
                                <span>Perwakilan sekolah</span>
                            </span>
                        </div>
                        <div className="fact">
                            <span className="fact__label">
                                <MetaIcon>
                                    <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h12a2.5 2.5 0 0 1 2.5 2.5v1a2.5 2.5 0 0 0 0 5v1A2.5 2.5 0 0 1 18 18H6a2.5 2.5 0 0 1-2.5-2.5v-1a2.5 2.5 0 0 0 0-5Z" />
                                    <path d="M12 8v8" strokeDasharray="2.5 2.5" />
                                </MetaIcon>
                                Biaya
                            </span>
                            <span className="fact__value">
                                Gratis
                                <span>{site?.prize_note ?? 'Total hadiah puluhan juta rupiah'}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============ TENTANG SINGKAT ============ */}
            <section className="section" id="tentang">
                <div className="container grid-2">
                    <div>
                        <span className="eyebrow">Tentang festival</span>
                        <h2 className="h2 reveal">Satu panggung untuk pelajar yang bertumbuh.</h2>
                        <div className="prose reveal" style={{ '--d': '80ms' }}>
                            <p>
                                Festival Pelajar Muslim (FPM) adalah gelaran tahunan {school} yang
                                mempertemukan pelajar {audienceShort} untuk berlomba, belajar, dan saling
                                mengenal. Edisi XII digelar {site?.tagline ?? occasion}.
                            </p>
                            <p>
                                Setiap cabang dirancang bukan hanya untuk mencari juara, tetapi untuk melatih
                                keberanian tampil, ketelitian berkarya, dan adab dalam berkompetisi.
                            </p>
                        </div>

                        <div className="stack-sm reveal" style={{ '--d': '140ms', marginTop: '30px' }}>
                            <div className="point">
                                <span className="point__num">01</span>
                                <div>
                                    <h3 className="h3">Beradab</h3>
                                    <p>Menang atau kalah, peserta tetap menjaga adab dan sportivitas.</p>
                                </div>
                            </div>
                            <div className="point">
                                <span className="point__num">02</span>
                                <div>
                                    <h3 className="h3">Berkarya</h3>
                                    <p>Cabang seni dan akademik menjadi ruang menampilkan karya terbaik.</p>
                                </div>
                            </div>
                            <div className="point">
                                <span className="point__num">03</span>
                                <div>
                                    <h3 className="h3">Bersama</h3>
                                    <p>Festival mempertemukan sekolah-sekolah dalam satu suasana kekeluargaan.</p>
                                </div>
                            </div>
                        </div>

                        <p style={{ marginTop: '28px' }}>
                            <Link className="link-more" href="/lomba">
                                Lihat cabang &amp; ketentuan
                                <ArrowIcon />
                            </Link>
                        </p>
                    </div>

                    <div className="reveal" style={{ '--d': '120ms' }}>
                        <div className="photo photo--arch" role="img" aria-label={`Logo ${eventName}`}>
                            <img
                                src="/branding/logo-mark.png"
                                alt=""
                                style={{ width: 'min(58%, 190px)', height: 'auto', margin: '0 auto 4px' }}
                            />
                            <span className="photo__label">{eventName}</span>
                            <span className="photo__note">
                                {openCompetitions} cabang dibuka · {remainingQuota} kuota tersisa
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ CABANG LOMBA ============ */}
            <section className="section section--paper" id="lomba">
                <div className="container">
                    <div className="section-head">
                        <div>
                            <span className="eyebrow">Cabang lomba</span>
                            <h2 className="h2">Pilih medan kompetisimu.</h2>
                            <p className="lead">
                                {competitions.length > 0
                                    ? `${totalCompetitions} cabang diperlombakan pada edisi ini untuk ${audienceShort}. Ketentuan lengkap tiap cabang tersedia di halaman lomba.`
                                    : 'Panitia belum menetapkan cabang lomba pada edisi ini.'}
                            </p>
                        </div>
                        <Link className="link-more" href="/lomba">
                            Semua cabang &amp; ketentuan
                            <ArrowIcon />
                        </Link>
                    </div>

                    {featured.length === 0 ? (
                        <div className="empty-state">Belum ada cabang lomba yang dipublikasikan.</div>
                    ) : (
                        <div className="cards">
                            {featured.map((c, i) => {
                                const closed = !c.is_open || c.is_full;

                                return (
                                    <article className="lomba-card reveal" key={c.id} style={{ '--d': `${i * 60}ms` }}>
                                        <div className="lomba-card__top">
                                            <span className="lomba-card__num">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <span className={`badge ${closed ? 'badge--closed' : 'badge--open'}`}>
                                                {!c.is_open ? 'Ditutup' : c.is_full ? 'Kuota penuh' : 'Buka'}
                                            </span>
                                        </div>

                                        <h3>{c.name}</h3>
                                        <p className="lomba-card__meta">
                                            {c.category_type === 'group' ? 'Kelompok' : 'Individu'}
                                            {c.gender_mode === 'separate' ? ' · Putra & Putri' : ''}
                                        </p>
                                        <p>{c.description ?? 'Panitia belum menambahkan deskripsi cabang ini.'}</p>

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
                </div>
            </section>

            {/* ============ TIMELINE KEGIATAN ============ */}
            <section className="section" id="jadwal">
                <div className="container grid-2">
                    <div>
                        <span className="eyebrow">Timeline kegiatan</span>
                        <h2 className="h2">Tiga tanggal yang perlu dicatat.</h2>
                        <p className="lead" style={{ marginTop: '14px' }}>
                            Pendaftaran dibuka daring, dilanjutkan technical meeting, lalu pelaksanaan
                            lomba di {venue.name}.
                        </p>
                        <p style={{ marginTop: '22px' }}>
                            <Link className="link-more" href={primaryHref}>
                                {isAdmin ? 'Buka dashboard' : user ? 'Daftar sekarang' : 'Klaim akun sekolah'}
                                <ArrowIcon />
                            </Link>
                        </p>
                    </div>

                    <ol className="timeline">
                        <li className="reveal" data-status="now">
                            <span className="timeline__date">Pendaftaran online</span>
                            <h3>{registration.window_label}</h3>
                            <p>
                                Dibuka {registration.start_label} sampai {registration.end_label} melalui
                                akun sekolah.
                            </p>
                        </li>
                        <li className="reveal" style={{ '--d': '80ms' }}>
                            <span className="timeline__date">Technical meeting</span>
                            <h3>{technicalMeeting.label}</h3>
                            <p>Pertemuan teknis peserta dan guru pendamping di {venue.name}.</p>
                        </li>
                        <li className="reveal" style={{ '--d': '160ms' }}>
                            <span className="timeline__date">Pelaksanaan</span>
                            <h3>{eventDate.label}</h3>
                            <p>
                                {venue.name}, {venue.address}.
                            </p>
                        </li>
                    </ol>
                </div>
            </section>

            {/* ============ ALUR ============ */}
            <section className="section" id="alur">
                <div className="container">
                    <div className="section-head">
                        <div>
                            <span className="eyebrow">Alur pendaftaran</span>
                            <h2 className="h2">Dari klaim akun sampai piagam.</h2>
                            <p className="lead">
                                Empat tahap utama. Semua dilakukan daring melalui akun sekolah, tanpa perlu
                                mengambil formulir ke sekolah.
                            </p>
                        </div>
                        <Link className="link-more" href={primaryHref}>
                            {isAdmin ? 'Buka dashboard' : user ? 'Mulai dari sini' : 'Klaim akun sekolah'}
                            <ArrowIcon />
                        </Link>
                    </div>

                    <ol className="steps">
                        <li className="reveal">
                            <span className="steps__date">Langkah 1</span>
                            <h3>Klaim akun sekolah</h3>
                            <p>Masukkan NPSN 8 digit, lalu lengkapi data penanggung jawab dan kata sandi.</p>
                        </li>
                        <li className="reveal" style={{ '--d': '70ms' }}>
                            <span className="steps__date">Langkah 2</span>
                            <h3>Isi data peserta</h3>
                            <p>Pilih cabang lomba, isi NISN dan nama peserta sesuai daftar sekolah.</p>
                        </li>
                        <li className="reveal" style={{ '--d': '140ms' }}>
                            <span className="steps__date">Langkah 3</span>
                            <h3>Unggah surat rekomendasi</h3>
                            <p>Surat resmi sekolah diperiksa otomatis, lalu diverifikasi panitia.</p>
                        </li>
                        <li className="reveal" style={{ '--d': '210ms' }}>
                            <span className="steps__date">Langkah 4</span>
                            <h3>Unduh sertifikat</h3>
                            <p>Setelah nilai dipublikasikan, sertifikat peserta dan piagam juara bisa diunduh.</p>
                        </li>
                    </ol>
                </div>
            </section>

            {/* ============ FAQ ============ */}
            <section className="section" id="faq">
                <div className="container grid-2">
                    <div>
                        <span className="eyebrow">Pertanyaan umum</span>
                        <h2 className="h2">Sebelum kamu mendaftar.</h2>
                        <p className="lead" style={{ marginTop: '14px' }}>
                            Enam pertanyaan yang paling sering ditanyakan peserta. Masih ada yang ingin
                            ditanyakan? Hubungi panitia di {site?.contacts?.[0]?.phone ?? 'kontak resmi'}.
                        </p>
                        <p style={{ marginTop: '22px' }}>
                            <Link className="link-more" href={user ? '/dashboard' : '/login'}>
                                {user ? 'Buka dashboard' : 'Masuk ke akun sekolah'}
                                <ArrowIcon />
                            </Link>
                        </p>
                    </div>

                    <div className="accordion">
                        {FAQ.map((item, i) => (
                            <details key={item.q} open={i === 0}>
                                <summary>{item.q}</summary>
                                <div className="answer">
                                    <p>{item.a}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ CTA ============ */}
            <section className="section section--tight">
                <div className="container">
                    <div className="cta-band reveal">
                        <div>
                            <h2>Siap jadi bagian FPM {edition}?</h2>
                            <p>
                                Klaim akun sekolahmu, lengkapi data peserta, dan tunggu konfirmasi dari
                                panitia. Pendaftaran ditutup {registration.end_label}.
                            </p>
                        </div>
                        <div className="btn-row">
                            <Link className="btn btn--gold" href={primaryHref}>
                                {isAdmin ? 'Buka dashboard' : user ? 'Mulai pendaftaran' : 'Klaim akun sekolah'}
                                <ArrowIcon />
                            </Link>
                            <Link className="btn btn--ghost-light" href="/lomba">
                                Tanya cabang dulu
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </GuestLayout>
    );
}
