import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

const ICON = {
    list: 'M8.25 6.75h10.5M8.25 12h10.5M8.25 17.25h10.5M3.75 6.75h.008v.008H3.75V6.75zm0 5.25h.008v.008H3.75V12zm0 5.25h.008v.008H3.75v-.008z',
    clock: 'M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z',
    check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    flag: 'M3 3v18m0-13.5h9.75l1.5 3h6v9h-6l-1.5-3H3',
    trophy: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
    school: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
    certificate: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
    arrow: 'M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25',
};

function Icon({ name, className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ICON[name]} />
        </svg>
    );
}

function greeting() {
    const hour = new Date().getHours();

    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';

    return 'Selamat malam';
}

function StatCard({ label, value, hint, icon = 'list', tone = '' }) {
    return (
        <div className="stat-card">
            <div className="stat-card__top">
                <span className="stat-card__label">{label}</span>
                <span className={`stat-card__icon${tone ? ` stat-card__icon--${tone}` : ''}`} aria-hidden="true">
                    <Icon name={icon} />
                </span>
            </div>
            <span className="stat-card__value">{value}</span>
            {hint && <span className="stat-card__hint">{hint}</span>}
        </div>
    );
}

export default function AdminDashboard({ stats }) {
    const { auth, event, site } = usePage().props;
    const s = stats ?? {};
    const perCompetition = s.per_competition ?? [];
    const total = Number(s.total_registrations ?? 0);
    const pending = Number(s.pending_count ?? 0);
    const approved = Number(s.approved_count ?? 0);
    const openBranches = perCompetition.filter((c) => Number(c.remaining_global) > 0).length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const firstName = (auth?.user?.name ?? 'Panitia').trim().split(/\s+/)[0];
    const eventName = event?.event_name ?? 'Festival Pelajar Muslim';
    const year = event?.year;

    return (
        <AppLayout title="Dashboard Panitia">
            <Head title="Dashboard Panitia" />

            <section className="dash-hero">
                <div className="dash-hero__grid">
                    <div>
                        <span className="dash-hero__eyebrow">{site?.occasion_short ?? 'FPM XII'} · Panitia</span>
                        <h2 className="dash-hero__title">
                            {greeting()}, {firstName}
                        </h2>
                        <p className="dash-hero__lead">
                            {eventName}
                            {year ? ` ${year}` : ''} — pantau verifikasi pendaftaran, sisa kuota cabang, dan
                            kesiapan penilaian dari satu tempat.
                        </p>

                        <div className="dash-hero__actions">
                            <Link href="/admin/pendaftaran?status=pending" className="btn btn--gold">
                                Verifikasi pendaftaran
                                {pending > 0 ? ` (${pending})` : ''}
                                <Icon name="arrow" className="h-4 w-4" />
                            </Link>
                            <Link href="/admin/nilai" className="dash-hero__ghost">
                                Input nilai
                            </Link>
                        </div>

                        {site && (
                            <div className="dash-hero__meta">
                                <span className="dash-chip">
                                    <span>Pendaftaran</span>
                                    <strong>{site.registration?.window_label}</strong>
                                </span>
                                <span className="dash-chip">
                                    <span>Technical meeting</span>
                                    <strong>{site.technical_meeting?.label}</strong>
                                </span>
                                <span className="dash-chip">
                                    <span>Pelaksanaan</span>
                                    <strong>{site.event_date?.label}</strong>
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="dash-spotlight">
                        <p className="dash-spotlight__label">Menunggu verifikasi</p>
                        <p className="dash-spotlight__num">{pending}</p>
                        <p className="dash-spotlight__hint">
                            {pending > 0 ? 'Perlu ditinjau panitia' : 'Semua sudah ditinjau'}
                        </p>
                    </div>
                </div>
            </section>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total pendaftaran" value={total} hint="Seluruh status" icon="list" />
                <StatCard
                    label="Menunggu verifikasi"
                    value={pending}
                    hint={pending > 0 ? 'Butuh tindakan' : 'Bersih'}
                    icon="clock"
                    tone="amber"
                />
                <StatCard
                    label="Disetujui"
                    value={approved}
                    hint={`${approvalRate}% dari total`}
                    icon="check"
                    tone="gold"
                />
                <StatCard
                    label="Cabang lomba"
                    value={perCompetition.length}
                    hint={`${openBranches} masih terbuka`}
                    icon="flag"
                />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <section className="panel panel--flush lg:col-span-2">
                    <div className="panel__head">
                        <div>
                            <h3 className="panel__title">Kuota per cabang</h3>
                            <p className="page-sub">Terpakai dari kuota global tiap cabang lomba.</p>
                        </div>
                        <Link href="/admin/lomba" className="admin-link-soft">
                            Kelola cabang
                        </Link>
                    </div>

                    {perCompetition.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <p className="text-sm text-slate-500">Belum ada cabang lomba pada event aktif.</p>
                            <Link href="/admin/lomba" className="btn btn--dark btn--sm mt-4 inline-flex">
                                Tambah cabang lomba
                            </Link>
                        </div>
                    ) : (
                        perCompetition.map((c) => {
                            const quota = Number(c.global_quota ?? 0);
                            const used = Number(c.approved_count ?? 0);
                            const remaining = Number(c.remaining_global ?? 0);
                            const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
                            const full = remaining <= 0;

                            return (
                                <div className="quota-row" key={c.id}>
                                    <div className="quota-row__head">
                                        <div className="min-w-0">
                                            <p className="quota-row__name truncate">{c.name}</p>
                                            <p className="quota-row__meta">
                                                {c.category_type === 'group' ? 'Beregu' : 'Individu'} · kuota {quota}
                                                {c.gender_mode === 'separate'
                                                    ? ` · L ${c.approved_putra ?? 0} / P ${c.approved_putri ?? 0}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <span className={`quota-pill${full ? ' is-full' : ''}`}>
                                            {full ? 'Penuh' : `Sisa ${remaining}`}
                                        </span>
                                    </div>
                                    <div className={`quota-bar${full ? ' is-full' : ''}`}>
                                        <span style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="quota-row__meta">
                                        {used} terpakai · {pct}% dari kuota
                                    </p>
                                </div>
                            );
                        })
                    )}
                </section>

                <aside className="grid content-start gap-4">
                    <section className="panel panel--pad">
                        <h3 className="panel__title">Aksi cepat</h3>
                        <div className="quick-grid mt-3">
                            <Link href="/admin/pendaftaran" className="quick-link">
                                <Icon name="list" /> Verifikasi
                            </Link>
                            <Link href="/admin/nilai" className="quick-link">
                                <Icon name="trophy" /> Penilaian
                            </Link>
                            <Link href="/admin/sekolah" className="quick-link">
                                <Icon name="school" /> Sekolah
                            </Link>
                            <Link href="/admin/sertifikat" className="quick-link">
                                <Icon name="certificate" /> Sertifikat
                            </Link>
                        </div>

                        <div className="flow">
                            <div className="flow__item">
                                <span className="flow__num">1</span>
                                <span className="flow__text">
                                    <strong>Sekolah klaim NPSN</strong>
                                    Akun operator dibuat dari halaman klaim publik.
                                </span>
                            </div>
                            <div className="flow__item">
                                <span className="flow__num">2</span>
                                <span className="flow__text">
                                    <strong>Panitia verifikasi</strong>
                                    Periksa berkas lalu setujui atau tolak dengan alasan.
                                </span>
                            </div>
                            <div className="flow__item">
                                <span className="flow__num">3</span>
                                <span className="flow__text">
                                    <strong>Juri menilai</strong>
                                    Nilai masuk per cabang dan bisa dipublikasikan.
                                </span>
                            </div>
                            <div className="flow__item">
                                <span className="flow__num">4</span>
                                <span className="flow__text">
                                    <strong>Sertifikat terbit</strong>
                                    Unduh dibuka setelah nilai final.
                                </span>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </AppLayout>
    );
}
