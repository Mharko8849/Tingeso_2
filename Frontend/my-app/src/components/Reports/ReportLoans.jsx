import React from 'react';
import { buildCsv, downloadBlob } from '../Common/csvUtils';

/**
 * Component that generates a CSV report for loans (orders).
 * It receives a list of loan objects and a filename.
 *
 * Input: props (rows, filename)
 * Output: JSX Element (button)
 */
const ReportLoans = ({ rows = [], filename }) => {
  /**
   * Generates the CSV content and triggers the download.
   */
  const downloadCSV = () => {
    const headers = ['Pedido #', 'Cliente', 'Fecha inicio', 'Fecha devolución', 'Fecha Actual', 'Estado'];
    const today = new Date().toISOString().slice(0, 10);

    const mapped = rows.map(l => [
      l.id ?? '',
      l.idUser ? (l.idUser.name ? `${l.idUser.name} ${l.idUser.lastName || ''}` : (l.idUser.username || l.idUser.email || '')) : '—',
      l.initDate ?? '',
      l.returnDate ?? '',
      today,
      l.status ?? ''
    ]);

    const csv = buildCsv(headers, mapped);
    const name = filename || `reporte_pedidos_${new Date().toISOString().slice(0,10)}.csv`;
    downloadBlob(csv, name);
  };

  return (
    <button onClick={downloadCSV} className="primary-cta" type="button">Generar reporte (CSV)</button>
  );
};

export default ReportLoans;
