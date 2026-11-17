import { Head, Link } from '@inertiajs/react';
import GuestLayout from '../../Layouts/GuestLayout';

function rankTone(rank) {
    if (rank === 1) return 'is-gold';
    if (rank === 2) return 'is-silver';
    if (rank === 3) return 'is-bronze';

    return '';
}

export default function Hasil({ published, competitions = [], active_slug, active_name, criteria = [], results = [] }) {
    return (
        <GuestLayout title="Hasil Lomba">
            <Head title="Hasil Lomba" />

            <section className="page-head">
                <div className="container page-head__inner">
                    <ol className="crumbs">
                        <li>
                            <Link href="/">Beranda</Link>
                        </li>
                        <li aria-current="page">Hasil</li>
                    </ol>
                    <span className="eyebrow eyebrow--gold">Papan skor</span>
                    <h1>Hasil lomba</h1>
                    <p>
                        {published
                            ? `Peringkat resmi ${active_name ?? 'cabang lomba'} beserta rincian nilai tiap kriteria.`
                            : 'Panitia belum memublikasikan nilai. Halaman ini akan menampilkan peringkat setelah pengumuman resmi.'}
                    </p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    {competitions.length > 0 && (
                        <div className="filters" role="group" aria-label="Pilih cabang lomba">
                            {competitions.map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/hasil?cabang=${c.slug}`}
                                    className="chip"
                                    aria-pressed={c.slug === active_slug ? 'true' : 'false'}
                                    style={{ textDecoration: 'none' }}
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    {!published ? (
                        <div className="empty-state">
                            Nilai belum dipublikasikan panitia. Silakan cek kembali setelah pengumuman juara.
                        </div>
                    ) : results.length === 0 ? (
                        <div className="empty-state">Belum ada nilai untuk cabang lomba ini.</div>
                    ) : (
                        <div className="panel panel--flush mt-4">
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr className="data-table__head">
                                            <th className="px-4 py-3 text-center font-semibold">Rank</th>
                                            <th className="px-4 py-3 font-semibold">Peserta</th>
                                            <th className="px-4 py-3 font-semibold">Sekolah</th>
                                            {criteria.map((criterion) => (
                                                <th key={criterion.id} className="px-3 py-3 font-semibold">
                                                    {criterion.name}
                                                    <span className="block text-[10.5px] font-normal text-slate-400">
                                                        bobot {criterion.weight} · maks {criterion.max_value}
                                                    </span>
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 font-semibold">Nilai akhir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="data-table__body">
                                        {results.map((row) => (
                                            <tr key={row.id}>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`result-rank ${rankTone(row.rank)}`}>
                                                        {row.rank ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-slate-900">{row.name}</p>
                                                    {row.gender_label && (
                                                        <p className="text-[11.5px] text-slate-500">{row.gender_label}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{row.school ?? '-'}</td>
                                                {criteria.map((criterion) => (
                                                    <td key={criterion.id} className="px-3 py-3 text-slate-700">
                                                        {row.values?.[criterion.id] ?? row.values?.[String(criterion.id)] ?? '—'}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3">
                                                    <strong className="text-slate-900">{row.total ?? '—'}</strong>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <p className="small muted" style={{ marginTop: '18px' }}>
                        Nilai akhir dihitung dari rata-rata berbobot kriteria. Keputusan dewan juri bersifat final.
                    </p>
                </div>
            </section>
        </GuestLayout>
    );
}
