export function DataTable({ columns, rows, emptyMessage, onRowClick, selectedId }) {
  if (!rows?.length) {
    return (
      <p className="text-sm text-ink-muted py-8 text-center">{emptyMessage}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`${onRowClick ? 'cursor-pointer' : ''} ${
                selectedId === row.id ? 'bg-cream-100' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
