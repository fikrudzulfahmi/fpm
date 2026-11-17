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

    return (
        <div className={`field ${className}`.trim()} data-invalid={message ? 'true' : 'false'}>
            {label && (
                <label htmlFor={id}>
                    {label}
                    {required && (
                        <span className="req" aria-hidden="true">
                            {' '}
                            *
                        </span>
                    )}
                </label>
            )}
            <Tag id={id} name={name} required={required} aria-invalid={message ? 'true' : 'false'} {...props}>
                {children}
            </Tag>
            {hint && !message && <p className="hint">{hint}</p>}
            <p className="err" role={message ? 'alert' : undefined}>
                {message ?? ''}
            </p>
        </div>
    );
}

export function ErrorList({ errors, field }) {
    const list = errors?.[field];
    if (!list) return null;
    const items = Array.isArray(list) ? list : [list];

    return (
        <ul className="form-note" style={{ display: 'block', listStyle: 'disc', paddingLeft: '2.6rem' }}>
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    );
}
