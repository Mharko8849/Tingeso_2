import React from 'react';
import { buildCsv, downloadBlob } from '../Common/csvUtils';
import api from '../../services/http-common';
import { useAlert } from '../Alerts/useAlert';

/**
 * Component that generates a CSV report for the Kardex (inventory movements).
 * It calls the backend to generate and log the report, then downloads the CSV.
 *
 * Input: props (filename, dateFrom, dateTo)
 * Output: JSX Element (button)
 */
const ReportKardex = ({ filename, dateFrom, dateTo }) => {
  const { show } = useAlert();

  /**
   * Generates the CSV content and triggers the download.
   */
  const downloadCSV = async () => {
    try {
        const params = {};
        if (dateFrom) params.initDate = dateFrom;
        if (dateTo) params.finalDate = dateTo;

        const resp = await api.post('/reports/generate/kardex', null, { params });
        let dataToProcess = [];

        if (resp.data && resp.data.data) {
            try {
                dataToProcess = JSON.parse(resp.data.data);
            } catch (e) {
                console.error("Error parsing report data", e);
            }
        }

        const headers = ['Fecha', 'Empleado (ID)', 'Herramienta (ID - Nombre)', 'Usuario', 'Tipo de Movimiento', 'Cantidad', 'Monto'];

        const formatDate = (s) => {
          try {
            const d = new Date(s);
            return d.toLocaleString();
          } catch (e) {
            return s;
          }
        };

        const renderUser = (u) => {
          if (!u) return '—';
          if (typeof u === 'object') {
            const id = u.id ?? u._id ?? null;
            const name = u.name || u.username || u.lastName || '';
            return id ? `${id}${name ? ` - ${name}` : ''}` : (name || JSON.stringify(u));
          }
          return String(u);
        };

        const renderTool = (t) => {
          if (!t) return '—';
          if (typeof t === 'object') {
            const id = t.id ?? t._id ?? null;
            const name = t.toolName || t.name || '';
            return id ? `${id}${name ? ` - ${name}` : ''}` : (name || JSON.stringify(t));
          }
          return String(t);
        };

        const mapped = dataToProcess.map(m => [
          formatDate(m.date),
          renderUser(m.idEmployee ?? m.employee ?? m.employeeId),
          renderTool(m.tool ?? m.idTool),
          renderUser(m.client ?? m.user ?? m.idUser),
          String(m.type || '').toUpperCase(),
          m.qty ?? m.quantity ?? m.cantidad ?? m.cant ?? '—',
          m.cost ?? m.amount ?? m.balance ?? m.stock ?? '—'
        ]);
        const csv = buildCsv(headers, mapped);
        const name = filename || `kardex_${dateFrom || 'inicio'}_${dateTo || 'fin'}.csv`;
        downloadBlob(csv, name);
        show({ severity: 'success', message: 'Reporte generado y guardado correctamente' });
    } catch (e) {
        console.error("Error generating kardex report", e);
        show({ severity: 'error', message: 'Error al generar el reporte de Kardex' });
    }
  };

  return (
    <button onClick={downloadCSV} className="primary-cta" type="button"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>Generar Reporte (CSV)</button>
  );
};

export default ReportKardex;
