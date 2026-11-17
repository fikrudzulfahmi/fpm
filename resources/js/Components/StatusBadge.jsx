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

export function AiStatusBadge({ status }) {
    if (!status) return null;

    const labels = {
        pending: 'AI: menunggu',
        valid: 'AI: cocok',
        warning: 'AI: perlu dicek',
        mismatch: 'AI: tidak cocok',
    };

    return (
        <span className={`badge badge--status badge--ai ${aiStyles[status] ?? aiStyles.pending}`}>
            {labels[status] ?? status}
        </span>
    );
}
