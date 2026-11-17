export function formatDate(value, { withTime = false } = {}) {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(date);
}

export function formatDateTime(value) {
    return formatDate(value, { withTime: true });
}

export const statusLabel = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

export const aiStatusLabel = {
    pending: 'AI belum cek',
    valid: 'AI: cocok',
    warning: 'AI: perlu dicek',
    mismatch: 'AI: tidak cocok',
};

export function waLink(number, text = '') {
    if (!number) return null;

    const clean = String(number).replace(/[^\d]/g, '');
    const normalized = clean.startsWith('0') ? `62${clean.slice(1)}` : clean;

    return `https://wa.me/${normalized}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** Ambil pesan error pertama untuk sebuah key dari props.errors Inertia. */
export function firstError(errors, key) {
    if (!errors) return null;
    const value = errors[key];
    if (!value) return null;
    return Array.isArray(value) ? value[0] : value;
}

/** Semua pesan error untuk key tertentu sebagai array. */
export function errorList(errors, key) {
    if (!errors) return [];
    const value = errors[key];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}
