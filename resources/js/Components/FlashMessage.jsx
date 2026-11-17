import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

export default function FlashMessage({ timeout = 4000 }) {
    const { flash } = usePage().props;
    const success = flash?.success ?? null;
    const error = flash?.error ?? null;

    const [visible, setVisible] = useState(Boolean(success || error));

    // Pesan baru dari server: tampilkan lagi dan reset timer.
    useEffect(() => {
        setVisible(Boolean(success || error));
    }, [success, error]);

    useEffect(() => {
        if (!visible) return undefined;

        const id = setTimeout(() => setVisible(false), timeout);
        return () => clearTimeout(id);
    }, [visible, success, error, timeout]);

    if (!visible || (!success && !error)) return null;

    const isSuccess = Boolean(success);
    const message = success ?? error;

    return (
        <div role="status" className={`flash ${isSuccess ? 'flash--ok' : 'flash--err'}`}>
            <span className="font-semibold">{isSuccess ? 'Berhasil' : 'Gagal'}</span>
            <p className="flex-1 whitespace-pre-line">{message}</p>
            <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="Tutup notifikasi"
                className="-mr-1 rounded p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
            >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
            </button>
        </div>
    );
}
