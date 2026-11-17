import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import StatusBadge, { AiStatusBadge } from '../../Components/StatusBadge';
import { formatDate, formatDateTime } from '../../lib/format';

function Info({ label, children }) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-slate-800">{children ?? '-'}</dd>
        </div>
    );
}

export default function RegistrationDetail({ registration, enable_certificates, publish_scores }) {
    const r = registration ?? {};
    const participants = r.participants ?? [];
    const isApproved = r.status === 'approved';

    return (
        <AppLayout title="Detail Pendaftaran">
            <Head title={`Pendaftaran #${r.id}`} />

            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                        ← Kembali ke dashboard
                    </Link>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {r.competition?.name ?? 'Lomba'}
                        {r.group_name ? ` — ${r.group_name}` : ''}
                    </h2>
                    <p className="text-sm text-slate-500">
                        Kode pendaftaran #{r.id} · didaftarkan {formatDate(r.created_at)}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <AiStatusBadge status={r.ai_status} />
                </div>
            </div>

            {r.status === 'rejected' && r.rejection_reason && (
                <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm font-semibold text-rose-900">Pendaftaran ditolak</p>
                    <p className="mt-1 text-sm text-rose-800">{r.rejection_reason}</p>
                </div>
            )}

            <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                    <section className="panel panel--pad">
                        <h3 className="panel__title mb-3">Data Peserta</h3>

                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                                        <th className="py-2 pr-3 font-semibold">#</th>
                                        <th className="py-2 pr-3 font-semibold">NISN</th>
                                        <th className="py-2 pr-3 font-semibold">Nama</th>
                                        <th className="py-2 pr-3 font-semibold">L/P</th>
                                        <th className="py-2 font-semibold">Tanggal Lahir</th>
                                    </tr>
                                </thead>
                                <tbody className="data-table__body">
                                    {participants.map((p, i) => (
                                        <tr key={p.id ?? p.nisn}>
                                            <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
                                            <td className="py-2 pr-3 font-mono text-xs text-slate-600">{p.nisn}</td>
                                            <td className="py-2 pr-3 font-medium text-slate-900">{p.full_name}</td>
                                            <td className="py-2 pr-3 text-slate-600">{p.gender}</td>
                                            <td className="py-2 text-slate-600">
                                                {p.birth_date ? formatDate(p.birth_date) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {participants.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center text-slate-400">
                                                Tidak ada data peserta.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="panel panel--pad">
                        <h3 className="panel__title mb-3">
                            Hasil Verifikasi AI
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                            <AiStatusBadge status={r.ai_status} />
                            {r.verified_at && (
                                <span className="text-xs text-slate-500">
                                    dicek {formatDateTime(r.verified_at)}
                                </span>
                            )}
                        </div>
                        <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {r.ai_notes || 'Belum ada catatan dari verifikasi AI.'}
                        </p>
                    </section>
                </div>

                <div className="space-y-5">
                    <section className="panel panel--pad">
                        <h3 className="panel__title mb-3">Rincian</h3>
                        <dl className="space-y-3">
                            <Info label="Sekolah">
                                {r.school?.school_name}
                                {r.school?.npsn ? ` (${r.school.npsn})` : ''}
                            </Info>
                            <Info label="Cabang Lomba">
                                {r.competition?.name}
                                <span className="ml-1 text-xs text-slate-500">
                                    {r.competition?.category_type === 'group' ? '· beregu' : '· individu'}
                                </span>
                            </Info>
                            {r.group_name && <Info label="Nama Grup">{r.group_name}</Info>}
                            <Info label="Pendamping">{r.companion_name}</Info>
                            <Info label="WhatsApp">{r.companion_phone}</Info>
                            <Info label="Surat Rekomendasi">
                                {r.has_letter ? (
                                    <a
                                        href={`/pendaftaran/${r.id}/surat`}
                                        target="_blank"
                                        rel="noopener"
                                        className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800"
                                    >
                                        Lihat surat
                                    </a>
                                ) : (
                                    <span className="text-rose-600">Belum ada</span>
                                )}
                            </Info>
                            <Info label="Event">
                                {r.event?.event_name}
                                {r.event?.year ? ` ${r.event.year}` : ''}
                            </Info>
                        </dl>
                    </section>

                    <section className="panel panel--pad">
                        <h3 className="panel__title mb-3">Nilai</h3>

                        {publish_scores ? (
                            r.score ? (
                                <div className="flex items-end gap-4">
                                    <div>
                                        <p className="text-xs text-slate-400">Nilai</p>
                                        <p className="text-3xl font-black text-slate-900">
                                            {r.score.score_value ?? '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Peringkat</p>
                                        <p className="text-2xl font-bold text-slate-700">
                                            {r.score.rank ? `#${r.score.rank}` : '-'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Belum ada nilai.</p>
                            )
                        ) : (
                            <p className="text-sm text-slate-500">Nilai belum dipublikasikan panitia.</p>
                        )}
                    </section>

                    <section className="panel panel--pad">
                        <h3 className="panel__title mb-3">Sertifikat</h3>

                        {enable_certificates ? (
                            isApproved ? (
                                <a
                                    href={`/sertifikat/${r.id}`}
                                    className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                                    style={{ backgroundColor: 'var(--secondary-color, #f3d95b)' }}
                                >
                                    Unduh Sertifikat
                                </a>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    Sertifikat hanya tersedia untuk pendaftaran yang disetujui.
                                </p>
                            )
                        ) : (
                            <p className="text-sm text-slate-500">Sertifikat belum dibuka panitia.</p>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
