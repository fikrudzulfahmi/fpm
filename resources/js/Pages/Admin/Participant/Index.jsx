import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import DataTable from '../../../Components/DataTable';
import ConfirmDialog from '../../../Components/ConfirmDialog';
import AdminStatCard from '../../../Components/AdminStatCard';

export default function ParticipantIndex({ event, competitions = [], totals = {} }) {
    const [pending, setPending] = useState(null);

    const runDraw = () => {
        const competition = pending;
        setPending(null);
        if (!competition) return;

        router.post(`/admin/peserta-lomba/${competition.id}/undian`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Peserta Lomba">
            <Head title="Peserta Lomba" />

            <div className="page-head-row">
                <div>
                    <h1 className="page-title">Peserta Lomba</h1>
                    <p className="page-sub">
                        Daftar peserta per cabang {event?.event_name ?? ''} {event?.year ?? ''} beserta nomor urut tampil.
                    </p>
                </div>
                <Link
                    href="/admin/pendaftaran"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Verifikasi pendaftaran
                </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <AdminStatCard
                    label="Cabang lomba"
                    value={totals.competitions ?? competitions.length}
                    hint="Event aktif"
                    icon="flag"
                />
                <AdminStatCard
                    label="Total pendaftar"
                    value={totals.registrations ?? 0}
                    hint="Seluruh status"
                    icon="users"
                />
                <AdminStatCard
                    label="Disetujui"
                    value={totals.approved ?? 0}
                    hint="Siap dinilai"
                    icon="check"
                />
                <AdminStatCard
                    label="Menunggu verifikasi"
                    value={totals.pending ?? 0}
                    hint={(totals.pending ?? 0) > 0 ? 'Perlu ditinjau panitia' : 'Semua sudah ditinjau'}
                    icon="clock"
                    tone="amber"
                />
            </div>

            <DataTable
                className="mt-6"
                title="Peserta per cabang"
                subtitle="Klik Detail untuk melihat daftar peserta dan mengundi nomor tampil."
                columns={[
                    {
                        key: 'name',
                        label: 'Cabang lomba',
                        render: (c) => (
                            <>
                                <p className="font-semibold text-slate-900">{c.name}</p>
                                <p className="text-xs text-slate-500">
                                    {c.category_type === 'group' ? 'Kelompok' : 'Individu'}
                                    {c.gender_mode === 'separate' ? ' · Putra & Putri' : ''}
                                    {' · kuota '}
                                    {c.global_quota}
                                </p>
                            </>
                        ),
                    },
                    {
                        key: 'approved',
                        label: 'Disetujui',
                        align: 'center',
                        render: (c) => <span className="font-semibold">{c.approved}</span>,
                    },
                    { key: 'pending', label: 'Menunggu', align: 'center' },
                    { key: 'rejected', label: 'Ditolak', align: 'center' },
                    {
                        key: 'drawn',
                        label: 'Nomor undian',
                        render: (c) =>
                            c.approved === 0 ? (
                                <span className="text-xs text-slate-400">Belum ada peserta</span>
                            ) : c.has_order ? (
                                <span className="badge--status badge--approved">
                                    Sudah diundi ({c.drawn}/{c.approved})
                                </span>
                            ) : (
                                <span className="badge--status badge--pending">Belum diundi</span>
                            ),
                    },
                    {
                        key: 'actions',
                        label: 'Aksi',
                        align: 'right',
                        render: (c) => (
                            <div className="flex flex-wrap justify-end gap-2">
                                <Link
                                    href={`/admin/peserta-lomba/${c.id}`}
                                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Detail
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setPending(c)}
                                    disabled={c.approved === 0}
                                    className="rounded-lg bg-[#064b3d] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0a5b4a] disabled:opacity-40"
                                >
                                    Undi urutan
                                </button>
                            </div>
                        ),
                    },
                ]}
                rows={competitions}
                rowKey={(c) => c.id}
                empty="Belum ada cabang lomba pada event ini."
            />

            <ConfirmDialog
                open={Boolean(pending)}
                title={`Undi urutan ${pending?.name ?? ''}?`}
                message="Nomor tampil seluruh peserta yang sudah disetujui akan diacak ulang. Nilai yang sudah diinput tidak berubah."
                confirmLabel="Undi sekarang"
                tone="primary"
                onConfirm={runDraw}
                onClose={() => setPending(null)}
            />
        </AppLayout>
    );
}
