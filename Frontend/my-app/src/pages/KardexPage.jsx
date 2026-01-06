import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import BackButton from '../components/Common/BackButton';
import { default as ReportKardex } from '../components/Reports/ReportKardex';
import { default as ReportRanking } from '../components/Reports/ReportRanking';
import PaginationBar from '../components/Common/PaginationBar';
import api from '../services/http-common';
import { useAlert } from '../components/Alerts/useAlert';

const KardexPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { show } = useAlert();

  const fetchKardex = async (overrides = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      const typeVal = overrides.type ?? typeFilter;
      const fromVal = overrides.from ?? dateFrom;
      const toVal = overrides.to ?? dateTo;

      if (typeVal) params.type = typeVal;
      if (fromVal) params.initDate = fromVal;
      if (toVal) params.finalDate = toVal;

      const resp = await api.get('/kardex/filter', { params });
      setMovements(Array.isArray(resp.data) ? resp.data : resp.data?.movements || []);
    } catch (err) {
      console.error('Error fetching /kardex/filter', err);
      setMovements([]);
      setError('No se pudo obtener movimientos del servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKardex();
  }, []);

  const formatDate = (s) => {
    try {
      const d = new Date(s).toISOString().split('T')[0];
      return d;
    } catch (e) {
      return s;
    }
  };

  // Small reusable date picker component used for both Desde/Hasta
  const DatePicker = ({ value, onChange, min, max, ariaLabel }) => (
    <input
      type="date"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db' }}
    />
  );

  // Keep Desde <= Hasta. ISO date strings compare lexicographically so this is safe.
  const handleFromChange = (val) => {
    setDateFrom(val);
    if (val && dateTo && val > dateTo) {
      // If Desde becomes after Hasta, move Hasta forward to Desde to keep consistency
      setDateTo(val);
    }
  };

  const handleToChange = (val) => {
    setDateTo(val);
    if (val && dateFrom && val < dateFrom) {
      // If Hasta becomes before Desde, move Desde back to Hasta
      setDateFrom(val);
    }
  };

  // Helpers to avoid rendering whole objects directly in JSX (causa del error)
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

  // Filter movements by search term across common Kardex fields
  const filtered = movements.filter((m) => {
    // Apply type filter client-side first
    if (typeFilter && String(m.type || '').toUpperCase() !== String(typeFilter).toUpperCase()) return false;

    // Apply date range filter client-side if provided
    // m.date may include time; treat dateFrom as start of day and dateTo as end of day
    if (dateFrom) {
      const start = new Date(dateFrom + 'T00:00:00');
      const md = m.date ? new Date(m.date) : null;
      if (!md || md < start) return false;
    }
    if (dateTo) {
      const end = new Date(dateTo + 'T23:59:59.999');
      const md = m.date ? new Date(m.date) : null;
      if (!md || md > end) return false;
    }

    if (!q) return true;

    const term = String(q).toLowerCase().trim();

    // Use the same render helpers so the search matches what's displayed (e.g. "1 - Marco")
    const empDisplay = String(renderUser(m.idEmployee ?? m.employee ?? m.employeeId)).toLowerCase();
    const userDisplay = String(renderUser(m.client ?? m.user ?? m.idUser)).toLowerCase();
    const toolDisplay = String(renderTool(m.tool ?? m.idTool)).toLowerCase();
    const moveId = String(m.id ?? m._id ?? '').toLowerCase();
    const moveType = String(m.type || '').toLowerCase();
    const qty = String(m.qty ?? m.quantity ?? m.cantidad ?? m.cant ?? '').toLowerCase();
    const amount = String(m.cost ?? m.amount ?? m.balance ?? m.stock ?? '').toLowerCase();
    const dateStr = String(m.date ? formatDate(m.date) : '').toLowerCase();

    // Match if any field contains the term
    return (
      toolDisplay.includes(term) ||
      empDisplay.includes(term) ||
      userDisplay.includes(term) ||
      moveId.includes(term) ||
      moveType.includes(term) ||
      qty.includes(term) ||
      amount.includes(term) ||
      dateStr.includes(term)
    );
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pagedMovements = filtered.slice(start, end);


  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />

      <main className="px-6" style={{ paddingTop: '30px', paddingBottom: '24px' }}>
        <div className="max-w-6xl mx-auto">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <h2 style={{ margin: 0 }}>Kardex — Movimientos</h2>
              <p style={{ margin: '4px 0 0', color: '#4b5563' }}>
                Registro histórico de movimientos de inventario: préstamos, devoluciones, ingresos, bajas y pagos.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <BackButton to="/" />
            </div>
          </div>

          <div className="filters-card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <input
                placeholder="Buscar por herramienta, empleado, usuario o tipo..."
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 260 }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => fetchKardex({})}
                  className="primary-cta"
                  type="button"
                  aria-label="Refrescar"
                  title="Refrescar"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Refrescar
                </button>

                <button
                  onClick={() => {
                    setQ('');
                    setDateFrom('');
                    setDateTo('');
                    setTypeFilter('');
                    setPage(1);
                    fetchKardex({ type: '', from: '', to: '' });
                  }}
                  className="secondary-cta"
                  type="button"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Limpiar filtros
                </button>

                <ReportKardex dateFrom={dateFrom} dateTo={dateTo} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Desde:</span>
              <DatePicker value={dateFrom} onChange={handleFromChange} max={dateTo || undefined} ariaLabel="Fecha desde" />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Hasta:</span>
              <DatePicker value={dateTo} onChange={handleToChange} min={dateFrom || undefined} ariaLabel="Fecha hasta" />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Tipo de Movimiento:</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setTypeFilter(v);
                  setPage(1);
                  fetchKardex({ type: v });
                }}
                style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
              >
                <option value="">Todos</option>
                <option value="PRESTAMO">PRÉSTAMO</option>
                <option value="DEVOLUCION">DEVOLUCIÓN</option>
                <option value="REPARACION">REPARACIÓN</option>
                <option value="BAJA">BAJA</option>
                <option value="INGRESO">INGRESO</option>
                <option value="PAGO_DEUDA">PAGO DEUDA</option>
                <option value="PAGO_REPARACION">PAGO REPARACIÓN</option>
              </select>
            </div>

            <ReportRanking 
              dateFrom={dateFrom} 
              dateTo={dateTo} 
              label="Generar Reporte Ranking (CSV)" 
              className="secondary-cta"
            />
          </div>

          {loading ? (
            <p>Cargando movimientos...</p>
          ) : (
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              {error && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}
              <PaginationBar
                page={safePage}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
                showPageSizeControls
                showSummary={false}
              />
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '8px 12px' }}>Fecha</th>
                      <th style={{ padding: '8px 12px' }}>Empleado (ID)</th>
                      <th style={{ padding: '8px 12px' }}>Herramienta (ID - Nombre)</th>
                      <th style={{ padding: '8px 12px' }}>Cliente</th>
                      <th style={{ padding: '8px 12px' }}>Tipo de Movimiento</th>
                      <th style={{ padding: '8px 12px' }}>Cantidad</th>
                      <th style={{ padding: '8px 12px' }}>Monto</th>
                    </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center' }}>No se encontraron movimientos</td></tr>
                  ) : (
                    pagedMovements.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{formatDate(m.date)}</td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{renderUser(m.idEmployee ?? m.employee ?? m.employeeId)}</td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{renderTool(m.tool ?? m.idTool)}</td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{renderUser(m.client ?? m.user ?? m.idUser)}</td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{String(m.type || '').toUpperCase()}</td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{m.qty ?? m.quantity ?? m.cantidad ?? m.cant ?? '—'}</td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{m.cost ?? m.amount ?? m.balance ?? m.stock ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <PaginationBar
                page={safePage}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
                showPageSizeControls={false}
                showSummary
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default KardexPage;
