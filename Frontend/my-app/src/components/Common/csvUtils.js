/**
 * Escapes a value for CSV format by wrapping it in quotes and escaping internal quotes.
 * Input: value to escape
 * Output: escaped string
 */
export const quoteCell = (v) => {
  const s = v == null ? '' : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
};

/**
 * Builds a CSV string from headers and rows.
 * Input: headers array, rows array, delimiter (optional), useBom (optional)
 * Output: generated CSV string
 */
export const buildCsv = (headers, rows, delimiter = ',', useBom = true) => {
  const headerLine = headers.map(h => quoteCell(h)).join(delimiter);
  const body = rows.map(r => r.map(c => quoteCell(c)).join(delimiter)).join('\n');
  const csv = [headerLine, body].join('\n');
  return (useBom ? '\uFEFF' : '') + csv;
};

/**
 * Triggers a browser download of the given content as a file.
 * Input: file content, filename, mimeType (optional)
 * Output: void (triggers download)
 */
export const downloadBlob = (content, filename, mimeType = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
