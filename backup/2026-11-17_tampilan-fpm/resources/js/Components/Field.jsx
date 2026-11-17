import { firstError } from '../lib/format';

/**
 * Input teks standar: label, error inline, hint opsional.
 * Semua props lain diteruskan ke elemen input/select/textarea.
 */
export default function Field({
    label,
    name,
    error,
    hint,
    required = false,
    as = 'input',
    className = '',
    children,
    ...props
}) {
    const Tag = as;
    const message = typeof error === 'string' ? error : firstError(error, name);
    const id = props.id ?? `field-${name}`;

    const base =
        'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:text-slate-500';
    const border = message
        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
        : 'border-slate-300 focus:border-slate-400 focus:ring-slate-200';

    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
                    {label}
                    {required && <span className="ml-0.5 text-rose-600">*</span>}
                </label>
            )}
            <Tag id={id} name={name} className={`${base} ${border}`} {...props}>
                {children}
            </Tag>
            {hint && !message && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
            {message && <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>}
        </div>
    );
}

export function ErrorList({ errors, field }) {
    const list = errors?.[field];
    if (!list) return null;
    const items = Array.isArray(list) ? list : [list];

    return (
        <ul className="mt-2 space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    );
}
