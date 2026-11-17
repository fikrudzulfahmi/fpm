import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import DataTable from '../../../Components/DataTable';
import { useConfirm } from '../../../Components/ConfirmProvider';
import StatusBadge from '../../../Components/StatusBadge';

export default function ParticipantShow({ event, competition, registrations = [], stats = {} }) {
    const confirm = useConfirm();
    const isGroup = competition?.category_type === 'group';

    const draw = async () => {
        const ok = await confirm({
            title: `Undi urutan ${competition.name}?`,
            message:
                'Nomor tampil peserta yang sudah disetujui akan diacak ulang. Nilai yang sudah diinput tidak berubah.',
            confirmLabel: 'Undi sekarang',
            tone: 'primary',
        });

        if (!ok) return;

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
                    onClick={draw}
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

            <div className="stat-grid">
                <div className="stat-card">
                    <p className="stat-card__label">Total peserta</p>
                    <p className="stat-card__value">{stats.total ?? 0}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-card__label">Disetujui</p>
                    <p className="stat-card__value text-[#0a5b4a]">{stats.approved ?? 0}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-card__label">Menunggu verifikasi</p>
                    <p className="stat-card__value text-[#b45309]">{stats.pending ?? 0}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-card__label">Sudah dapat nomor</p>
                    <p className="stat-card__value">{stats.drawn ?? 0}</p>
                </div>
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
        </AppLayout>
    );
}
