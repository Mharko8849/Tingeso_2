import React from 'react';
import { buildCsv, downloadBlob } from '../Common/csvUtils';
import api from '../../services/http-common';
import { useAlert } from '../Alerts/useAlert';

/**
 * Component that generates a CSV report for tool ranking.
 * It receives a list of ranking objects OR date range to fetch them.
 *
 * Input: props (rows, filename, dateFrom, dateTo)
 * Output: JSX Element (button)
 */
const ReportRanking = ({ rows = [], filename, dateFrom, dateTo, label = "Generar reporte (CSV)", className = "primary-cta" }) => {
  const { show } = useAlert();

  /**
   * Generates the CSV content and triggers the download.
   */
  const downloadCSV = async () => {
    let dataToProcess = rows;

    // If dates are provided (even if empty strings, implying we want to fetch based on current filters), fetch from backend
    if (dateFrom !== undefined || dateTo !== undefined) {
        try {
            const params = {};
            if (dateFrom) params.initDate = dateFrom;
            if (dateTo) params.finalDate = dateTo;
            
            const resp = await api.get('/api/kardex/ranking/range', { params });
            // Transform backend format to flat structure for CSV
            // Backend returns List<Map<String, Object>> where tool is an object
            dataToProcess = resp.data.map(item => {
                const t = item.tool || {};
                return {
                    toolName: t.toolName || t.name || '—',
                    category: t.category || '—',
                    count: item.totalLoans || 0,
                    price: t.priceRent || 0
                };
            });
        } catch (e) {
            console.error("Error fetching ranking report", e);
            show({ severity: 'error', message: 'Error al generar el reporte de ranking' });
            return;
        }
    }

    const headers = ['Herramienta', 'Categoría', 'Total Préstamos', 'Precio Renta'];
    const mapped = dataToProcess.map(r => [
      r.toolName || r.name || r.tool || '',
      r.category || '',
      r.count ?? r.times ?? r.totalLoans ?? '',
      r.price ?? r.priceRent ?? ''
    ]);
    
    const csv = buildCsv(headers, mapped);
    const name = filename || `ranking_${dateFrom || 'inicio'}_${dateTo || 'fin'}.csv`;
    downloadBlob(csv, name);
  };

  return (
    <button onClick={downloadCSV} className={className} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  );
};

export default ReportRanking;
