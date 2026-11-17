import { statusLabel } from '../lib/format';

const styles = {
    pending: 'badge--pending',
    approved: 'badge--approved',
    rejected: 'badge--rejected',
    valid: 'badge--approved',
    warning: 'badge--pending',
    mismatch: 'badge--rejected',
};

export default function StatusBadge({ status, label }) {
    if (!status) return null;

    const cls = styles[status] ?? 'badge--neutral';
    const text = label ?? statusLabel[status] ?? status;

    return <span className={`badge badge--status ${cls}`}>{text}</span>;
}

const aiStyles = {
    pending: 'badge--neutral',
    valid: 'badge--approved',
    warning: 'badge--pending',
    mismatch: 'badge--rejected',
};

export function DocumentStatusBadge({ status }) {
    if (!status) return null;

    const labels = {
        pending: 'Menunggu pemeriksaan',
        valid: 'Dokumen Sesuai',
        warning: 'Perlu dicek',
        mismatch: 'Dokumen Tidak Sesuai',
    };

    return (
        <span className={`badge badge--status badge--ai ${aiStyles[status] ?? aiStyles.pending}`}>
            {labels[status] ?? status}
        </span>
    );
}

// Nama lama tetap diekspor agar pemakaian lain tidak rusak.
export const AiStatusBadge = DocumentStatusBadge;
