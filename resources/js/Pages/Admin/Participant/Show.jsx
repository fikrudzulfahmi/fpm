import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import DataTable from '../../../Components/DataTable';
import ConfirmDialog from '../../../Components/ConfirmDialog';
import StatusBadge from '../../../Components/StatusBadge';
import AdminStatCard from '../../../Components/AdminStatCard';

export default function ParticipantShow({ event, competition, registrations = [], stats = {} }) {
    const [askDraw, setAskDraw] = useState(false);
    const isGroup = competition?.category_type === 'group';

    const runDraw = () => {
        setAskDraw(false);
        router.post(`/admin/peserta-lomba/${competition.id}/undian`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title={`Peserta ${competition?.name ?? ''}`}>
            <Head title={`Peserta ${competition?.name ?? ''}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Link href="/admin/peserta-lomba" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                    ← Semua cabang
                </Link>
                <button
                    type="button"
                    onClick={() => setAskDraw(true)}
                    disabled={(stats.approved ?? 0) === 0}
                    className="rounded-lg bg-[#064b3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a5b4a] disabled:opacity-40"
                >
                    Undi urutan tampil
                </button>
            </div>

            <div className="page-head-row">
                <div>
                    <h1 className="page-title">{competition?.name}</h1>
                    <p className="page-sub">
                        {isGroup ? 'Kelompok' : 'Individu'}
                        {competition?.gender_mode === 'separate' ? ' · Putra & Putri' : ''}
                        {' · kuota '}
                        {competition?.global_quota} {isGroup ? 'grup' : 'peserta'}
                        {competition?.school_quota ? ` · maks. ${competition.school_quota} per sekolah` : ''}
                    </p>
                </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <AdminStatCard
                    label="Total peserta"
                    value={stats.total ?? 0}
                    hint={`Kuota ${competition?.global_quota ?? 0}`}
                    icon="users"
                />
                <AdminStatCard
                    label="Disetujui"
                    value={stats.approved ?? 0}
                    hint="Boleh dinilai"
                    icon="check"
                />
                <AdminStatCard
                    label="Menunggu verifikasi"
                    value={stats.pending ?? 0}
                    hint={(stats.pending ?? 0) > 0 ? 'Perlu ditinjau panitia' : 'Semua sudah ditinjau'}
                    icon="clock"
                    tone="amber"
                />
                <AdminStatCard
                    label="Sudah dapat nomor"
                    value={stats.drawn ?? 0}
                    hint={`dari ${stats.approved ?? 0} peserta disetujui`}
                    icon="flag"
                    bar={
                        (stats.approved ?? 0) > 0
                            ? Math.round(((stats.drawn ?? 0) / (stats.approved ?? 1)) * 100)
                            : 0
                    }
                />
            </div>

            <DataTable
                className="mt-6"
                title="Daftar peserta"
                subtitle="Nomor tampil diisi lewat undian; peserta tanpa nomor tampil di urutan bawah."
                columns={[
                    {
                        key: 'no',
                        label: 'No. tampil',
                        align: 'center',
                        width: 92,
                        render: (r) =>
                            r.performance_number ? (
                                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#064b3d] px-2 text-sm font-bold text-white">
                                    {r.performance_number}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-400">—</span>
                            ),
                    },
                    {
                        key: 'name',
                        label: isGroup ? 'Nama grup' : 'Nama peserta',
                        render: (r) => (
                            <>
                                <p className="font-semibold text-slate-900">{r.display_name}</p>
                                <p className="text-xs text-slate-500">
                                    {r.gender_label ? `${r.gender_label} · ` : ''}
                                    {isGroup ? `${r.participant_count} anggota` : r.nisn_list?.[0] ?? 'NISN belum ada'}
                                </p>
                            </>
                        ),
                    },
                    {
                        key: 'school',
                        label: 'Sekolah',
                        render: (r) => (
                            <>
                                <p>{r.school ?? '-'}</p>
                                <p className="text-xs text-slate-500">NPSN {r.npsn ?? '-'}</p>
                            </>
                        ),
                    },
                    ...(isGroup
                        ? [
                              {
                                  key: 'members',
                                  label: 'Anggota',
                                  render: (r) => (
                                      <span className="text-xs text-slate-600">
                                          {(r.members ?? []).join(', ') || '—'}
                                      </span>
                                  ),
                              },
                          ]
                        : []),
                    {
                        key: 'status',
                        label: 'Status',
                        render: (r) => <StatusBadge status={r.status} />,
                    },
                    {
                        key: 'actions',
                        label: 'Aksi',
                        align: 'right',
                        render: (r) => (
                            <Link
                                href={`/admin/pendaftaran/${r.id}`}
                                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Lihat pendaftaran
                            </Link>
                        ),
                    },
                ]}
                rows={registrations}
                rowKey={(r) => r.id}
                paginationLabel="peserta"
                empty="Belum ada peserta pada cabang ini."
            />

            <ConfirmDialog
                open={askDraw}
                title={`Undi urutan ${competition?.name ?? ''}?`}
                message="Nomor tampil peserta yang sudah disetujui akan diacak ulang. Nilai yang sudah diinput tidak berubah."
                confirmLabel="Undi sekarang"
                tone="primary"
                onConfirm={runDraw}
                onClose={() => setAskDraw(false)}
            />
        </AppLayout>
    );
}
