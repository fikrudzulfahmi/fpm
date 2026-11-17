import { Link } from '@inertiajs/react';

/**
 * Footer tabel: ringkasan baris + tombol halaman (gaya pil, tema FPM).
 * Menerima objek paginator Laravel (links, from, to, total).
 */
export default function TablePagination({ paginator, label = 'baris' }) {
    if (!paginator) return null;

    const links = paginator.links ?? [];
    const from = paginator.from ?? null;
    const to = paginator.to ?? null;
    const total = paginator.total ?? 0;

    return (
        <div className="table-foot">
            <p className="pager__meta">
                {total > 0
                    ? `Menampilkan ${from ?? 0}–${to ?? 0} dari ${total} ${label}`
                    : `Belum ada ${label}`}
            </p>

            {links.length > 3 && (
                <nav className="pager" aria-label="Navigasi halaman">
                    {links.map((link, index) => {
                        const label2 = String(link.label ?? '')
                            .replace(/&laquo;\s*Previous/i, 'Sebelumnya')
                            .replace(/Previous/i, 'Sebelumnya')
                            .replace(/Next\s*&raquo;/i, 'Berikutnya')
                            .replace(/Next/i, 'Berikutnya')
                            .replace(/&[^;]+;/g, '')
                            .trim();

                        const isDots = label2 === '...';

                        if (!link.url || isDots) {
                            return (
                                <span
                                    key={index}
                                    className={`pager__btn pager__btn--muted${link.active ? ' is-active' : ''}`}
                                    aria-disabled="true"
                                >
                                    {label2 || '…'}
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={index}
                                href={link.url}
                                preserveScroll
                                preserveState
                                className={`pager__btn${link.active ? ' is-active' : ''}`}
                                aria-current={link.active ? 'page' : undefined}
                            >
                                {label2}
                            </Link>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}
