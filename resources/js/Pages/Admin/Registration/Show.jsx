import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import StatusBadge, { DocumentStatusBadge } from '../../../Components/StatusBadge';
import Modal from '../../../Components/Modal';
import { formatDate, formatDateTime, waLink } from '../../../lib/format';

function Info({ label, children }) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-slate-800">{children ?? '-'}</dd>
        </div>
    );
}

export default function RegistrationShow({ registration }) {
    const r = registration ?? {};
    const participants = r.participants ?? [];
    const [rejectOpen, setRejectOpen] = useState(false);

    const approveForm = useForm({});
    const rejectForm = useForm({ rejection_reason: '' });
    const reverifyForm = useForm({});

    const doApprove = () => approveForm.post(`/admin/pendaftaran/${r.id}/setujui`, { preserveScroll: true });
    const doReverify = () => reverifyForm.post(`/admin/pendaftaran/${r.id}/verifikasi-ulang`, { preserveScroll: true });

    const doReject = (e) => {
        e.preventDefault();
        rejectForm.post(`/admin/pendaftaran/${r.id}/tolak`, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectOpen(false);
                rejectForm.reset();
            },
        });
    };

    const wa = waLink(r.companion_phone);
    const decided = r.status === 'approved' || r.status === 'rejected';

    return (
        <AppLayout title="Tinjau Pendaftaran">
            <Head title={`Pendaftaran #${r.id}`} />

            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link href="/admin/pendaftaran" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                        ← Semua pendaftaran
                    </Link>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">{r.display_name}</h2>
                    <p className="text-sm text-slate-500">
                        #{r.id} · {r.competition?.name ?? '-'}
                        {r.group_name ? ` · grup ${r.group_name}` : ''} · masuk {formatDate(r.created_at)}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <DocumentStatusBadge status={r.ai_status} />
                </div>
            </div>

            {r.rejection_reason && (
                <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <span className="font-semibold">Alasan penolakan: </span>
                    {r.rejection_reason}
                </div>
            )}

            <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                    <section className="panel panel--pad">
                        <h3 className="panel__title mb-3">Peserta</h3>
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                                        <th className="py-2 pr-3 font-semibold">#</th>
                                        <th className="py-2 pr-3 font-semibold">NISN</th>
                                        <th className="py-2 pr-3 font-semibold">Nama</th>
                                        <th className="py-2 pr-3 font-semibold">L/P</th>
                                        <th className="py-2 font-semibold">Lahir</th>
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
                                                Tidak ada peserta.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="panel panel--pad">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="panel__title">Pemeriksaan Dokumen</h3>
                            <DocumentStatusBadge status={r.ai_status} />
                        </div>
                        <p className="whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {r.ai_notes || 'Belum ada catatan dari pemeriksaan dokumen.'}
                        </p>
                        {r.verified_at && (
                            <p className="mt-2 text-xs text-slate-500">Diverifikasi {formatDateTime(r.verified_at)}</p>
                        )}
                    </section>

                    <section className="panel panel--pad">
                        <h3 className="panel__title mb-3">Keputusan</h3>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={doApprove}
                                disabled={approveForm.processing || r.status === 'approved'}
                                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {approveForm.processing ? 'Menyimpan…' : 'Setujui Pendaftaran'}
                            </button>

                            <button
                                type="button"
                                onClick={doReverify}
                                disabled={reverifyForm.processing}
                                className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
                            >
                                {reverifyForm.processing ? 'Memeriksa…' : 'Periksa Ulang'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setRejectOpen((v) => !v)}
                                className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100"
                            >
                                Tolak Pendaftaran
                            </button>
                        </div>

                        {decided && (
                            <p className="mt-2 text-xs text-slate-500">
                                Status saat ini: {r.status === 'approved' ? 'disetujui' : 'ditolak'}. Menyetujui ulang akan
                                menghapus alasan penolakan.
                            </p>
                        )}

            <Modal
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                title="Tolak pendaftaran"
                subtitle={`${r.group_name ?? r.school?.school_name ?? ''} — alasan akan tampil di dashboard sekolah.`}
                footer={
                    <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRejectOpen(false)}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="reject-form"
                            className="btn btn--danger btn--sm"
                            disabled={rejectForm.processing}
                        >
                            {rejectForm.processing ? 'Mengirim…' : 'Konfirmasi tolak'}
                        </button>
                    </>
                }
            >
                <form id="reject-form" onSubmit={doReject}>
                    <label htmlFor="rejection_reason" className="block text-sm font-semibold text-slate-700">
                        Alasan penolakan
                    </label>
                    <textarea
                        id="rejection_reason"
                        name="rejection_reason"
                        rows={4}
                        maxLength={500}
                        required
                        value={rejectForm.data.rejection_reason}
                        onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                        placeholder="Minimal 5 karakter, misalnya: surat rekomendasi tidak sesuai nama peserta."
                        className="mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
                    />
                    {rejectForm.errors.rejection_reason && (
                        <p className="mt-1 text-xs font-medium text-rose-700">{rejectForm.errors.rejection_reason}</p>
                    )}
                </form>
            </Modal>
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
                            <Info label="Cabang Lomba">{r.competition?.name}</Info>
                            {r.group_name && <Info label="Nama Grup">{r.group_name}</Info>}
                            <Info label="Pendamping">{r.companion_name}</Info>
                            <Info label="WhatsApp">
                                {wa ? (
                                    <a href={wa} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 underline">
                                        {r.companion_phone}
                                    </a>
                                ) : (
                                    '-'
                                )}
                            </Info>
                            <Info label="Surat Rekomendasi">
                                {r.has_letter ? (
                                    <a
                                        href={`/admin/pendaftaran/${r.id}/surat`}
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
                                {r.event?.event_name} {r.event?.year ?? ''}
                            </Info>
                        </dl>
                    </section>

                    <section className="panel panel--pad">
                        <h3 className="panel__title mb-3">Nilai</h3>
                        {r.score ? (
                            <div className="flex items-end gap-4">
                                <div>
                                    <p className="text-xs text-slate-400">Nilai</p>
                                    <p className="text-3xl font-black text-slate-900">{r.score.score_value ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Peringkat</p>
                                    <p className="text-2xl font-bold text-slate-700">
                                        {r.score.rank ? `#${r.score.rank}` : '-'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Belum dinilai.</p>
                        )}
                        {r.score?.rank && (
                            <a
                                href={`/admin/piagam/${r.id}`}
                                className="mt-3 inline-flex rounded-lg px-3 py-2 text-xs font-semibold text-white"
                                style={{ backgroundColor: 'var(--secondary-color, #f3d95b)' }}
                            >
                                Cetak Piagam
                            </a>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
