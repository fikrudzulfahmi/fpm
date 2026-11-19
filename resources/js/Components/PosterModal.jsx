import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import Modal from './Modal';

const STORAGE_KEY = 'fpm:poster-dismissed';

/**
 * Popup poster FPM XII di landing page.
 *
 * Muncul sekali per hari: tanggal lokal (YYYY-MM-DD) disimpan di localStorage,
 * jadi besok pengunjung melihatnya lagi. Tanggal dihitung dari waktu perangkat,
 * bukan server, supaya tidak muncul dua kali dalam satu hari kalau zona waktu beda.
 */
function todayKey() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function shouldShowPoster() {
    try {
        return window.localStorage.getItem(STORAGE_KEY) !== todayKey();
    } catch {
        // Mode privat / storage diblokir: jangan tampilkan supaya tidak mengganggu.
        return false;
    }
}

export default function PosterModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (shouldShowPoster()) setOpen(true);
        }, 600);

        return () => window.clearTimeout(timer);
    }, []);

    const close = () => {
        try {
            window.localStorage.setItem(STORAGE_KEY, todayKey());
        } catch {
            /* storage tidak tersedia, popup tetap ditutup untuk sesi ini */
        }

        setOpen(false);
    };

    return (
        <Modal
            open={open}
            onClose={close}
            size="md"
            title="Festival Pelajar Muslim XII"
            subtitle="SMP/MTs se-Karesidenan Kediri · 30 Januari 2027"
            footer={
                <>
                    <button type="button" className="btn btn--ghost" onClick={close}>
                        Nanti saja
                    </button>
                    <Link className="btn btn--dark" href="/klaim" onClick={close}>
                        Daftarkan sekolah
                    </Link>
                </>
            }
        >
            <figure className="poster-pop">
                <img
                    src="/branding/poster-fpm-xii.jpg"
                    alt="Poster Festival Pelajar Muslim XII: enam cabang lomba, pendaftaran gratis 20 November 2026 sampai 22 Januari 2027, pelaksanaan 30 Januari 2027 di SMKS Islam 1 Kota Blitar."
                    width="905"
                    height="1280"
                    decoding="async"
                />
            </figure>
            <p className="modal__text poster-pop__note">
                Pendaftaran online gratis <strong>20 November 2026 – 22 Januari 2027</strong>.
                Technical meeting 25 Januari 2027, pelaksanaan 30 Januari 2027.
            </p>
        </Modal>
    );
}
