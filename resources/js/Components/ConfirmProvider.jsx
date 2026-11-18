import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

const ConfirmContext = createContext(null);
const EVENT_NAME = 'fpm:confirm';

/**
 * Dialog konfirmasi imperatif: `const ok = await confirm({ title, message })`.
 *
 * Selain context, permintaan dikirim lewat event window. Dengan begitu dialog
 * tetap muncul walau bundler memuat modul ini sebagai instans terpisah
 * (gejala: tombol hapus/aktifkan tidak bereaksi karena context berbeda).
 */
export function ConfirmProvider({ children }) {
    const [state, setState] = useState(null);
    const resolveRef = useRef(null);

    const open = useCallback((options) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setState({ options: typeof options === 'string' ? { message: options } : options });
        });
    }, []);

    useEffect(() => {
        const onRequest = (event) => {
            const { options, resolve } = event.detail ?? {};

            open(options).then((value) => resolve?.(value));
        };

        window.addEventListener(EVENT_NAME, onRequest);

        return () => window.removeEventListener(EVENT_NAME, onRequest);
    }, [open]);

    const settle = (result) => {
        resolveRef.current?.(result);
        resolveRef.current = null;
        setState(null);
    };

    return (
        <ConfirmContext.Provider value={open}>
            {children}

            <ConfirmDialog
                open={Boolean(state)}
                title={state?.options?.title}
                message={state?.options?.message}
                confirmLabel={state?.options?.confirmLabel}
                cancelLabel={state?.options?.cancelLabel}
                tone={state?.options?.tone ?? 'danger'}
                onConfirm={() => settle(true)}
                onClose={() => settle(false)}
            />
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    // Selalu lewat event window: context tidak dipakai karena bisa berbeda
    // instans antar chunk (dialog jadi tidak muncul sama sekali).
    return useCallback(
        (options) =>
            new Promise((resolve) => {
                window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { options, resolve } }));
            }),
        [],
    );
}
