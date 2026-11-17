import Modal from './Modal';

/**
 * Konfirmasi tindakan berisiko (hapus, lepas klaim, aktifkan event).
 * Pakai `tone="danger"` untuk aksi yang menghapus data.
 */
export default function ConfirmDialog({
    open,
    title = 'Hapus data ini?',
    message,
    confirmLabel = 'Hapus',
    cancelLabel = 'Batal',
    tone = 'danger',
    processing = false,
    onConfirm,
    onClose,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={onClose} disabled={processing}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`btn btn--sm ${tone === 'danger' ? 'btn--danger' : 'btn--dark'}`}
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {processing ? 'Memproses…' : confirmLabel}
                    </button>
                </>
            }
        >
            {typeof message === 'string' ? <p className="modal__text">{message}</p> : message}
        </Modal>
    );
}
