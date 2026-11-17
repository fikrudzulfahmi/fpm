import TablePagination from './TablePagination';

/**
 * Tabel data bertema FPM: header lengket, baris zebra, hover, dan footer
 * paginasi. `columns[].render` menerima objek baris untuk sel kustom.
 *
 * @param {object} props
 * @param {Array<{key:string,label:string,align?:'left'|'center'|'right',width?:string|number,render?:(row:any)=>any}>} props.columns
 * @param {Array<any>} props.rows
 * @param {(row:any)=>string|number} props.rowKey
 * @param {object=} props.paginator objek paginator Laravel ({links,from,to,total})
 */
export default function DataTable({
    title,
    subtitle,
    actions,
    columns = [],
    rows = [],
    rowKey = (row) => row.id,
    empty = 'Belum ada data.',
    paginator = null,
    paginationLabel = 'baris',
    className = '',
    renderRow = null,
}) {
    return (
        <section className={`table-card ${className}`.trim()}>
            {(title || subtitle || actions) && (
                <div className="table-toolbar">
                    <div className="min-w-0">
                        {title && <h3 className="table-toolbar__title">{title}</h3>}
                        {subtitle && <p className="table-toolbar__sub">{subtitle}</p>}
                    </div>
                    {actions && <div className="table-toolbar__actions">{actions}</div>}
                </div>
            )}

            <div className="table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    style={{ width: column.width, textAlign: column.align ?? 'left' }}
                                    scope="col"
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) =>
                            renderRow ? (
                                renderRow(row)
                            ) : (
                                <tr key={rowKey(row)}>
                                    {columns.map((column) => (
                                        <td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                                            {column.render ? column.render(row) : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ),
                        )}
                    </tbody>
                </table>

                {rows.length === 0 && <div className="table-empty">{empty}</div>}
            </div>

            <TablePagination paginator={paginator} label={paginationLabel} />
        </section>
    );
}
