// Small shared CSV export utility — purely client-side, over data the
// caller already has (already fetched via an authorized API call). No new
// backend endpoint: exporting what's already on-screen doesn't expose
// anything a super_admin couldn't already see in the table itself.

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Quote if the value contains a comma, quote, or newline; double up any
  // internal quotes per RFC 4180.
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// rows: array of plain objects. columns: [{ key, label }] — key may be a
// dotted path like "hotels.name" to reach a nested field.
export function exportToCsv(filename, rows, columns) {
  const getValue = (row, key) => key.split(".").reduce((v, k) => (v == null ? v : v[k]), row);
  const header = columns.map(c => csvEscape(c.label)).join(",");
  const lines = rows.map(row => columns.map(c => csvEscape(getValue(row, c.key))).join(","));
  const csv = [header, ...lines].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${filename}-${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
