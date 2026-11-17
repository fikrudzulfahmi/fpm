import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import StatusBadge, { DocumentStatusBadge } from '../../Components/StatusBadge';
import { formatDate } from '../../lib/format';

function Stat({ label, value, hint }) {
    return (
        <div className="stat-card">
            <span className="stat-card__label">{label}</span>
            <span className="stat-card__value">{value}</span>
            {hint && <span className="stat-card__hint">{hint}</span>}
        </div>
    );
}

function RegistrationCard({ registration, enableCertificates, publishScores }) {
    const { id, display_name, status, ai_status, rejection_reason, competition, participants, score, gender_label } =
        registration;

    const isApproved = status === 'approved';
    const canDownload = enableCertificates && isApproved;

    return (
        <article className="panel panel--pad">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {competition?.name ?? 'Lomba'}
                        {competition?.category_type === 'group' ? ' · Beregu' : ' · Individu'}
                        {competition?.gender_mode === 'separate' && gender_label ? ` · ${gender_label}` : ''}
                    </p>
                    <h3 className="mt-0.5 truncate text-lg font-bold text-slate-900">{display_name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={status} />
                    <DocumentStatusBadge status={ai_status} />
                </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                    <p className="text-xs text-slate-400">Peserta</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
                        {(participants ?? []).map((p) => (
                            <li key={p.nisn} className="truncate">
                                {p.full_name}
                                <span className="ml-1 text-xs text-slate-400">
                                    {p.gender === 'L' ? 'L' : 'P'} · {p.nisn}
                                </span>
                            </li>
                        ))}
                        {(!participants || participants.length === 0) && <li className="text-slate-400">-</li>}
                    </ul>
                </div>

                <div>
                    <p className="text-xs text-slate-400">Nilai & Peringkat</p>
                    {publishScores && score ? (
                        <p className="mt-1 text-sm text-slate-700">
                            <span className="font-semibold">{score.score_value ?? '-'}</span>
                            {score.rank ? (
                                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                    #{score.rank}
                                </span>
                            ) : (
                                <span className="ml-2 text-xs text-slate-400">peringkat belum ada</span>
                            )}
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-slate-400">
                            {publishScores ? 'Belum dinilai' : 'Belum dipublikasikan'}
                        </p>
                    )}
                </div>

                <div>
                    <p className="text-xs text-slate-400">Didaftarkan</p>
                    <p className="mt-1 text-sm text-slate-700">{formatDate(registration.created_at)}</p>
                </div>
            </div>

            {status === 'rejected' && rejection_reason && (
                <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <span className="font-semibold">Alasan ditolak: </span>
                    {rejection_reason}
                </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <Link
                    href={`/pendaftaran/${id}`}
                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                    Lihat Detail
                </Link>

                {canDownload ? (
                    <a
                        href={`/sertifikat/${id}`}
                        className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                        style={{ backgroundColor: 'var(--secondary-color, #f3d95b)' }}
                    >
                        Unduh Sertifikat
                    </a>
                ) : (
                    enableCertificates &&
                    !isApproved && (
                        <span className="text-xs text-slate-400">Sertifikat tersedia setelah disetujui.</span>
                    )
                )}

                {!enableCertificates && <span className="text-xs text-slate-400">Sertifikat belum dibuka panitia.</span>}
            </div>
        </article>
    );
}

export default function SchoolDashboard({ registrations = [], enable_certificates, publish_scores }) {
    const { auth, site } = usePage().props;
    const school = auth?.user?.school;

    const total = registrations.length;
    const approved = registrations.filter((r) => r.status === 'approved').length;
    const pending = registrations.filter((r) => r.status === 'pending').length;

    return (
        <AppLayout title="Dashboard Sekolah">
            <Head title="Dashboard Sekolah" />

            <section className="dash-hero">
                <div className="dash-hero__grid">
                    <div>
                        <span className="dash-hero__eyebrow">Akun sekolah · FPM XII</span>
                        <h2 className="dash-hero__title">{school?.school_name ?? 'Sekolah Anda'}</h2>
                        <p className="dash-hero__lead">
                            {site?.registration?.window_label
                                ? `Pendaftaran peserta dibuka ${site.registration.window_label}.`
                                : 'Kelola pendaftaran peserta sekolah Anda di satu tempat.'}
                        </p>

                        <div className="dash-hero__actions">
                            <Link href="/daftar" className="btn btn--gold">
                                Daftarkan peserta
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </Link>
                            <Link href="/lomba" className="dash-hero__ghost">
                                Lihat cabang lomba
                            </Link>
                        </div>

                        {site && (
                            <div className="dash-hero__meta">
                                {school?.npsn && (
                                    <span className="dash-chip">
                                        <span>NPSN</span>
                                        <strong>{school.npsn}</strong>
                                    </span>
                                )}
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
                        <p className="dash-spotlight__label">Pendaftaran Anda</p>
                        <p className="dash-spotlight__num">{total}</p>
                        <p className="dash-spotlight__hint">
                            {approved} disetujui · {pending} menunggu
                        </p>
                    </div>
                </div>
            </section>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Stat label="Total" value={total} hint="Semua peserta" />
                <Stat label="Disetujui" value={approved} hint="Siap bertanding" />
                <Stat label="Menunggu" value={pending} hint="Belum diverifikasi" />
            </div>

            {total === 0 ? (
                <div className="empty-state mt-4">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Belum ada pendaftaran</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                        Daftarkan peserta pertama sekolah Anda. Siapkan surat rekomendasi kepala sekolah dalam bentuk PDF
                        atau foto.
                    </p>
                    <Link
                        href="/daftar"
                        className="mt-5 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                        style={{ backgroundColor: 'var(--primary-color, #064b3d)' }}
                    >
                        Daftar Sekarang
                    </Link>
                </div>
            ) : (
                <div className="mt-6 space-y-4">
                    {registrations.map((registration) => (
                        <RegistrationCard
                            key={registration.id}
                            registration={registration}
                            enableCertificates={Boolean(enable_certificates)}
                            publishScores={Boolean(publish_scores)}
                        />
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
