const variants = {
    primary: 'text-white shadow-sm',
    secondary: 'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
    ghost: 'text-slate-700 hover:bg-slate-100',
    success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
};

/**
 * Tombol seragam. `as === 'a'` dipakai untuk tautan unduhan / navigasi luar.
 */
export default function Button({
    as = 'button',
    variant = 'primary',
    size = 'md',
    className = '',
    style,
    children,
    ...props
}) {
    const Tag = as;
    const cls = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        variants[variant] ?? variants.primary
    } ${sizes[size] ?? sizes.md} ${className}`;

    const themedStyle =
        variant === 'primary' ? { backgroundColor: 'var(--primary-color, #064b3d)', ...style } : style;

    return (
        <Tag className={cls} style={themedStyle} {...props}>
            {children}
        </Tag>
    );
}
