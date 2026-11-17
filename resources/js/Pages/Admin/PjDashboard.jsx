import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

function Stat({ label, value, hint }) {
    return (
        <div className="stat-card">
            <span className="stat-card__label">{label}</span>
            <span className="stat-card__value">{value}</span>
            {hint && <span className="stat-card__hint">{hint}</span>}
        </div>
    );
}

export default function PjDashboard({ competition, criteria = [], approved = 0, scored = 0, published = false, top = [] }) {
    const { event, auth } = usePage().props;
    const user = auth?.user;
    const pending = Math.max(0, approved - scored);
    const progress = approved > 0 ? Math.round((scored / approved) * 100) : 0;

    return (
        <AppLayout title="Dashboard PJ Lomba">
            <Head title="Dashboard PJ Lomba" />

            <section className="dash-hero">
                <div className="dash-hero__grid">
                    <div>
                        <span className="dash-hero__eyebrow">PJ Lomba · {user?.competition?.name ?? 'Cabang lomba'}</span>
                        <h2 className="dash-hero__title">{competition?.name ?? 'Belum ada cabang lomba'}</h2>
                        <p className="dash-hero__lead">
                            {competition
                                ? `${event?.event_name ?? 'Festival Pelajar Muslim'} ${event?.year ?? ''} — masukkan nilai tiap kriteria dari kertas penilaian juri. Peringkat dihitung otomatis.`
                                : 'Akun Anda belum ditugaskan ke cabang lomba. Hubungi panitia untuk penugasan.'}
                        </p>

                        {competition && (
                            <div className="dash-hero__actions">
                                <Link href="/admin/nilai" className="btn btn--gold">
                                    Input nilai
                                </Link>
                                <Link href="/hasil" className="dash-hero__ghost">
                                    Lihat hasil publik
                                </Link>
                            </div>
                        )}

                        {competition && (
                            <div className="dash-hero__meta">
                                <span className="dash-chip">
                                    <span>Jenis</span>
                                    <strong>{competition.category_type === 'group' ? 'Beregu' : 'Individu'}</strong>
                                </span>
                                <span className="dash-chip">
                                    <span>Kriteria</span>
                                    <strong>{criteria.length} kriteria</strong>
                                </span>
                                <span className="dash-chip">
                                    <span>Publikasi</span>
                                    <strong>{published ? 'Sudah terbit' : 'Belum terbit'}</strong>
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="dash-spotlight">
                        <p className="dash-spotlight__label">Peserta disetujui</p>
                        <p className="dash-spotlight__num">{approved}</p>
                        <p className="dash-spotlight__hint">{pending > 0 ? `${pending} belum dinilai` : 'Semua sudah dinilai'}</p>
                    </div>
                </div>
            </section>

            {competition ? (
                <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Stat label="Peserta disetujui" value={approved} hint="Siap dinilai" />
                        <Stat label="Sudah dinilai" value={scored} hint={`${progress}% selesai`} />
                        <Stat label="Belum dinilai" value={pending} hint={pending > 0 ? 'Perlu diisi' : 'Bersih'} />
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        <section className="panel panel--flush lg:col-span-2">
                            <div className="panel__head">
                                <div>
                                    <h3 className="panel__title">Peringkat sementara</h3>
                                    <p className="page-sub">Diurutkan dari nilai akhir tertinggi (maks. 5 besar).</p>
                                </div>
                                <Link href="/admin/nilai" className="admin-link-soft">
                                    Buka penilaian
                                </Link>
                            </div>

                            {top.length === 0 ? (
                                <div className="px-5 py-10 text-center text-sm text-slate-500">
                                    Belum ada nilai. Mulai input dari halaman Penilaian.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="data-table">
                                        <thead>
                                            <tr className="data-table__head">
                                                <th className="px-4 py-2 text-center font-semibold">Rank</th>
                                                <th className="px-4 py-2 font-semibold">Peserta</th>
                                                <th className="px-4 py-2 font-semibold">Sekolah</th>
                                                <th className="px-4 py-2 font-semibold">Nilai akhir</th>
                                            </tr>
                                        </thead>
                                        <tbody className="data-table__body">
                                            {top.map((row) => (
                                                <tr key={row.id}>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-700">{row.rank ?? '—'}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                                                    <td className="px-4 py-3 text-slate-600">{row.school ?? '-'}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-900">{row.total ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <aside className="panel panel--pad">
                            <h3 className="panel__title">Kriteria penilaian</h3>
                            <p className="page-sub mb-3">Disusun panitia untuk cabang ini.</p>

                            {criteria.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    Belum ada kriteria. Panitia perlu mengatur kriteria sebelum nilai per kriteria bisa diisi.
                                </p>
                            ) : (
                                <div className="grid gap-2">
                                    {criteria.map((criterion) => (
                                        <div
                                            key={criterion.id}
                                            className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--line)] px-3 py-2"
                                        >
                                            <span className="text-sm font-semibold text-slate-800">{criterion.name}</span>
                                            <span className="text-[11.5px] text-slate-500">
                                                bobot {criterion.weight} · maks {criterion.max_value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                                Nilai akhir dihitung otomatis: Σ((nilai ÷ maks) × bobot) ÷ Σbobot × 100. Tidak ada
                                tombol simpan — nilai tersimpan saat Anda berhenti mengetik.
                            </div>
                        </aside>
                    </div>
                </>
            ) : (
                <div className="empty-state mt-4">
                    <h3 className="text-base font-semibold text-slate-900">Belum ditugaskan</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                        Panitia belum menetapkan cabang lomba untuk akun Anda. Hubungi panitia agar akun ini
                        ditautkan ke satu cabang.
                    </p>
                </div>
            )}
        </AppLayout>
    );
}
