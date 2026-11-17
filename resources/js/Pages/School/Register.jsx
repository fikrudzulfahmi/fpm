import { useMemo, useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Field, { ErrorList } from '../../Components/Field';

function csrfToken() {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

const emptyRow = () => ({ nisn: '', full_name: '', gender: '', birth_date: '', _key: Math.random().toString(36).slice(2) });

/** Aturan kuota: kembalikan alasan penutupan atau null kalau boleh didaftar. */
function lockReason(competition) {
    if (!competition) return null;
    if (!competition.is_open) return 'Pendaftaran cabang lomba ini sedang ditutup panitia.';
    if (Number(competition.remaining_global) <= 0) return 'Kuota global cabang lomba ini sudah penuh.';
    if (Number(competition.remaining_school) <= 0) return 'Kuota sekolah Anda untuk cabang lomba ini sudah habis.';
    return null;
}

function ParticipantRow({
    index,
    row,
    isGroup,
    canRemove,
    onChange,
    onRemove,
    onBlurNisn,
    nisnState,
    rowError,
}) {
    const state = nisnState[row._key];

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {isGroup ? `Anggota ${index + 1}` : 'Peserta'}
                </p>
                {isGroup && canRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(row._key)}
                        className="rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                        Hapus
                    </button>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <Field
                        label="NISN"
                        name={`nisn-${row._key}`}
                        required
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10 digit"
                        value={row.nisn}
                        onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                            onChange(index, 'nisn', v);
                        }}
                        onBlur={() => onBlurNisn(index, row)}
                        error={rowError?.(index, 'nisn')}
                        className="[&_label]:text-xs"
                    />
                    {state?.checking && <p className="mt-1 text-xs text-slate-500">Memeriksa NISN…</p>}
                    {!state?.checking && state?.message && (
                        <p
                            className={`mt-1 text-xs font-medium ${
                                state.ok ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                        >
                            {state.message}
                        </p>
                    )}
                </div>

                <Field
                    label="Nama Lengkap"
                    name={`name-${row._key}`}
                    required
                    value={row.full_name}
                    onChange={(e) => onChange(index, 'full_name', e.target.value)}
                    error={rowError?.(index, 'full_name')}
                    className="[&_label]:text-xs"
                />

                <Field
                    label="Jenis Kelamin"
                    name={`gender-${row._key}`}
                    as="select"
                    required
                    value={row.gender}
                    onChange={(e) => onChange(index, 'gender', e.target.value)}
                    error={rowError?.(index, 'gender')}
                    className="[&_label]:text-xs"
                >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                </Field>

                <Field
                    label="Tanggal Lahir"
                    name={`birth-${row._key}`}
                    type="date"
                    required
                    value={row.birth_date}
                    onChange={(e) => onChange(index, 'birth_date', e.target.value)}
                    error={rowError?.(index, 'birth_date')}
                    className="[&_label]:text-xs"
                />
            </div>
        </div>
    );
}

export default function Register({ competitions = [], school }) {
    const { errors: pageErrors } = usePage().props;

    const [participantRows, setParticipantRows] = useState([emptyRow()]);
    const [nisnState, setNisnState] = useState({});
    const fileRef = useRef(null);

    const form = useForm({
        competition_id: competitions.length === 1 ? competitions[0].id : '',
        group_name: '',
        companion_name: '',
        companion_phone: '',
        participants: [{ nisn: '', full_name: '', gender: '', birth_date: '' }],
        letter: null,
    });

    const selected = useMemo(
        () => competitions.find((c) => String(c.id) === String(form.data.competition_id)) ?? null,
        [competitions, form.data.competition_id],
    );

    const isGroup = selected?.category_type === 'group';
    const lock = lockReason(selected);

    const minMembers = isGroup ? Number(selected?.min_group_members ?? 1) : 1;
    const maxMembers = isGroup ? Number(selected?.max_group_members ?? Math.max(minMembers, 10)) : 1;

    const conflictCount = Object.values(nisnState).filter((s) => s && s.ok === false).length;
    const tooFewMembers = participantRows.length < minMembers;
    const tooManyMembers = participantRows.length > maxMembers;

    const syncParticipants = (rows) => {
        setParticipantRows(rows);
        form.setData(
            'participants',
            rows.map(({ _key, ...rest }) => rest),
        );
    };

    const addRow = () => {
        if (participantRows.length >= maxMembers) return;
        syncParticipants([...participantRows, emptyRow()]);
    };

    const removeRow = (key) => {
        if (participantRows.length <= minMembers) return;
        const next = participantRows.filter((r) => r._key !== key);
        syncParticipants(next);
    };

    const changeRow = (index, fieldName, value) => {
        const next = participantRows.map((row, i) => (i === index ? { ...row, [fieldName]: value } : row));
        syncParticipants(next);

        if (fieldName === 'nisn') {
            setNisnState((prev) => ({ ...prev, [participantRows[index]._key]: null }));
        }
    };

    const onBlurNisn = async (index, row) => {
        const key = participantRows[index]?._key ?? row._key;
        const nisn = String(row.nisn ?? '').trim();

        if (!/^\d{10}$/.test(nisn)) {
            setNisnState((prev) => ({
                ...prev,
                [key]: { ok: false, message: nisn ? 'NISN harus tepat 10 digit angka.' : null },
            }));
            return;
        }

        if (!selected?.id) {
            setNisnState((prev) => ({ ...prev, [key]: { ok: false, message: 'Pilih cabang lomba lebih dulu.' } }));
            return;
        }

        setNisnState((prev) => ({ ...prev, [key]: { checking: true } }));

        try {
            const res = await fetch(
                `/api/nisn-check?nisn=${encodeURIComponent(nisn)}&competition_id=${encodeURIComponent(selected.id)}&gender=${encodeURIComponent(row.gender ?? '')}`,
                {
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': csrfToken(),
                    },
                },
            );

            if (!res.ok) {
                setNisnState((prev) => ({ ...prev, [key]: { ok: false, message: 'Gagal memeriksa NISN.' } }));
                return;
            }

            const body = await res.json();
            const conflict = body?.conflicts?.[0];
            const formatError = body?.errors?.[0];
            const reason = body?.reason;

            if (conflict) {
                setNisnState((prev) => ({
                    ...prev,
                    [key]: {
                        ok: false,
                        message: `NISN ${conflict.nisn} (${conflict.name}) sudah terdaftar di ${conflict.competition}.`,
                    },
                }));
                return;
            }

            if (formatError) {
                setNisnState((prev) => ({ ...prev, [key]: { ok: false, message: formatError } }));
                return;
            }

            if (body?.ok === false && reason) {
                setNisnState((prev) => ({ ...prev, [key]: { ok: false, message: reason } }));
                return;
            }

            const existing = body?.participant;
            setNisnState((prev) => ({
                ...prev,
                [key]: existing
                    ? {
                          ok: false,
                          message: `NISN ini terdaftar di ${existing.competition ?? 'cabang lain'} atas nama ${existing.full_name}.`,
                      }
                    : { ok: true, message: 'NISN tersedia.' },
            }));
        } catch {
            setNisnState((prev) => ({ ...prev, [key]: { ok: false, message: 'Jaringan bermasalah saat memeriksa NISN.' } }));
        }
    };

    const changeCompetition = (value) => {
        form.setData('competition_id', value);
        setNisnState({});

        const next = competitions.find((c) => String(c.id) === String(value));
        const group = next?.category_type === 'group';
        const min = group ? Number(next?.min_group_members ?? 1) : 1;

        const rows = Array.from({ length: Math.max(1, group ? Math.max(min, 1) : 1) }, () => emptyRow());
        syncParticipants(rows);

        if (!group) form.setData('group_name', '');
    };

    // Error baris dari server: participants.0.nisn -> { '0': { nisn: '...' } }
    const rowErrors = useMemo(() => {
        const map = {};
        Object.entries(form.errors ?? {}).forEach(([key, message]) => {
            const match = key.match(/^participants\.(\d+)\.(\w+)$/);
            if (match) {
                const [, idx, fieldName] = match;
                map[idx] = { ...(map[idx] ?? {}), [fieldName]: message };
            }
        });
        return map;
    }, [form.errors]);

    const rowError = (index, fieldName) => rowErrors[index]?.[fieldName];

    const submit = (e) => {
        e.preventDefault();
        form.post('/daftar', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const missingGender = (form.data.participants ?? []).some((row) => !row.gender);
    const blocked = Boolean(lock) || conflictCount > 0 || tooFewMembers || tooManyMembers || missingGender;

    return (
        <AppLayout title="Pendaftaran Baru">
            <Head title="Pendaftaran Baru" />

            <div className="mb-6">
                <p className="text-sm text-slate-500">
                    {school?.school_name ?? 'Sekolah'} · NPSN {school?.npsn ?? '-'}
                </p>
                <h2 className="text-xl font-bold text-slate-900">Formulir Pendaftaran Peserta</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Satu siswa hanya boleh mengikuti satu cabang lomba dalam event ini.
                </p>
            </div>

            {Object.keys(pageErrors ?? {}).length > 0 && (
                <ErrorList errors={{ all: Object.values(pageErrors).flat() }} field="all" />
            )}

            <form onSubmit={submit} className="space-y-5">
                {/* 1. Cabang lomba */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">1. Cabang Lomba</h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Pilih Lomba"
                            name="competition_id"
                            as="select"
                            required
                            value={form.data.competition_id}
                            error={form.errors.competition_id}
                            onChange={(e) => changeCompetition(e.target.value)}
                        >
                            <option value="">— Pilih cabang lomba —</option>
                            {competitions.map((c) => {
                                const reason = lockReason(c);
                                return (
                                    <option key={c.id} value={c.id} disabled={Boolean(reason)}>
                                        {c.name} ({c.category_type === 'group' ? 'beregu' : 'individu'}) · sisa{' '}
                                        {c.remaining_global} global / {c.remaining_school} sekolah
                                        {c.gender_mode === 'separate' && (
                                            <span className="ml-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                                P / W terpisah
                                            </span>
                                        )}
                                        {reason ? ' — tidak tersedia' : ''}
                                    </option>
                                );
                            })}
                        </Field>

                        {selected && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                <p>
                                    Kuota global tersisa:{' '}
                                    <span className="font-semibold text-slate-800">{selected.remaining_global}</span> dari{' '}
                                    {selected.global_quota}
                                </p>
                                <p className="mt-0.5">
                                    Kuota sekolah tersisa:{' '}
                                    <span className="font-semibold text-slate-800">{selected.remaining_school}</span> dari{' '}
                                    {selected.school_quota}
                                </p>
                                {isGroup && (
                                    <p className="mt-0.5">
                                        Anggota grup: {minMembers}–{maxMembers} orang
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {lock && (
                        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            {lock}
                        </p>
                    )}
                </section>

                {/* 2. Nama grup */}
                {isGroup && (
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">2. Data Grup</h3>
                        <Field
                            label="Nama Grup / Tim"
                            name="group_name"
                            required
                            value={form.data.group_name}
                            error={form.errors.group_name}
                            onChange={(e) => form.setData('group_name', e.target.value)}
                            placeholder="Contoh: Tim Elang SMAN 1"
                        />
                    </section>
                )}

                {/* 3. Peserta */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                            {isGroup ? '3. Anggota Grup' : '3. Data Peserta'}
                        </h3>
                        <span className="text-xs text-slate-500">
                            {participantRows.length} peserta
                            {isGroup ? ` · wajib ${minMembers}–${maxMembers}` : ''}
                        </span>
                    </div>

                    <ErrorList errors={form.errors} field="participants" />

                    <div className="space-y-3">
                        {participantRows.map((row, index) => (
                            <ParticipantRow
                                key={row._key}
                                index={index}
                                row={row}
                                isGroup={isGroup}
                                canRemove={participantRows.length > minMembers}
                                onChange={changeRow}
                                onRemove={removeRow}
                                onBlurNisn={onBlurNisn}
                                nisnState={nisnState}
                                rowError={rowError}
                            />
                        ))}
                    </div>

                    {isGroup && participantRows.length < maxMembers && (
                        <button
                            type="button"
                            onClick={addRow}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                        >
                            <span className="text-lg leading-none">+</span> Tambah Anggota
                        </button>
                    )}

                    {tooFewMembers && (
                        <p className="mt-2 text-xs font-medium text-rose-600">
                            Lomba ini minimal {minMembers} anggota. Tambah peserta lagi.
                        </p>
                    )}
                    {tooManyMembers && (
                        <p className="mt-2 text-xs font-medium text-rose-600">
                            Maksimal {maxMembers} anggota. Kurangi peserta.
                        </p>
                    )}
                    {missingGender && (
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            Lengkapi jenis kelamin setiap peserta sebelum mengirim pendaftaran.
                        </p>
                    )}

                    {conflictCount > 0 && (
                        <p className="mt-2 text-xs font-medium text-rose-600">
                            Ada NISN yang tidak valid atau sudah terdaftar. Perbaiki sebelum mengirim.
                        </p>
                    )}
                </section>

                {/* 4. Pendamping */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">4. Pendamping</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Nama Pendamping / Guru Pembina"
                            name="companion_name"
                            required
                            value={form.data.companion_name}
                            error={form.errors.companion_name}
                            onChange={(e) => form.setData('companion_name', e.target.value)}
                        />
                        <Field
                            label="No. WhatsApp Pendamping"
                            name="companion_phone"
                            required
                            inputMode="tel"
                            placeholder="08xxxxxxxxxx"
                            value={form.data.companion_phone}
                            error={form.errors.companion_phone}
                            onChange={(e) => form.setData('companion_phone', e.target.value)}
                        />
                    </div>
                </section>

                {/* 5. Surat rekomendasi */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                        5. Surat Rekomendasi Kepala Sekolah
                    </h3>

                    <label className="block text-sm font-medium text-slate-700">
                        Unggah berkas
                        <span className="ml-0.5 text-rose-600">*</span>
                    </label>
                    <input
                        ref={fileRef}
                        type="file"
                        name="letter"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => form.setData('letter', e.target.files?.[0] ?? null)}
                        className={`mt-1 block w-full cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 ${
                            form.errors.letter ? 'border-rose-400' : 'border-slate-300'
                        }`}
                    />
                    <p className="mt-1 text-xs text-slate-500">Format PDF/JPG/PNG, maksimal 5 MB.</p>
                    {form.data.letter && (
                        <p className="mt-1 text-xs text-slate-700">
                            Terpilih: <span className="font-medium">{form.data.letter.name}</span>
                        </p>
                    )}
                    {form.errors.letter && (
                        <p className="mt-1 text-xs font-medium text-rose-600">{form.errors.letter}</p>
                    )}
                </section>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="submit"
                        disabled={form.processing || blocked}
                        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                    >
                        {form.processing ? 'Mengirim…' : 'Kirim Pendaftaran'}
                    </button>
                    <Link
                        href="/dashboard"
                        className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                        Batal
                    </Link>
                </div>
            </form>
        </AppLayout>
    );
}
