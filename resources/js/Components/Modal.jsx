import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Dialog modal bertema FPM (hijau–emas–krem).
 *
 * - Tertutup dengan Escape, klik latar, atau tombol silang.
 * - Scroll halaman dikunci selama terbuka.
 * - `footer` dipakai untuk tombol aksi (rata kanan).
 */
export default function Modal({
    open,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = 'md',
    labelledBy,
}) {
    const cardRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };

        document.addEventListener('keydown', onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Fokuskan dialog supaya pembaca layar langsung berada di dalamnya.
        const timer = window.setTimeout(() => cardRef.current?.focus(), 30);

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previous;
            window.clearTimeout(timer);
        };
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className="modal" role="presentation">
            <button type="button" className="modal__backdrop" aria-label="Tutup dialog" onClick={onClose} />

            <div
                ref={cardRef}
                className={`modal__card modal__card--${size}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy ?? (title ? 'modal-title' : undefined)}
                tabIndex={-1}
            >
                <header className="modal__head">
                    <div className="min-w-0">
                        <h2 id="modal-title" className="modal__title">
                            {title}
                        </h2>
                        {subtitle && <p className="modal__sub">{subtitle}</p>}
                    </div>
                    <button type="button" className="modal__close" onClick={onClose} aria-label="Tutup">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </header>

                <div className="modal__body">{children}</div>

                {footer && <footer className="modal__foot">{footer}</footer>}
            </div>
        </div>,
        document.body,
    );
}
