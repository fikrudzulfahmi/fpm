import { statusLabel } from '../lib/format';

const styles = {
    pending: 'bg-amber-100 text-amber-800 ring-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    rejected: 'bg-rose-100 text-rose-800 ring-rose-200',
    valid: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    warning: 'bg-amber-100 text-amber-800 ring-amber-200',
    mismatch: 'bg-rose-100 text-rose-800 ring-rose-200',
};

export default function StatusBadge({ status, label }) {
    if (!status) return null;

    const cls = styles[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
    const text = label ?? statusLabel[status] ?? status;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
        >
            {text}
        </span>
    );
}

const aiStyles = {
    pending: 'bg-slate-100 text-slate-700 ring-slate-200',
    valid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    mismatch: 'bg-rose-50 text-rose-700 ring-rose-200',
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
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                aiStyles[status] ?? aiStyles.pending
            }`}
        >
            {labels[status] ?? status}
        </span>
    );
}
