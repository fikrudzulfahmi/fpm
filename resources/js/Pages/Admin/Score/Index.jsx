import { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import Modal from '../../../Components/Modal';
import { useConfirm } from '../../../Components/ConfirmProvider';

function ScoreRow({ row, competitionId, separate, canAdjust, onAdjust }) {
    const form = useForm({
        competition_id: competitionId,
        registration_id: row.id,
        score_value: row.score_value ?? '',
    });

    // Ikuti nilai terbaru dari server setelah redirect.
    useEffect(() => {
        form.setData('score_value', row.score_value ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [row.score_value]);

    const save = (e) => {
        e.preventDefault();
        form.post('/admin/nilai', { preserveScroll: true });
    };

    const adjusted = row.adjusted_value !== null && row.adjusted_value !== undefined;

    return (
        <tr className="hover:bg-slate-50/70">
            <td className="px-3 py-2 text-center font-mono text-sm font-semibold text-slate-600">
                {row.performance_number ?? '—'}
            </td>
            <td className="px-4 py-2 text-center font-bold text-slate-700">{row.rank ?? '-'}</td>
            <td className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{row.display_name}</p>
                    {separate && (
                        <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                                row.gender === 'P'
                                    ? 'bg-pink-50 text-pink-700 ring-pink-200'
                                    : 'bg-sky-50 text-sky-700 ring-sky-200'
                            }`}
                        >
                            {row.gender_label ?? '—'}
                        </span>
                    )}
                </div>
                {row.participants?.length > 1 && (
                    <p className="text-xs text-slate-500">{row.participants.join(', ')}</p>
                )}
            </td>
            <td className="px-3 py-2 text-slate-600">{row.school ?? '-'}</td>
            <td className="px-3 py-2">
                <form onSubmit={save} className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.data.score_value}
                        onChange={(e) => form.setData('score_value', e.target.value)}
                        className={`w-24 rounded-lg border px-2 py-1.5 text-sm shadow-sm outline-none focus:ring-2 ${
                            form.errors.score_value
                                ? 'border-rose-400 focus:ring-rose-200'
                                : 'border-slate-300 focus:ring-slate-200'
                        }`}
                        placeholder="0-100"
                    />
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {form.processing ? '…' : 'Simpan'}
                    </button>
                </form>
                {form.errors.score_value && (
                    <p className="mt-1 text-xs text-rose-600">{form.errors.score_value}</p>
                )}
            </td>
            <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-900">{row.final_value ?? '—'}</span>
                    {canAdjust && adjusted && (
                        <span className="inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800">
                            Dikoreksi dari {row.score_value}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-3 py-2">
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        row.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    {row.is_published ? 'Terbit' : 'Draf'}
                </span>
            </td>
            {canAdjust && (
                <td className="px-3 py-2">
                    <button
                        type="button"
                        onClick={() => onAdjust(row)}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11.5px] font-semibold text-amber-800 hover:bg-amber-100"
                    >
                        Koreksi
                    </button>
                </td>
            )}
        </tr>
    );
}

export default function ScoreIndex({
    competitions = [],
    competition_id,
    registrations = [],
    publish_scores,
    gender_mode = 'mixed',
    can_adjust = false,
    is_pj = false,
}) {
    const confirm = useConfirm();
    const separate = gender_mode === 'separate';
    const [competitionId, setCompetitionId] = useState(String(competition_id ?? ''));
    const [adjusting, setAdjusting] = useState(null);
    const rows = registrations ?? [];
    const activeCompetition = competitions.find((c) => String(c.id) === String(competitionId));

    const adjustForm = useForm({
        competition_id: competitionId,
        registration_id: '',
        adjusted_value: '',
        adjust_reason: '',
    });

    useEffect(() => {
        setCompetitionId(String(competition_id ?? ''));
    }, [competition_id]);

    const changeCompetition = (value) => {
        setCompetitionId(value);
        router.get('/admin/nilai', value ? { competition_id: value } : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const drawOrder = async () => {
        if (!competitionId) return;
        const ok = await confirm({
            title: 'Acak ulang nomor tampil?',
            message: 'Urutan tampil peserta pada cabang ini akan diacak ulang. Penilaian yang sudah ada tidak berubah.',
            confirmLabel: 'Acak ulang',
            tone: 'primary',
        });
        if (!ok) return;

        router.post(`/admin/lomba/${competitionId}/undian`, {}, { preserveScroll: true });
    };

    const togglePublish = () => {
        router.post(
            '/admin/nilai/publikasi',
            { competition_id: competitionId, publish: !publish_scores },
            { preserveScroll: true },
        );
    };

    const openAdjust = (row) => {
        adjustForm.setData({
            competition_id: competitionId,
            registration_id: row.id,
            adjusted_value: row.adjusted_value ?? row.score_value ?? '',
            adjust_reason: row.adjust_reason ?? '',
        });
        adjustForm.clearErrors();
        setAdjusting(row);
    };

    const closeAdjust = () => {
        setAdjusting(null);
        adjustForm.reset();
        adjustForm.clearErrors();
    };

    const submitAdjust = (e) => {
        e.preventDefault();
        adjustForm.post('/admin/nilai/koreksi', {
            preserveScroll: true,
            onSuccess: () => closeAdjust(),
        });
    };

    const removeAdjustment = () => {
        router.post(
            '/admin/nilai/koreksi',
            {
                competition_id: competitionId,
                registration_id: adjusting?.id,
                adjusted_value: null,
                adjust_reason: null,
            },
            {
                preserveScroll: true,
                onSuccess: () => closeAdjust(),
            },
        );
    };

    return (
        <AppLayout title="Penilaian">
            <Head title="Penilaian" />

            <div className="page-head-row">
                <div>
                    <h2 className="page-title">{is_pj ? 'Penilaian Cabang Lomba' : 'Input Nilai'}</h2>
                    <p className="text-sm text-slate-500">
                        {is_pj
                            ? `Anda PJ Lomba ${activeCompetition?.name ?? '—'}. Masukkan nilai dari kertas penilaian juri; peringkat dihitung otomatis.`
                            : `Nilai 0–100 per pendaftaran. Peringkat dihitung otomatis dari nilai akhir${separate ? ' — dipisah peringkat Putra dan Putri.' : '.'}`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {is_pj ? (
                        <span className="admin-chip">{activeCompetition?.name ?? 'Belum ada cabang'}</span>
                    ) : (
                        <select
                            value={competitionId}
                            onChange={(e) => changeCompetition(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
                            aria-label="Pilih cabang lomba"
                        >
                            <option value="">— Pilih cabang lomba —</option>
                            {competitions.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {can_adjust && (
                        <>
                            <button
                                type="button"
                                onClick={drawOrder}
                                disabled={!competitionId}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                            >
                                Undian Urutan Tampil
                            </button>

                            <button
                                type="button"
                                onClick={togglePublish}
                                disabled={!competitionId}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${
                                    publish_scores
                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                            >
                                {publish_scores ? 'Tutup Publikasi' : 'Publikasikan Nilai'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div
                className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${
                    publish_scores
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
            >
                {publish_scores
                    ? 'Nilai sedang dipublikasikan — sekolah bisa melihat nilai dan peringkat.'
                    : 'Nilai belum dipublikasikan — hanya panitia yang melihat angka ini.'}
            </div>

            <div className="panel panel--flush">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr className="data-table__head">
                                <th className="px-3 py-3 text-center font-semibold">No.</th>
                                <th className="px-4 py-3 text-center font-semibold">Rank</th>
                                <th className="px-3 py-3 font-semibold">Peserta / Grup</th>
                                <th className="px-3 py-3 font-semibold">Sekolah</th>
                                <th className="px-3 py-3 font-semibold">Nilai Juri</th>
                                <th className="px-3 py-3 font-semibold">{can_adjust ? 'Nilai Akhir' : 'Nilai'}</th>
                                <th className="px-3 py-3 font-semibold">Status</th>
                                {can_adjust && <th className="px-3 py-3 font-semibold">Koreksi</th>}
                            </tr>
                        </thead>
                        <tbody className="data-table__body">
                            {rows.map((row) => (
                                <ScoreRow
                                    key={`${row.id}-${competitionId}`}
                                    row={row}
                                    competitionId={competitionId}
                                    separate={separate}
                                    canAdjust={can_adjust}
                                    onAdjust={openAdjust}
                                />
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={can_adjust ? 8 : 7}
                                        className="px-5 py-12 text-center text-sm text-slate-400"
                                    >
                                        {is_pj && !competitionId
                                            ? 'Akun Anda belum ditugaskan ke cabang lomba mana pun. Hubungi panitia.'
                                            : competitionId
                                              ? 'Belum ada pendaftaran disetujui untuk cabang lomba ini.'
                                              : 'Pilih cabang lomba untuk mulai menilai.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                open={Boolean(adjusting)}
                onClose={closeAdjust}
                title="Koreksi nilai akhir"
                subtitle={adjusting ? `${adjusting.display_name} · ${adjusting.school ?? '-'}` : undefined}
                footer={
                    <>
                        {adjusting?.adjusted_value !== null && adjusting?.adjusted_value !== undefined && (
                            <button type="button" className="btn btn--ghost btn--sm" onClick={removeAdjustment}>
                                Hapus koreksi
                            </button>
                        )}
                        <button type="button" className="btn btn--ghost btn--sm" onClick={closeAdjust}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="adjust-score-form"
                            className="btn btn--dark btn--sm"
                            disabled={adjustForm.processing}
                        >
                            {adjustForm.processing ? 'Menyimpan…' : 'Simpan koreksi'}
                        </button>
                    </>
                }
            >
                <form id="adjust-score-form" onSubmit={submitAdjust} className="grid gap-3">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
                        Nilai juri: <strong>{adjusting?.score_value ?? '—'}</strong>. Nilai akhir dipakai untuk
                        peringkat dan sertifikat.
                    </div>

                    <div>
                        <label htmlFor="adjusted_value" className="mb-1 block text-xs font-medium text-slate-600">
                            Nilai akhir (0–100)
                        </label>
                        <input
                            id="adjusted_value"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={adjustForm.data.adjusted_value}
                            onChange={(e) => adjustForm.setData('adjusted_value', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {adjustForm.errors.adjusted_value && (
                            <p className="mt-1 text-xs text-rose-600">{adjustForm.errors.adjusted_value}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="adjust_reason" className="mb-1 block text-xs font-medium text-slate-600">
                            Alasan koreksi (dicatat untuk audit)
                        </label>
                        <textarea
                            id="adjust_reason"
                            rows={3}
                            maxLength={500}
                            value={adjustForm.data.adjust_reason}
                            onChange={(e) => adjustForm.setData('adjust_reason', e.target.value)}
                            placeholder="Mis. penyesuaian promosi sekolah mitra, hasil rapat panitia tanggal …"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        {adjustForm.errors.adjust_reason && (
                            <p className="mt-1 text-xs text-rose-600">{adjustForm.errors.adjust_reason}</p>
                        )}
                    </div>

                    {adjusting?.adjust_reason && (
                        <p className="text-[11.5px] text-slate-500">
                            Koreksi terakhir: {adjusting.adjust_reason}
                            {adjusting.adjusted_by ? ` (${adjusting.adjusted_by})` : ''}
                        </p>
                    )}
                </form>
            </Modal>
        </AppLayout>
    );
}
