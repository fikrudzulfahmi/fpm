import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

const ToastContext = createContext(null);

const ICONS = {
    success: 'm4 12.5 5 5L20 6.5',
    error: 'M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
    info: 'M12 11v5m0-8h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
};

function ToastIcon({ tone }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONS[tone] ?? ICONS.info} />
        </svg>
    );
}

/**
 * Notifikasi ringkas (toast) bertema FPM.
 *
 * Pesan dari server (`flash.success` / `flash.error`) otomatis muncul, dan
 * komponen lain bisa memanggil `useToast()` untuk memberi umpan balik lokal.
 */
export function ToastProvider({ children }) {
    const { flash } = usePage().props;
    const [toasts, setToasts] = useState([]);
    const lastFlash = useRef(null);

    const remove = useCallback((id) => {
        setToasts((list) => list.filter((toast) => toast.id !== id));
    }, []);

    const push = useCallback(
        (message, tone = 'success') => {
            if (!message) return;

            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setToasts((list) => [...list.slice(-3), { id, message: String(message), tone }]);
            window.setTimeout(() => remove(id), 4500);
        },
        [remove],
    );

    const api = useMemo(
        () => ({
            success: (message) => push(message, 'success'),
            error: (message) => push(message, 'error'),
            info: (message) => push(message, 'info'),
        }),
        [push],
    );

    // Flash dari Laravel → toast. Dedupe agar tidak berulang saat pindah halaman.
    useEffect(() => {
        const success = flash?.success ?? null;
        const error = flash?.error ?? null;
        const key = `${success ?? ''}|${error ?? ''}`;

        if (!success && !error) {
            lastFlash.current = null;
            return;
        }

        if (lastFlash.current === key) return;
        lastFlash.current = key;

        if (success) push(success, 'success');
        else push(error, 'error');
    }, [flash?.success, flash?.error, push]);

    return (
        <ToastContext.Provider value={api}>
            {children}

            <div className="toast-stack" role="status" aria-live="polite">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast--${toast.tone}`}>
                        <span className="toast__icon" aria-hidden="true">
                            <ToastIcon tone={toast.tone} />
                        </span>
                        <p className="toast__text">{toast.message}</p>
                        <button type="button" className="toast__close" onClick={() => remove(toast.id)} aria-label="Tutup notifikasi">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

const noop = { success() {}, error() {}, info() {} };

export function useToast() {
    return useContext(ToastContext) ?? noop;
}
