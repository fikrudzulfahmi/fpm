import { Head, Link, usePage } from '@inertiajs/react';
import GuestLayout from '../../Layouts/GuestLayout';

const categoryLabel = {
    individual: 'Individu',
    group: 'Kelompok',
};

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}

function statusOf(c) {
    if (!c.is_open) return { label: 'Pendaftaran ditutup', tone: 'badge--closed' };
    if (c.is_full) return { label: 'Kuota penuh', tone: 'badge--closed' };
    return { label: 'Pendaftaran dibuka', tone: 'badge--open' };
}

export default function LombaShow({ event_info, competition }) {
    const { auth, site } = usePage().props;
    const user = auth?.user ?? null;

    const eventName = event_info?.event_name ?? 'Festival Pelajar Muslim XII';
    const eventDate = site?.event_date ?? { label: 'Sabtu, 30 Januari 2027' };
    const venue = site?.venue ?? { name: 'SMKS Islam 1 Kota Blitar', address: 'Jl. Musi No. 6, Blitar 66117' };
    const s = statusOf(competition);
    const primaryHref = user ? '/daftar' : '/klaim';
    const isGroup = competition.category_type === 'group';
    const usedPct =
        competition.global_quota > 0
            ? Math.min(100, Math.round((competition.used_quota / competition.global_quota) * 100))
            : 0;
    const fillTone =
        competition.remaining_quota === 0
            ? ' quota__fill--full'
            : competition.remaining_quota <= Math.max(1, Math.round(competition.global_quota * 0.15))
              ? ' quota__fill--low'
              : '';

    return (
        <GuestLayout title={competition.name}>
            <Head title={competition.name} />

            <section className="page-head">
                <div className="container page-head__inner">
                    <ol className="crumbs">
                        <li>
                            <Link href="/">Beranda</Link>
                        </li>
                        <li>
                            <Link href="/lomba">Lomba</Link>
                        </li>
                        <li aria-current="page">{competition.name}</li>
                    </ol>
                    <span className="eyebrow eyebrow--gold">
                        {categoryLabel[competition.category_type] ?? competition.category_type}
                        {competition.gender_mode === 'separate' ? ' · Putra & Putri' : ''}
                    </span>
                    <h1>{competition.name}</h1>
                    <p>{competition.description ?? `${eventName} — ketentuan cabang lomba.`}</p>
                </div>
            </section>

            <section className="section">
                <div className="container detail-grid">
                    <div>
                        <div className="prose">
                            <p>
                                {competition.description ??
                                    'Panitia belum menambahkan deskripsi untuk cabang ini. Silakan hubungi panitia untuk informasi lebih lanjut.'}
                            </p>
                        </div>

                        <div className="stat-grid" style={{ marginTop: '26px' }}>
                            <div className="stat">
                                <span className="stat__label">Kuota global</span>
                                <span className="stat__value">{competition.global_quota}</span>
                                <span className="stat__note">
                                    {competition.gender_mode === 'separate'
                                        ? 'per kategori Putra/Putri'
                                        : 'seluruh peserta'}
                                </span>
                            </div>
                            <div className="stat">
                                <span className="stat__label">Terpakai</span>
                                <span className="stat__value">{competition.used_quota}</span>
                                <span className="stat__note">
                                    {competition.gender_mode === 'separate'
                                        ? `Putra ${competition.used_putra ?? 0} · Putri ${competition.used_putri ?? 0}`
                                        : 'menunggu verifikasi + disetujui'}
                                </span>
                            </div>
                            <div className="stat">
                                <span className="stat__label">Tersisa</span>
                                <span className="stat__value is-free">{competition.remaining_quota}</span>
                                <span className="stat__note">slot pendaftaran</span>
                            </div>
                        </div>

                        <div className="quota" style={{ marginTop: '18px' }}>
                            <div className="quota__bar">
                                <div className={`quota__fill${fillTone}`} style={{ width: `${usedPct}%` }} />
                            </div>
                        </div>

                        {isGroup && competition.min_group_members && (
                            <div className="form-note" style={{ marginTop: '26px' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 11v5M12 8h.01" />
                                </svg>
                                <span>
                                    Lomba kelompok: satu tim terdiri dari{' '}
                                    <strong>{competition.min_group_members}</strong>
                                    {competition.max_group_members &&
                                    competition.max_group_members !== competition.min_group_members
                                        ? ` hingga ${competition.max_group_members}`
                                        : ''}{' '}
                                    siswa dari sekolah yang sama.
                                </span>
                            </div>
                        )}

                        <div style={{ marginTop: '34px' }}>
                            <p className="section-title-sm">Ketentuan ringkas</p>
                            <div className="accordion accordion--tight">
                                <details open>
                                    <summary>Format peserta</summary>
                                    <div className="answer">
                                        <p>
                                            {isGroup
                                                ? 'Lomba beregu: satu pendaftaran mewakili satu tim. Nama tim, guru pendamping, dan seluruh anggota diisi pada formulir.'
                                                : 'Lomba individu: satu pendaftaran untuk satu peserta. Setiap siswa hanya boleh terdaftar pada satu cabang lomba per edisi.'}
                                        </p>
                                    </div>
                                </details>
                                <details>
                                    <summary>Berkas yang disiapkan</summary>
                                    <div className="answer">
                                        <p>
                                            Surat rekomendasi resmi sekolah (JPG, PNG, atau PDF maksimal 5 MB)
                                            yang memuat nama atau NISN peserta. Berkas diperiksa otomatis, lalu
                                            diverifikasi panitia.
                                        </p>
                                    </div>
                                </details>
                                <details>
                                    <summary>Kuota dan kategori</summary>
                                    <div className="answer">
                                        <p>
                                            Kuota dihitung dari pendaftaran yang menunggu verifikasi dan yang
                                            sudah disetujui.
                                            {competition.gender_mode === 'separate'
                                                ? ' Kategori Putra dan Putri memiliki kuota terpisah.'
                                                : ' Kuota berlaku untuk seluruh peserta cabang ini.'}
                                        </p>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>

                    <aside className="side-card">
                        <span className={`badge ${s.tone}`}>{s.label}</span>
                        <h2>Daftarkan peserta</h2>
                        <p className="small">
                            {user
                                ? 'Anda sudah masuk. Lanjutkan ke formulir pendaftaran untuk memilih cabang ini.'
                                : 'Pendaftaran dilakukan oleh sekolah. Klaim akun sekolah dengan NPSN terlebih dahulu.'}
                        </p>

                        <Link
                            className="btn btn--gold"
                            href={user ? '/daftar' : '/klaim'}
                        >
                            {user ? 'Daftar cabang ini' : 'Klaim akun sekolah'}
                            <ArrowIcon />
                        </Link>

                        <ul className="info-list">
                            <li>
                                <span className="info-list__label">Format</span>
                                <span className="info-list__value">
                                    {categoryLabel[competition.category_type] ?? competition.category_type}
                                </span>
                            </li>
                            <li>
                                <span className="info-list__label">Kategori gender</span>
                                <span className="info-list__value">
                                    {competition.gender_mode === 'separate' ? 'Putra & Putri' : 'Campuran'}
                                </span>
                            </li>
                            {isGroup && competition.min_group_members && (
                                <li>
                                    <span className="info-list__label">Anggota per tim</span>
                                    <span className="info-list__value">
                                        {competition.min_group_members}
                                        {competition.max_group_members &&
                                        competition.max_group_members !== competition.min_group_members
                                            ? `–${competition.max_group_members}`
                                            : ''}{' '}
                                        siswa
                                    </span>
                                </li>
                            )}
                            <li>
                                <span className="info-list__label">Pelaksanaan</span>
                                <span className="info-list__value">{eventDate.label}</span>
                            </li>
                            <li>
                                <span className="info-list__label">Tempat</span>
                                <span className="info-list__value">{venue.name}</span>
                            </li>
                            <li>
                                <span className="info-list__label">Kuota tersisa</span>
                                <span className="info-list__value">
                                    {competition.remaining_quota} dari {competition.global_quota}
                                </span>
                            </li>
                        </ul>

                        <p className="small" style={{ borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                            Pendaftaran tidak dipungut biaya.
                        </p>

                        <Link className="link-more" href="/lomba">
                            Kembali ke daftar lomba
                        </Link>
                    </aside>
                </div>
            </section>
        </GuestLayout>
    );
}
