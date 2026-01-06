import React from 'react';
import { buildCsv, downloadBlob } from '../Common/csvUtils';
import api from '../../services/http-common';
import { useAlert } from '../Alerts/useAlert';

/**
 * Component that generates a CSV report for clients.
 * It calls the backend to generate and log the report, then downloads the CSV.
 *
 * Input: props (filename)
 * Output: JSX Element (button)
 */
const ReportClients = ({ filename }) => {
  const { show } = useAlert();

  /**
   * Generates the CSV content and triggers the download.
   */
  const downloadCSV = async () => {
    try {
        const resp = await api.post('/reports/generate/clients');
        let dataToProcess = [];
        if (resp.data && resp.data.data) {
            try {
                dataToProcess = JSON.parse(resp.data.data);
            } catch (e) {
                console.error("Error parsing report data", e);
            }
        }

        const headers = ['ID', 'Username', 'Nombre', 'Apellido', 'Email', 'RUT', 'Pedidos', 'Estado', 'Rol'];

        const getClientState = (u) => {
          const candidates = [u.stateClient, u.state, u.state_client, u.status, u.enabled, u.active, u.isActive, u.estado];
          for (let v of candidates) {
            if (v !== undefined && v !== null && v !== '') {
              if (typeof v === 'boolean') return v ? 'ACTIVO' : 'RESTRINGIDO';
              const vs = String(v).toUpperCase();
              if (vs === 'TRUE'  || vs === 'ACTIVO') return 'ACTIVO';
              if (vs === 'FALSE' || vs === 'RESTRINGIDO') return 'RESTRINGIDO';
              return String(v);
            }
          }
          return '—';
        };

        const mapped = dataToProcess.map(c => [
          c.id ?? '',
          c.username ?? '',
          c.name ?? '',
          c.lastName ?? '',
          c.email ?? '',
          c.rut ?? c.RUT ?? '—',
          c.loans != null ? c.loans : 0,
          getClientState(c),
          c.rol ?? ''
        ]);

        const csv = buildCsv(headers, mapped);
        const name = filename || `reporte_clientes_${new Date().toISOString().slice(0,10)}.csv`;
        downloadBlob(csv, name);
        show({ severity: 'success', message: 'Reporte generado y guardado correctamente' });

    } catch (e) {
        console.error("Error generating clients report", e);
        show({ severity: 'error', message: 'Error al generar el reporte de clientes' });
    }
  };

  return (
    <button onClick={downloadCSV} className="primary-cta" type="button">Generar reporte (CSV)</button>
  );
};

export default ReportClients;
