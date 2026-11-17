import { useCallback, useEffect, useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import { useConfirm } from '../../../Components/ConfirmProvider';

function ColorField({ id, label, value, onChange, error }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
                {label}
            </label>
            <div className="flex items-center gap-2">
                <input
                    id={id}
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-white p-1"
                />
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs"
                />
            </div>
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
    );
}

function TextField({ id, label, value, onChange, error, placeholder }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
                {label}
            </label>
            <input
                id={id}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
    );
}

function BackgroundUploader({ target, currentUrl, onDone }) {
    const confirm = useConfirm();
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);

    const upload = () => {
        if (!file) return;
        const data = new FormData();
        data.append('target', target);
        data.append('image', file);

        router.post('/admin/sertifikat/latar', data, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => {
                setBusy(false);
                setFile(null);
                onDone?.();
            },
        });
    };

    const remove = async () => {
        const ok = await confirm({
            title: 'Hapus latar sertifikat?',
            message: 'Latar yang dihapus akan kembali memakai latar bawaan tema.',
            confirmLabel: 'Hapus latar',
        });
        if (!ok) return;
        router.delete('/admin/sertifikat/latar', {
            data: { target },
            preserveScroll: true,
            onFinish: () => onDone?.(),
        });
    };

    return (
        <div className="rounded-lg border border-dashed border-slate-300 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Gambar latar</p>

            {currentUrl ? (
                <div className="flex items-center gap-3">
                    <img src={currentUrl} alt="Latar" className="h-16 w-24 rounded border border-slate-200 object-cover" />
                    <button type="button" onClick={remove} className="text-xs font-semibold text-rose-600 hover:underline">
                        Hapus latar
                    </button>
                </div>
            ) : (
                <p className="text-xs text-slate-400">Belum ada latar. Unggah JPG/PNG/WebP (maks 4 MB).</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="text-xs"
                />
                <button
                    type="button"
                    onClick={upload}
                    disabled={!file || busy}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                    {busy ? 'Mengunggah…' : 'Unggah'}
                </button>
            </div>
        </div>
    );
}


const CLAMPS = { x: [0, 100], y: [0, 100], w: [3, 100], size: [4, 72] };

const clampValue = (key, value) => {
    const [min, max] = CLAMPS[key] ?? [0, 999];
    return Math.min(max, Math.max(min, Number(value) || 0));
};

const ELEMENT_LABELS = {
    logo: 'Logo',
    kicker: 'Teks kecil atas',
    event: 'Nama event',
    title: 'Judul',
    given_to: 'Teks pengantar',
    name: 'Nama peserta',
    school: 'Sekolah',
    competition: 'Cabang lomba',
    body: 'Keterangan',
    signature: 'Tanda tangan',
    footer: 'Catatan kaki',
    badge: 'Badge peringkat',
    members: 'Anggota regu',
    meta: 'Nomor dokumen',
};

function blockContent(key, { type, sample, doc }) {
    const name = sample?.name ?? 'Nama Peserta';
    const school = sample?.school ?? 'Nama Sekolah';
    const competition = sample?.competition ?? 'Cabang Lomba';
    const eventName = 'Festival Pelajar Muslim · 2026';

    const map = {
        kicker: type === 'award' ? 'PIAGAM PENGHARGAAN' : 'SERTIFIKAT',
        event: eventName,
        title: type === 'award' ? 'Juara Pertama Putri' : doc.title || 'Sertifikat Peserta',
        given_to: type === 'award' ? 'Diberikan kepada:' : `${(doc.subtitle || 'Diberikan kepada').replace(/:$/, '')}:`,
        name,
        school: type === 'award' ? school : `dari ${school}`,
        competition,
        body:
            type === 'award'
                ? 'Atas prestasinya meraih Juara Pertama pada cabang lomba dalam kegiatan event tahun 2026'
                : 'Atas partisipasinya dalam kegiatan Festival Pelajar Muslim tahun 2026',
        badge: 'I',
        members: 'Anggota: Peserta Satu, Peserta Dua',
        footer: doc.footer || 'Nomor: SRF/2026/00001',
        meta: 'Nomor: PGM/2026/00001',
    };

    if (key === 'signature') {
        return (
            <div>
                <div>{doc.signer_title || 'Ketua Panitia'}</div>
                <div style={{ height: '12mm' }} />
                <div style={{ borderTop: '1px solid currentColor', paddingTop: 2 }}>{doc.signer_name || '\u00a0'}</div>
            </div>
        );
    }

    return map[key] ?? key;
}

function LayoutCanvas({
    type,
    layout,
    defaults,
    bgImage,
    bgColor,
    accentColor,
    textColor,
    logoUrl,
    sample,
    doc,
    onChange,
    onReset,
}) {
    const canvasRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [drag, setDrag] = useState(null);
    const [selected, setSelected] = useState(null);

    // 1 mm = 3.7795 px; kanvas mewakili area 267mm x 180mm.
    useEffect(() => {
        const node = canvasRef.current;
        if (!node) return undefined;

        const measure = () => setScale(node.getBoundingClientRect().width / 267);
        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    const update = useCallback(
        (key, patch) => {
            const next = { ...layout, [key]: { ...layout[key], ...patch } };
            onChange(next);
        },
        [layout, onChange],
    );

    const startDrag = (event, key) => {
        const node = canvasRef.current;
        if (!node) return;

        event.preventDefault();
        event.stopPropagation();
        setSelected(key);

        const rect = node.getBoundingClientRect();
        node.setPointerCapture?.(event.pointerId);
        setDrag({
            key,
            startX: event.clientX,
            startY: event.clientY,
            originX: Number(layout[key]?.x ?? 0),
            originY: Number(layout[key]?.y ?? 0),
            width: rect.width,
            height: rect.height,
        });
    };

    const onPointerMove = (event) => {
        if (!drag) return;

        const dx = ((event.clientX - drag.startX) / drag.width) * 100;
        const dy = ((event.clientY - drag.startY) / drag.height) * 100;

        update(drag.key, {
            x: Math.round(clampValue('x', drag.originX + dx) * 10) / 10,
            y: Math.round(clampValue('y', drag.originY + dy) * 10) / 10,
        });
    };

    const endDrag = (event) => {
        if (!drag) return;
        canvasRef.current?.releasePointerCapture?.(event.pointerId);
        setDrag(null);
    };

    const keys = Object.keys(defaults).filter((key) => (key === 'members' ? type === 'award' : true));
    const active = selected && layout[selected] ? selected : null;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Editor tata letak</p>
                    <p className="text-[11px] text-slate-500">
                        Geser blok teks langsung di kanvas, lalu atur ukuran huruf &amp; lebar di panel kanan.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setSelected(null);
                        onReset(defaults);
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                    Atur ulang tata letak
                </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div
                    className="relative w-full overflow-hidden rounded-lg border border-slate-200"
                    style={{ aspectRatio: '297 / 210', background: bgImage ? '#e2e8f0' : bgColor }}
                >
                    <div
                        ref={canvasRef}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        className="absolute inset-[2.7%] touch-none select-none"
                        style={{
                            background: bgImage ? `center / cover no-repeat url(${bgImage})` : bgColor,
                            border: `3px solid ${accentColor}`,
                            boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.55)',
                            color: textColor,
                        }}
                    >
                        <div className="pointer-events-none absolute inset-0 border" style={{ borderColor: accentColor, opacity: 0.35 }} />

                        {keys.map((key) => {
                            const item = layout[key] ?? defaults[key];
                            const isActive = active === key;
                            const isLogo = key === 'logo';

                            return (
                                <div
                                    key={key}
                                    onPointerDown={(event) => startDrag(event, key)}
                                    className={`absolute cursor-move ${
                                        isActive ? 'ring-2 ring-sky-400 ring-offset-1' : 'hover:ring-1 hover:ring-sky-300'
                                    }`}
                                    style={{
                                        left: `${item.x}%`,
                                        top: `${item.y}%`,
                                        width: `${item.w}%`,
                                        textAlign: item.align,
                                        fontSize: `${Math.max(4, Number(item.size) || 10) * 0.3528 * scale}px`,
                                        lineHeight: key === 'title' ? 1.15 : 1.35,
                                        letterSpacing: ['kicker', 'title', 'competition'].includes(key) ? '0.08em' : undefined,
                                        textTransform: ['kicker', 'title', 'competition'].includes(key) ? 'uppercase' : undefined,
                                        fontWeight: ['event', 'title', 'name', 'competition', 'badge'].includes(key) ? 700 : 400,
                                        color: ['title', 'kicker', 'competition', 'badge'].includes(key) ? accentColor : textColor,
                                    }}
                                >
                                    {isLogo ? (
                                        logoUrl ? (
                                            <img src={logoUrl} alt="Logo" className="w-full" draggable={false} />
                                        ) : (
                                            <div className="grid h-10 w-full place-items-center rounded bg-slate-100 text-[10px] text-slate-400">
                                                Logo event
                                            </div>
                                        )
                                    ) : (
                                        blockContent(key, { type, sample, doc })
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {active ? ELEMENT_LABELS[active] ?? active : 'Pilih blok'}
                    </p>

                    {active ? (
                        <div className="space-y-2">
                            {[
                                ['x', 'Posisi X (%)'],
                                ['y', 'Posisi Y (%)'],
                                ['w', 'Lebar (%)'],
                                ['size', 'Ukuran huruf (pt)'],
                            ].map(([field, label]) => (
                                <label key={field} className="block">
                                    <span className="mb-0.5 block text-[11px] text-slate-500">{label}</span>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={layout[active]?.[field] ?? 0}
                                        onChange={(e) => update(active, { [field]: clampValue(field, e.target.value) })}
                                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                    />
                                </label>
                            ))}

                            <div>
                                <span className="mb-0.5 block text-[11px] text-slate-500">Perataan</span>
                                <div className="flex gap-1">
                                    {['left', 'center', 'right'].map((align) => (
                                        <button
                                            key={align}
                                            type="button"
                                            onClick={() => update(active, { align })}
                                            className={`flex-1 rounded border px-1 py-1 text-[11px] font-semibold ${
                                                layout[active]?.align === align
                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                    : 'border-slate-300 text-slate-600'
                                            }`}
                                        >
                                            {align === 'left' ? 'Kiri' : align === 'center' ? 'Tengah' : 'Kanan'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400">Klik salah satu blok di kanvas untuk mengatur posisi presisi.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CertificateIndex({
    settings = {},
    certificate = {},
    award = {},
    awards = [],
    sample_registration_id = null,
    sample = {},
    layouts_default = {},
    logo_url = null,
}) {
    const form = useForm({
        publish_scores: Boolean(settings.publish_scores),
        enable_certificates: Boolean(settings.enable_certificates),
        certificate: {
            title: certificate.title ?? 'Sertifikat Peserta',
            subtitle: certificate.subtitle ?? 'Diberikan kepada',
            footer: certificate.footer ?? '',
            bg_color: certificate.bg_color ?? '#f8f6ec',
            text_color: certificate.text_color ?? '#0d3029',
            accent_color: certificate.accent_color ?? '#064b3d',
            signer_name: certificate.signer_name ?? '',
            signer_title: certificate.signer_title ?? 'Ketua Panitia',
            signer2_name: certificate.signer2_name ?? '',
            signer2_title: certificate.signer2_title ?? 'Sekretaris Panitia',
            show_signature: certificate.show_signature !== false,
            show_logo: certificate.show_logo !== false,
            layout: certificate.layout ?? {},
        },
        award: {
            bg_color: award.bg_color ?? '#ffffff',
            text_color: award.text_color ?? '#1e293b',
            accent_color: award.accent_color ?? '#064b3d',
            signer_name: award.signer_name ?? '',
            signer_title: award.signer_title ?? 'Ketua Panitia',
            place: award.place ?? '',
            number_prefix: award.number_prefix ?? '',
            show_logo: award.show_logo !== false,
            layout: award.layout ?? {},
        },
    });

    const setCert = (key, value) => form.setData('certificate', { ...form.data.certificate, [key]: value });
    const setAward = (key, value) => form.setData('award', { ...form.data.award, [key]: value });

    const submit = (event) => {
        event.preventDefault();
        form.put('/admin/sertifikat', { preserveScroll: true });
    };

    const previewUrl = (type) =>
        `/admin/sertifikat/pratinjau?type=${type}${sample_registration_id ? `&registration_id=${sample_registration_id}` : ''}`;

    return (
        <AppLayout title="Sertifikat & Piagam">
            <Head title="Sertifikat & Piagam" />

            <div className="mb-5">
                <h2 className="page-title">Sertifikat Peserta & Piagam Juara</h2>
                <p className="text-sm text-slate-500">
                    Atur akses unduh, palet warna, latar, dan penandatangan. Pratinjau memakai PDF asli.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <section className="panel panel--pad">
                    <h3 className="panel__title mb-3">Kontrol Akses</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                            <input
                                type="checkbox"
                                checked={form.data.enable_certificates}
                                onChange={(e) => form.setData('enable_certificates', e.target.checked)}
                                className="mt-1 h-4 w-4"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-slate-800">Buka akses sertifikat</span>
                                <span className="text-xs text-slate-500">Tombol unduh peserta aktif setelah ini dicentang.</span>
                            </span>
                        </label>

                        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                            <input
                                type="checkbox"
                                checked={form.data.publish_scores}
                                onChange={(e) => form.setData('publish_scores', e.target.checked)}
                                className="mt-1 h-4 w-4"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-slate-800">Publikasikan nilai</span>
                                <span className="text-xs text-slate-500">Sekolah melihat rekap nilai & peringkat.</span>
                            </span>
                        </label>
                    </div>
                </section>

                <section className="panel panel--pad">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="panel__title">Desain Sertifikat Peserta</h3>
                        <a
                            href={previewUrl('certificate')}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-slate-600 underline"
                        >
                            Pratinjau PDF
                        </a>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <TextField
                            id="cert-title"
                            label="Judul"
                            value={form.data.certificate.title}
                            onChange={(v) => setCert('title', v)}
                            error={form.errors['certificate.title']}
                        />
                        <TextField
                            id="cert-subtitle"
                            label="Teks pengantar"
                            value={form.data.certificate.subtitle}
                            onChange={(v) => setCert('subtitle', v)}
                        />
                        <TextField
                            id="cert-footer"
                            label="Catatan kaki"
                            value={form.data.certificate.footer}
                            onChange={(v) => setCert('footer', v)}
                        />
                        <ColorField
                            id="cert-bg"
                            label="Warna latar"
                            value={form.data.certificate.bg_color}
                            onChange={(v) => setCert('bg_color', v)}
                            error={form.errors['certificate.bg_color']}
                        />
                        <ColorField
                            id="cert-text"
                            label="Warna teks"
                            value={form.data.certificate.text_color}
                            onChange={(v) => setCert('text_color', v)}
                            error={form.errors['certificate.text_color']}
                        />
                        <ColorField
                            id="cert-accent"
                            label="Warna aksen"
                            value={form.data.certificate.accent_color}
                            onChange={(v) => setCert('accent_color', v)}
                            error={form.errors['certificate.accent_color']}
                        />
                        <TextField
                            id="cert-signer"
                            label="Nama penandatangan"
                            value={form.data.certificate.signer_name}
                            onChange={(v) => setCert('signer_name', v)}
                        />
                        <TextField
                            id="cert-signer-title"
                            label="Jabatan penandatangan"
                            value={form.data.certificate.signer_title}
                            onChange={(v) => setCert('signer_title', v)}
                        />
                        <TextField
                            id="cert-signer2"
                            label="Nama penandatangan kedua"
                            value={form.data.certificate.signer2_name}
                            onChange={(v) => setCert('signer2_name', v)}
                        />
                        <TextField
                            id="cert-signer2-title"
                            label="Jabatan penandatangan kedua"
                            value={form.data.certificate.signer2_title}
                            onChange={(v) => setCert('signer2_title', v)}
                        />
                        <label className="flex items-center gap-2 self-end text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={form.data.certificate.show_signature}
                                onChange={(e) => setCert('show_signature', e.target.checked)}
                                className="h-4 w-4"
                            />
                            Tampilkan kolom tanda tangan
                        </label>
                    </div>

                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-[13px] leading-relaxed text-amber-900">
                        <p className="font-semibold">Template resmi FPM XII dipakai otomatis.</p>
                        <p className="mt-1">
                            Tata letak (bingkai hijau-emas, ornamen sudut, nama besar, dua tanda tangan,
                            nomor &amp; tanggal) mengikuti desain panitia, jadi posisi elemen tidak lagi
                            diatur lewat kanvas. Isi teks, nama penandatangan, dan warna tetap bisa diubah
                            di panel ini.
                        </p>
                        <a
                            href={previewUrl('certificate')}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 font-semibold text-[#064b3d] underline"
                        >
                            Lihat pratinjau PDF
                        </a>
                    </div>

                    <div className="mt-4">
                        <BackgroundUploader target="certificate" currentUrl={certificate.bg_image_url ?? null} />
                    </div>
                </section>

                <section className="panel panel--pad">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="panel__title">Desain Piagam Juara</h3>
                        <a
                            href={previewUrl('award')}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-slate-600 underline"
                        >
                            Pratinjau PDF
                        </a>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <ColorField
                            id="award-bg"
                            label="Warna latar"
                            value={form.data.award.bg_color}
                            onChange={(v) => setAward('bg_color', v)}
                            error={form.errors['award.bg_color']}
                        />
                        <ColorField
                            id="award-text"
                            label="Warna teks"
                            value={form.data.award.text_color}
                            onChange={(v) => setAward('text_color', v)}
                        />
                        <ColorField
                            id="award-accent"
                            label="Warna aksen"
                            value={form.data.award.accent_color}
                            onChange={(v) => setAward('accent_color', v)}
                        />
                        <TextField
                            id="award-signer"
                            label="Nama penandatangan"
                            value={form.data.award.signer_name}
                            onChange={(v) => setAward('signer_name', v)}
                        />
                        <TextField
                            id="award-signer-title"
                            label="Jabatan penandatangan"
                            value={form.data.award.signer_title}
                            onChange={(v) => setAward('signer_title', v)}
                        />
                        <TextField
                            id="award-place"
                            label="Kota penerbitan"
                            value={form.data.award.place}
                            onChange={(v) => setAward('place', v)}
                            placeholder="Blitar"
                        />
                        <TextField
                            id="award-prefix"
                            label="Nomor piagam (awalan)"
                            value={form.data.award.number_prefix}
                            onChange={(v) => setAward('number_prefix', v)}
                            placeholder="001/FPM/XII/2027"
                        />
                    </div>

                    <div className="mt-4">
                        <LayoutCanvas
                            type="award"
                            layout={form.data.award.layout ?? {}}
                            defaults={layouts_default.award ?? {}}
                            bgImage={award.bg_image_url ?? null}
                            bgColor={form.data.award.bg_color}
                            accentColor={form.data.award.accent_color}
                            textColor={form.data.award.text_color}
                            logoUrl={logo_url}
                            sample={sample}
                            doc={form.data.award}
                            onChange={(next) => setAward('layout', next)}
                            onReset={(next) => setAward('layout', next)}
                        />
                    </div>

                    <div className="mt-4">
                        <BackgroundUploader target="award" currentUrl={award.bg_image_url ?? null} />
                    </div>
                </section>

                <div className="sticky bottom-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                        style={{ backgroundColor: 'var(--primary-color, #064b3d)' }}
                    >
                        {form.processing ? 'Menyimpan…' : 'Simpan semua setelan'}
                    </button>
                </div>
            </form>

            <section className="panel panel--flush mt-6">
                <div className="border-b border-slate-100 px-5 py-3">
                    <h3 className="panel__title">Cetak Piagam Juara</h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Daftar pendaftaran yang sudah punya peringkat. Piagam dibuat dari nilai & peringkat terakhir.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-2 font-semibold">Cabang</th>
                                <th className="px-4 py-2 font-semibold">Peringkat</th>
                                <th className="px-4 py-2 font-semibold">Pemenang</th>
                                <th className="px-4 py-2 font-semibold">Nilai</th>
                                <th className="px-4 py-2 font-semibold">Piagam</th>
                            </tr>
                        </thead>
                        <tbody className="data-table__body">
                            {awards.map((row) => (
                                <tr key={row.id}>
                                    <td className="px-4 py-2 text-slate-700">{row.competition}</td>
                                    <td className="px-4 py-2 font-semibold text-slate-900">#{row.rank}</td>
                                    <td className="px-4 py-2">
                                        <p className="font-medium text-slate-800">{row.display_name}</p>
                                        <p className="text-xs text-slate-500">{row.school}</p>
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">{row.score_value ?? '-'}</td>
                                    <td className="px-4 py-2">
                                        <a
                                            href={`/admin/piagam/${row.id}`}
                                            className="text-xs font-semibold text-slate-700 underline"
                                        >
                                            Unduh PDF
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {awards.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                                        Belum ada nilai/peringkat. Input nilai di menu Penilaian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AppLayout>
    );
}
