import React, { useEffect, useMemo, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import BackButton from '../components/Common/BackButton';
import api from '../services/http-common';
import Badge from '../components/Badges/Badge';
import { statusToBadgeVariant } from '../components/Badges/statusToBadge';
import { ReportLoans } from '../components/Reports';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(''); // '', ACTIVO, FINALIZADO, PENDIENTE

  const fetchAll = async () => {
    // kept for manual full reload if needed
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/loans/');
      setLoans(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('No se pudo cargar préstamos', e?.response ?? e);
      setError('No se pudo cargar la lista de pedidos.');
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltered = async () => {
    // convenience wrapper that uses current `status` and `q`
    return await fetchFilteredWith({ status, q });
  };

  

  const fetchFilteredWith = async ({ status: statusVal, q: qVal } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusVal) {
        // backend expects `state` parameter; LoanService.filter handles 'ATRASADO' specially
        params.state = statusVal;
      }
      if (qVal) params.q = qVal;
      const res = await api.get('/loans/filter', { params });
      const arr = Array.isArray(res.data) ? res.data : [];
      setLoans(arr);
      return arr;
    } catch (e) {
      console.error('No se pudo cargar préstamos filtrados', e?.response ?? e);
      setError('No se pudo cargar la lista de pedidos filtrados.');
      setLoans([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // on mount, load filtered (empty filters will return all)
    fetchFiltered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // when status changes (including selecting Atrasados) call filter endpoint
    fetchFiltered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const goBack = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const openLoan = (id) => {
    // Navega al resumen de pedido de solo lectura
    window.history.pushState({}, '', `/loans/loan/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const today = useMemo(() => (new Date()).toISOString().slice(0, 10), []);

  const filtered = useMemo(() => {
    // backend already filters by status/overdue; keep client-side search by `q` and ordering
    let data = loans.slice();
    if (q) {
      const term = q.toLowerCase();
      data = data.filter((l) => {
        const idStr = String(l.id || '');
        const clientName = l.idUser ? ((l.idUser.name ? `${l.idUser.name} ${l.idUser.lastName || ''}` : (l.idUser.username || l.idUser.email || ''))) : '';
        return idStr.includes(term) || clientName.toLowerCase().includes(term);
      });
    }
    // ordenamos por id desc (más reciente primero)
    data.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    return data;
  }, [loans, q]);


  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <main style={{ paddingTop: 30 }} className="px-6">
        <div className="max-w-6xl mx-auto big-page">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>Pedidos — Todos</h2>
              <p style={{ margin: '4px 0 0', color: '#4b5563' }}>Listado general de pedidos del sistema.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <BackButton onClick={goBack} />
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, alignItems: 'center' }}>
            <input
              placeholder="Buscar por #pedido o cliente..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 260 }}
            />
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value;
                setStatus(v);
                // call fetch with the new value immediately (avoids waiting for state update)
                fetchFilteredWith({ status: v, q });
              }}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ATRASADO">Atrasados</option>
            </select>
            <button
              onClick={fetchFiltered}
              className="primary-cta"
              type="button"
              aria-label="Refrescar"
              title="Refrescar"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {/* simple reload icon (SVG) to match common refresh symbol */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refrescar
            </button>
            <ReportLoans rows={filtered} />
          </div>

          {/* depuración removida */}

          {error && <div style={{ color: '#b91c1c', marginTop: 8 }}>{error}</div>}

          {loading ? <p style={{ marginTop: 12 }}>Cargando pedidos...</p> : (
            filtered.length === 0 ? <p style={{ marginTop: 12 }}>No hay pedidos para mostrar.</p> : (
              <div style={{ marginTop: 12, maxHeight: 520, overflowY: 'auto', width: '100%' }}>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '80px 1.2fr 1fr 1fr 1fr 160px 120px', gap: 12, padding: '6px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Pedido #</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Cliente</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Fecha inicio</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Fecha devolución</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Fecha Actual</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Estado</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'right' }}>Acciones</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  {filtered.map((l) => (
                    <div
                      key={l.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openLoan(l.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openLoan(l.id); }}
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        border: '1px solid #e6e6e6',
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 24,
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1fr 1fr 1fr 160px 120px', alignItems: 'center', gap: 12, width: '100%' }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>#{l.id}</div>
                        <div style={{ fontSize: 14, color: '#374151' }}>
                          {l.idUser ? (l.idUser.name ? `${l.idUser.name} ${l.idUser.lastName || ''}` : (l.idUser.username || l.idUser.email)) : '—'}
                        </div>
                        <div style={{ fontSize: 14, color: '#374151' }}>{l.initDate}</div>
                        <div style={{ fontSize: 14, color: '#374151' }}>{l.returnDate}</div>
                        <div style={{ fontSize: 14, color: '#374151' }}>{today}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* use centralized mapping for badge variants */}
                          <Badge variant={statusToBadgeVariant(l.status)} title={l.status || ''} />
                          <div style={{ fontSize: 14, color: '#374151' }}>{l.status}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <button className="link" style={{ whiteSpace: 'nowrap' }} onClick={(ev) => { ev.stopPropagation(); openLoan(l.id); }}>Ver pedido</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default Loans;
