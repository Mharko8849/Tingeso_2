import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import BackButton from '../components/Common/BackButton';
import ReturnToolCard from '../components/Returns/ReturnToolCard';
import api from '../services/http-common';
import Badge from '../components/Badges/Badge';
import { statusToBadgeVariant } from '../components/Badges/statusToBadge';
import { useAlert } from '../components/Alerts/useAlert';
import RepairPaymentModal from '../components/Returns/RepairPaymentModal';
import DebtPaymentModal from '../components/Returns/DebtPaymentModal';
import PaginationBar from '../components/Common/PaginationBar';

const ReturnsLoanSummary = () => {
  const [loan, setLoan] = useState(null);
  const [items, setItems] = useState([]);
  const [stateToolMap, setStateToolMap] = useState({});
  const [returning, setReturning] = useState(false);
  const alert = useAlert();
  const statusUpper = String(loan?.status || '').toUpperCase();
  const isFinalized = statusUpper === 'FINALIZADO';
  const isActive = statusUpper === 'ACTIVO' || statusUpper === 'ACTIVE';
  const [totalFine, setTotalFine] = useState(0);
  const [payingDebt, setPayingDebt] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const loanIdStr = parts[parts.length - 1];
    if (!loanIdStr) {
      console.error('Could not parse loanId from path', window.location.pathname);
      try { alert?.show?.({ severity: 'error', message: 'ID de pedido inválido en la URL', autoHideMs: 4000 }); } catch (e) {}
      setLoading(false);
      return;
    }
    const loanIdNum = Number(loanIdStr);
    if (!Number.isFinite(loanIdNum) || loanIdNum <= 0) {
      console.error('Parsed invalid loanId', loanIdStr);
      try { alert?.show?.({ severity: 'error', message: `ID de pedido inválido: ${loanIdStr}`, autoHideMs: 4000 }); } catch (e) {}
      setLoading(false);
      return;
    }
    const loanId = loanIdStr;
    console.debug('Loading ReturnsLoanSummary for loanId=', loanId);

    // fetch loan and loanxtools with extra logging
    api.get(`/loans/${loanId}`)
      .then(res => { console.debug('/loans response', res); setLoan(res.data); })
      .catch((e) => { console.error('/loans error', e); setLoan(null); });
    // fetch total fine for this loan
    api.get(`/loan-tools/total/fine/${loanId}`)
      .then(res => { console.debug('/loan-tools/total/fine response', res); setTotalFine(Number(res.data || 0)); })
      .catch((e) => { console.warn('/loan-tools/total/fine error', e); setTotalFine(0); });

    api.get(`/loan-tools/loan/${loanId}`)
      .then(res => { console.debug('/loan-tools/loan response', res); setItems(res.data || []); })
      .catch((e) => { console.error('/api/loantool/loan error', e); setItems([]); })
      .finally(() => setLoading(false));
  }, []);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pagedItems = items.slice(start, end);

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <main style={{ paddingTop: 30 }} className="px-6">
        <div className="max-w-6xl mx-auto big-page">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <h2 style={{ margin: 0 }}>Devolver Pedido — Resumen</h2>
              <p style={{ margin: '4px 0 0', color: '#4b5563' }}>Revisa los datos del pedido y selecciona el estado de cada herramienta antes de confirmar la devolución.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <BackButton to={`/admin/returns/client/${loan?.client?.id || ''}`} />
            </div>
          </div>
          {loading ? <p>Cargando resumen...</p> : (
            <div>
              {loan ? (
                <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                  <section style={{ flex: '0 0 320px', background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <h4 style={{ margin: 0, fontSize: 15 }}>Cliente</h4>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 800 }}>{loan.client ? (loan.client.name ? `${loan.client.name} ${loan.client.lastName || ''}` : (loan.client.username || loan.client.email)) : ''}</div>
                      <div style={{ marginTop: 4, fontSize: 16, color: '#374151' }}>{loan.client?.username || loan.client?.email}</div>
                      {loan.client?.email && <div style={{ marginTop: 2, fontSize: 14, color: '#4b5563' }}>{loan.client.email}</div>}
                      {loan.client?.rut && <div style={{ marginTop: 6, fontSize: 16 }}>RUT: {loan.client.rut}</div>}
                    </div>
                  </section>

                  <section style={{ flex: 1, background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, color: '#6b7280' }}>Resumen del pedido</div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{`Pedido #${loan.id}`}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                          <Badge variant={statusToBadgeVariant(loan.status)} title={loan.status || ''} />
                          <div style={{ fontSize: 14 }}>{loan.status}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div>Fecha inicio: {loan.initDate}</div>
                      <div>Fecha devolución: {loan.returnDate}</div>
                    </div>

                    <h3 style={{ marginTop: 16 }}>Herramientas solicitadas</h3>
                    {items.length === 0 ? <p>No hay herramientas en este pedido.</p> : (
                      <div>
                        <ul className="card-list">
                          {pagedItems.map(it => (
                            <ReturnToolCard key={it.id} item={it} disabled={!isActive} onStateChange={(id, state) => setStateToolMap(prev => ({ ...prev, [id]: state }))} />
                          ))}
                        </ul>
                        <PaginationBar
                          page={safePage}
                          pageSize={pageSize}
                          total={total}
                          onPageChange={(p) => setPage(p)}
                          onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
                        />

                        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                          {/* Botón de devolución (visible solo si el pedido no está finalizado) */}
                          {isActive && items.length > 0 && (
                            <button
                              className="primary-cta"
                              disabled={returning}
                              style={{ padding: '8px 16px' }}
                              onClick={async () => {
                                if (!loan) return;
                                setReturning(true);
                                try {
                                  const missing = items.filter(it => !stateToolMap[it.id]);
                                  if (missing.length > 0) {
                                    try { alert?.show?.({ severity: 'warning', message: `Falta seleccionar estado para ${missing.length} herramienta(s)`, autoHideMs: 4000 }); } catch (e) {}
                                    setReturning(false);
                                    return;
                                  }
                                  const payload = {};
                                  items.forEach(it => { payload[it.id] = stateToolMap[it.id]; });
                                  console.debug('[Devolver] payload a enviar:', payload);
                                  const meResp = await api.get('/users/me');
                                  const employeeId = meResp?.data?.id;
                                  if (!employeeId) throw new Error('No pude obtener tu id de usuario (employee)');
                                  // Correct URL structure: /loan-tools/receive/all/{loanId}?employeeId={employeeId}
                                  const url = `/loan-tools/receive/all/${loan.id}`;
                                  await api.post(url, payload, { params: { employeeId } });
                                  try { alert?.show?.({ severity: 'success', message: 'Devolución completada correctamente.', autoHideMs: 3000 }); } catch (e) {}
                                  await api.get(`/loan-tools/loan/${loan.id}`).then(r => setItems(r.data || []));
                                  await api.get(`/loans/${loan.id}`).then(r => setLoan(r.data)).catch(() => {});
                                  try { const tf = await api.get(`/loan-tools/total/fine/${loan.id}`); setTotalFine(Number(tf.data || 0)); } catch (e) { setTotalFine(0); }
                                  setStateToolMap({});
                                } catch (err) {
                                  console.error('Error al devolver herramientas', err?.response ?? err);
                                  const resp = err?.response?.data;
                                  try {
                                    if (resp) { alert?.show?.({ severity: 'error', message: typeof resp === 'string' ? resp : JSON.stringify(resp), autoHideMs: 8000 }); }
                                    else { alert?.show?.({ severity: 'error', message: err?.message || 'Error desconocido', autoHideMs: 8000 }); }
                                  } catch (e) {}
                                } finally { setReturning(false); }
                              }}
                            >
                              {returning ? 'Devolviendo...' : 'Devolver Herramientas'}
                            </button>
                          )}

                          {/* Botón de pagar deuda (visible si hay multa) */}
                          {totalFine > 0 && (
                            <button
                              className="primary-cta"
                              disabled={payingDebt}
                              style={{ padding: '8px 16px' }}
                              onClick={() => setShowDebtModal(true)}
                            >
                              {payingDebt ? 'Pagando deuda...' : `Pagar deuda (${new Intl.NumberFormat().format(totalFine)} )`}
                            </button>
                          )}

                          {/* Botón de pagar reparación (si hay herramientas con needRepair) */}
                          {items.some(it => it.needRepair) && (
                            <button className="primary-cta" style={{ padding: '8px 16px' }} onClick={() => setShowRepairModal(true)}>Pagar reparación</button>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              ) : <p>Pedido no encontrado.</p>}
            </div>
          )}
          <RepairPaymentModal
            open={showRepairModal}
            onClose={() => setShowRepairModal(false)}
            loan={loan}
            initialItems={items.filter(it => it.needRepair)}
            onPaid={async () => {
              // refresh loan/items and totals after paying repairs
              if (!loan) return;
              await api.get(`/loan-tools/loan/${loan.id}`).then(r => setItems(r.data || []));
              await api.get(`/loans/${loan.id}`).then(r => setLoan(r.data)).catch(() => {});
              try { const tf = await api.get(`/loan-tools/total/fine/${loan.id}`); setTotalFine(Number(tf.data || 0)); } catch (e) { setTotalFine(0); }
            }}
          />

          <DebtPaymentModal
            open={showDebtModal}
            onClose={() => setShowDebtModal(false)}
            loan={loan}
            totalFine={totalFine}
            onPaid={async () => {
              if (!loan) return;
              await api.get(`/loan-tools/loan/${loan.id}`).then(r => setItems(r.data || []));
              await api.get(`/loans/${loan.id}`).then(r => setLoan(r.data)).catch(() => {});
              try { const tf = await api.get(`/loan-tools/total/fine/${loan.id}`); setTotalFine(Number(tf.data || 0)); } catch (e) { setTotalFine(0); }
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default ReturnsLoanSummary;
