import { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';

function ScoreRow({ row, competitionId, separate }) {
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
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        row.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    {row.is_published ? 'Terbit' : 'Draf'}
                </span>
            </td>
        </tr>
    );
}

export default function ScoreIndex({
    competitions = [],
    competition_id,
    registrations = [],
    publish_scores,
    gender_mode = 'mixed',
}) {
    const separate = gender_mode === 'separate';
    const [competitionId, setCompetitionId] = useState(String(competition_id ?? ''));
    const rows = registrations ?? [];

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

    const drawOrder = () => {
        if (!competitionId) return;
        if (!window.confirm('Acak ulang nomor urut tampil untuk cabang ini?')) return;
        router.post(`/admin/lomba/${competitionId}/undian`, {}, { preserveScroll: true });
    };

    const togglePublish = () => {
        router.post(
            '/admin/nilai/publikasi',
            { competition_id: competitionId, publish: !publish_scores },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout title="Penilaian">
            <Head title="Penilaian" />

            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Input Nilai</h2>
                    <p className="text-sm text-slate-500">
                        Nilai 0–100 per pendaftaran. Peringkat dihitung otomatis dari nilai tertinggi
                        {separate ? ' — dipisah peringkat Putra dan Putri.' : '.'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <th className="px-3 py-3 text-center font-semibold">No.</th>
                                <th className="px-4 py-3 text-center font-semibold">Rank</th>
                                <th className="px-3 py-3 font-semibold">Peserta / Grup</th>
                                <th className="px-3 py-3 font-semibold">Sekolah</th>
                                <th className="px-3 py-3 font-semibold">Nilai</th>
                                <th className="px-3 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row) => (
                                <ScoreRow
                                    key={`${row.id}-${competitionId}`}
                                    row={row}
                                    competitionId={competitionId}
                                    separate={separate}
                                />
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                                        {competitionId
                                            ? 'Belum ada pendaftaran disetujui untuk cabang lomba ini.'
                                            : 'Pilih cabang lomba untuk mulai menilai.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
