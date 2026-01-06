import React from 'react';
import { buildCsv, downloadBlob } from '../Common/csvUtils';
import api from '../../services/http-common';
import { useAlert } from '../Alerts/useAlert';

/**
 * Component that generates a CSV report for employees.
 * It calls the backend to generate and log the report, then downloads the CSV.
 *
 * Input: props (filename)
 * Output: JSX Element (button)
 */
const ReportEmployees = ({ filename }) => {
  const { show } = useAlert();

  /**
   * Generates the CSV content and triggers the download.
   */
  const downloadCSV = async () => {
    try {
        const resp = await api.post('/reports/generate/employees');
        let dataToProcess = [];
        
        if (resp.data && resp.data.data) {
            try {
                dataToProcess = JSON.parse(resp.data.data);
            } catch (e) {
                console.error("Error parsing report data", e);
            }
        }

        const headers = [ 'ID','Nombre', 'Apellido', 'Email', 'Rol'];

        const mapped = dataToProcess.map(u => [
          u.id != null ? String(u.id) : (u.username || ''),
          u.name || '',
          u.lastName || '',
          u.email || '',
          u.rol || u.role || ''
        ]);

        const csv = buildCsv(headers, mapped);
        const name = filename || `reporte_empleados_${new Date().toISOString().slice(0,10)}.csv`;
        downloadBlob(csv, name);
        show({ severity: 'success', message: 'Reporte generado y guardado correctamente' });

    } catch (e) {
        console.error("Error generating employees report", e);
        show({ severity: 'error', message: 'Error al generar el reporte de empleados' });
    }
  };

  return (
    <button onClick={downloadCSV} className="primary-cta" type="button">Generar reporte (CSV)</button>
  );
};

export default ReportEmployees;
