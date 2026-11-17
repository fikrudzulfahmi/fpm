import { createContext, useCallback, useContext, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

const ConfirmContext = createContext(async () => false);

/**
 * Dialog konfirmasi imperatif: `const ok = await confirm({ title, message })`.
 * Dipasang sekali di AppLayout supaya semua halaman memakai dialog bertema,
 * bukan window.confirm bawaan browser.
 */
export function ConfirmProvider({ children }) {
    const [state, setState] = useState(null);

    const confirm = useCallback(
        (options) => new Promise((resolve) => setState({ options: typeof options === 'string' ? { message: options } : options, resolve })),
        [],
    );

    const settle = (result) => {
        state?.resolve(result);
        setState(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
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
    return useContext(ConfirmContext);
}
