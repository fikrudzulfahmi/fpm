import { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import Modal from '../../../Components/Modal';
import { useConfirm } from '../../../Components/ConfirmProvider';

const SAVE_DELAY = 700;

function initialValues(row, criteria) {
    if (criteria.length === 0) {
        return { __single: row.score_value ?? '' };
    }

    const source = row.values && typeof row.values === 'object' ? row.values : {};
    const values = {};

    criteria.forEach((criterion) => {
        const current = source[criterion.id] ?? source[String(criterion.id)];
        values[criterion.id] = current === undefined || current === null ? '' : String(current);
    });

    return values;
}

/**
 * Satu baris peserta. Nilai disimpan otomatis (debounce + blur), tanpa tombol simpan.
 */
function ScoreRow({ row, criteria, competitionId, separate, canAdjust, onAdjust }) {
    const [values, setValues] = useState(() => initialValues(row, criteria));
    const [status, setStatus] = useState('idle'); // idle | saving | saved | error
    const timer = useRef(null);
    const sent = useRef(null);

    useEffect(() => {
        setValues(initialValues(row, criteria));
        setStatus('idle');
        sent.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [row.id, competitionId, criteria.length]);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const payloadFor = (data) =>
        criteria.length > 0
            ? {
                  competition_id: competitionId,
                  registration_id: row.id,
                  criterion_values: Object.fromEntries(
                      Object.entries(data).map(([key, value]) => [key, value === '' ? 0 : Number(value)]),
                  ),
              }
            : {
                  competition_id: competitionId,
                  registration_id: row.id,
                  score_value: data.__single === '' ? 0 : Number(data.__single),
              };

    const save = (data) => {
        const body = payloadFor(data);
        const fingerprint = JSON.stringify(body);

        if (fingerprint === sent.current) {
            setStatus('saved');
            return;
        }

        sent.current = fingerprint;
        setStatus('saving');

        router.post('/admin/nilai', body, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setStatus('saved'),
            onError: () => {
                sent.current = null;
                setStatus('error');
            },
        });
    };

    const schedule = (data) => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => save(data), SAVE_DELAY);
    };

    const change = (key, raw) => {
        const next = { ...values, [key]: raw };
        setValues(next);
        setStatus('idle');
        schedule(next);
    };

    const flush = () => {
        window.clearTimeout(timer.current);
        save(values);
    };

    const inputClass =
        'w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

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

            {criteria.length > 0 ? (
                criteria.map((criterion) => (
                    <td key={criterion.id} className="px-2 py-2">
                        <input
                            type="number"
                            min="0"
                            max={criterion.max_value}
                            step="0.01"
                            inputMode="decimal"
                            value={values[criterion.id] ?? ''}
                            onChange={(e) => change(criterion.id, e.target.value)}
                            onBlur={flush}
                            className={inputClass}
                            aria-label={`${criterion.name} — ${row.display_name}`}
                            placeholder={`0-${criterion.max_value}`}
                        />
                    </td>
                ))
            ) : (
                <td className="px-2 py-2">
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        inputMode="decimal"
                        value={values.__single ?? ''}
                        onChange={(e) => change('__single', e.target.value)}
                        onBlur={flush}
                        className={inputClass}
                        aria-label={`Nilai — ${row.display_name}`}
                        placeholder="0-100"
                    />
                </td>
            )}

            <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-900">{row.final_value ?? '—'}</span>
                    {canAdjust && row.adjusted_value !== null && row.adjusted_value !== undefined && (
                        <span className="inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800">
                            Dikoreksi dari {row.score_value}
                        </span>
                    )}
                </div>
            </td>

            <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                    <span
                        className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            row.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        {row.is_published ? 'Terbit' : 'Draf'}
                    </span>
                    <span
                        className={`text-[10.5px] ${
                            status === 'error' ? 'text-rose-600' : status === 'saving' ? 'text-slate-500' : 'text-emerald-700'
                        }`}
                        aria-live="polite"
                    >
                        {status === 'saving' ? 'Menyimpan…' : status === 'saved' ? 'Tersimpan' : status === 'error' ? 'Gagal menyimpan' : ''}
                    </span>
                </div>
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
    criteria = [],
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
    const [criteriaOpen, setCriteriaOpen] = useState(false);
    const [criteriaRows, setCriteriaRows] = useState([]);
    const [criteriaBusy, setCriteriaBusy] = useState(false);
    const rows = registrations ?? [];
    const activeCompetition = competitions.find((c) => String(c.id) === String(competitionId));
    const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

    const adjustFormState = useState({
        competition_id: competitionId,
        registration_id: '',
        adjusted_value: '',
        adjust_reason: '',
    });
    const [adjustData, setAdjustData] = adjustFormState;
    const [adjustError, setAdjustError] = useState(null);

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
        setAdjustData({
            competition_id: competitionId,
            registration_id: row.id,
            adjusted_value: row.adjusted_value ?? '',
            adjust_reason: row.adjust_reason ?? '',
        });
        setAdjustError(null);
        setAdjusting(row);
    };

    const closeAdjust = () => {
        setAdjusting(null);
        setAdjustData({
            competition_id: competitionId,
            registration_id: '',
            adjusted_value: '',
            adjust_reason: '',
        });
        setAdjustError(null);
    };

    const submitAdjust = (e) => {
        e.preventDefault();
        router.post('/admin/nilai/koreksi', adjustData, {
            preserveScroll: true,
            onSuccess: () => closeAdjust(),
            onError: (errors) => setAdjustError(errors.adjust_reason ?? errors.adjusted_value ?? 'Gagal menyimpan koreksi.'),
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
            { preserveScroll: true, onSuccess: () => closeAdjust() },
        );
    };

    const openCriteria = () => {
        setCriteriaRows(
            criteria.length > 0
                ? criteria.map((c) => ({ id: c.id, name: c.name, weight: String(c.weight), max_value: String(c.max_value) }))
                : [
                      { id: null, name: '', weight: '1', max_value: '100' },
                      { id: null, name: '', weight: '1', max_value: '100' },
                  ],
        );
        setCriteriaOpen(true);
    };

    const updateCriteriaRow = (index, key, value) => {
        setCriteriaRows((list) => list.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
    };

    const addCriteriaRow = () => {
        setCriteriaRows((list) => [...list, { id: null, name: '', weight: '1', max_value: '100' }]);
    };

    const removeCriteriaRow = (index) => {
        setCriteriaRows((list) => list.filter((_, i) => i !== index));
    };

    const submitCriteria = (e) => {
        e.preventDefault();
        setCriteriaBusy(true);

        router.put(
            `/admin/lomba/${competitionId}/kriteria`,
            {
                criteria: criteriaRows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    weight: row.weight,
                    max_value: row.max_value,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => setCriteriaOpen(false),
                onFinish: () => setCriteriaBusy(false),
            },
        );
    };

    const criteriaWeightSum = criteriaRows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0);

    return (
        <AppLayout title="Penilaian">
            <Head title="Penilaian" />

            <div className="page-head-row">
                <div>
                    <h2 className="page-title">{is_pj ? 'Penilaian Cabang Lomba' : 'Input Nilai'}</h2>
                    <p className="text-sm text-slate-500">
                        {is_pj
                            ? `Anda PJ Lomba ${activeCompetition?.name ?? '—'}. Masukkan nilai tiap kriteria dari kertas penilaian juri — tersimpan otomatis.`
                            : criteria.length > 0
                              ? `Nilai tiap kriteria tersimpan otomatis. Nilai akhir = rata-rata berbobot (total bobot ${totalWeight}).`
                              : 'Cabang ini belum punya kriteria; isi satu nilai 0–100 (tersimpan otomatis).' }
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
                                onClick={openCriteria}
                                disabled={!competitionId}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                            >
                                Atur kriteria
                            </button>
                            <button
                                type="button"
                                onClick={drawOrder}
                                disabled={!competitionId}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                            >
                                Undian urutan
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
                                {publish_scores ? 'Tutup publikasi' : 'Publikasikan nilai'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {criteria.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {criteria.map((criterion) => (
                        <span
                            key={criterion.id}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] text-slate-600"
                        >
                            <strong className="font-semibold text-slate-800">{criterion.name}</strong>
                            bobot {criterion.weight} · maks {criterion.max_value}
                        </span>
                    ))}
                </div>
            )}

            <div className="panel panel--flush">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr className="data-table__head">
                                <th className="px-3 py-3 text-center font-semibold">No.</th>
                                <th className="px-4 py-3 text-center font-semibold">Rank</th>
                                <th className="px-3 py-3 font-semibold">Peserta / Grup</th>
                                <th className="px-3 py-3 font-semibold">Sekolah</th>
                                {criteria.length > 0 ? (
                                    criteria.map((criterion) => (
                                        <th key={criterion.id} className="px-2 py-3 font-semibold">
                                            {criterion.name}
                                            <span className="block text-[10.5px] font-normal text-slate-400">
                                                bobot {criterion.weight}
                                            </span>
                                        </th>
                                    ))
                                ) : (
                                    <th className="px-3 py-3 font-semibold">Nilai</th>
                                )}
                                <th className="px-3 py-3 font-semibold">{can_adjust ? 'Nilai akhir' : 'Nilai'}</th>
                                <th className="px-3 py-3 font-semibold">Status</th>
                                {can_adjust && <th className="px-3 py-3 font-semibold">Koreksi</th>}
                            </tr>
                        </thead>
                        <tbody className="data-table__body">
                            {rows.map((row) => (
                                <ScoreRow
                                    key={`${row.id}-${competitionId}-${criteria.length}`}
                                    row={row}
                                    criteria={criteria}
                                    competitionId={competitionId}
                                    separate={separate}
                                    canAdjust={can_adjust}
                                    onAdjust={openAdjust}
                                />
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6 + criteria.length + (can_adjust ? 1 : 0)}
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

            {/* Koreksi nilai akhir — panitia penuh */}
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
                        <button type="submit" form="adjust-score-form" className="btn btn--dark btn--sm">
                            Simpan koreksi
                        </button>
                    </>
                }
            >
                <form id="adjust-score-form" onSubmit={submitAdjust} className="grid gap-3">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
                        Nilai dari kriteria: <strong>{adjusting?.score_value ?? '—'}</strong>. Nilai akhir dipakai
                        untuk peringkat dan sertifikat.
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
                            value={adjustData.adjusted_value}
                            onChange={(e) => setAdjustData({ ...adjustData, adjusted_value: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="adjust_reason" className="mb-1 block text-xs font-medium text-slate-600">
                            Alasan koreksi (dicatat untuk audit)
                        </label>
                        <textarea
                            id="adjust_reason"
                            rows={3}
                            maxLength={500}
                            value={adjustData.adjust_reason}
                            onChange={(e) => setAdjustData({ ...adjustData, adjust_reason: e.target.value })}
                            placeholder="Mis. penyesuaian promosi sekolah mitra, hasil rapat panitia tanggal …"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>

                    {adjustError && <p className="text-xs text-rose-600">{adjustError}</p>}

                    {adjusting?.adjust_reason && (
                        <p className="text-[11.5px] text-slate-500">
                            Koreksi terakhir: {adjusting.adjust_reason}
                            {adjusting.adjusted_by ? ` (${adjusting.adjusted_by})` : ''}
                        </p>
                    )}
                </form>
            </Modal>

            {/* Atur kriteria — panitia penuh */}
            <Modal
                open={criteriaOpen}
                onClose={() => setCriteriaOpen(false)}
                title="Kriteria penilaian"
                subtitle={activeCompetition ? activeCompetition.name : undefined}
                size="lg"
                footer={
                    <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCriteriaOpen(false)}>
                            Batal
                        </button>
                        <button type="submit" form="criteria-form" className="btn btn--dark btn--sm" disabled={criteriaBusy}>
                            {criteriaBusy ? 'Menyimpan…' : 'Simpan kriteria'}
                        </button>
                    </>
                }
            >
                <form id="criteria-form" onSubmit={submitCriteria} className="grid gap-3">
                    <p className="text-[12.5px] text-slate-500">
                        Nilai akhir dihitung: Σ((nilai ÷ maks) × bobot) ÷ Σbobot × 100. Contoh: dua kriteria bobot
                        30 dan 70 → kriteria kedua lebih menentukan.
                    </p>

                    <div className="grid gap-2">
                        {criteriaRows.map((row, index) => (
                            <div key={index} className="grid grid-cols-12 items-end gap-2">
                                <div className="col-span-6">
                                    <label className="mb-1 block text-[11px] font-medium text-slate-500">
                                        Nama kriteria
                                    </label>
                                    <input
                                        value={row.name}
                                        onChange={(e) => updateCriteriaRow(index, 'name', e.target.value)}
                                        placeholder={index === 0 ? 'Tajwid' : index === 1 ? 'Suara' : 'Penampilan'}
                                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1 block text-[11px] font-medium text-slate-500">Bobot</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={row.weight}
                                        onChange={(e) => updateCriteriaRow(index, 'weight', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1 block text-[11px] font-medium text-slate-500">Maks</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1000"
                                        step="1"
                                        value={row.max_value}
                                        onChange={(e) => updateCriteriaRow(index, 'max_value', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => removeCriteriaRow(index)}
                                        className="w-full rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11.5px] font-semibold text-rose-700 hover:bg-rose-100"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={addCriteriaRow}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Tambah kriteria
                        </button>
                        <span className="text-[11.5px] text-slate-500">Total bobot: {criteriaWeightSum}</span>
                    </div>

                    <p className="text-[11.5px] text-slate-500">
                        Menghapus kriteria juga menghapus nilai kriteria tersebut pada semua peserta. Kosongkan
                        daftar untuk kembali memakai satu nilai tunggal 0–100.
                    </p>
                </form>
            </Modal>
        </AppLayout>
    );
}
