import React from 'react';
import { buildCsv, downloadBlob } from '../Common/csvUtils';

/**
 * Component that generates a CSV report for clients.
 * It receives a list of client objects and a filename.
 *
 * Input: props (rows, filename)
 * Output: JSX Element (button)
 */
const ReportClients = ({ rows = [], filename }) => {
  /**
   * Generates the CSV content and triggers the download.
   */
  const downloadCSV = () => {
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

    const mapped = rows.map(c => [
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
  };

  return (
    <button onClick={downloadCSV} className="primary-cta" type="button">Generar reporte (CSV)</button>
  );
};

export default ReportClients;
