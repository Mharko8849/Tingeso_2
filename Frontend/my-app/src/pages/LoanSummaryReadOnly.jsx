import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import api from '../services/http-common';
import { getUser } from '../services/auth';
import Badge from '../components/Badges/Badge';
import { statusToBadgeVariant } from '../components/Badges/statusToBadge';
import BackButton from '../components/Common/BackButton';

const LoanSummaryReadOnly = () => {
  const [loan, setLoan] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const loanId = parts[parts.length - 1];
    if (!loanId) return;

    // fetch loan and loanxtools
    api.get(`/loans/${loanId}`)
      .then(res => setLoan(res.data))
      .catch(() => setLoan(null));

    api.get(`/loan-tools/loan/${loanId}`)
      .then(res => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    // fetch total from backend (same endpoint used elsewhere)
    api.get(`/loan-tools/total/${loanId}`)
      .then(res => setTotal(Number(res.data || 0)))
      .catch(() => setTotal(0));
  }, []);

  const goBack = () => {
    window.history.pushState({}, '', '/loans');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const canForceClose = () => {
    if (!loan) return false;
    const status = String(loan.status || '').toUpperCase();
    return status === 'ACTIVO' && items.length === 0;
  };

  const handleForceClose = async () => {
    if (!loan?.id) return;
    setError('');
    setSuccess('');
    setClosing(true);
    try {
      const user = getUser();
      const employeeId = user ? user.id : null;
      if (!employeeId) throw new Error("No se pudo identificar al empleado");

      await api.post(`/loan-tools/pay/${loan.id}`, null, { params: { employeeId } });
      setSuccess('El pedido ha sido finalizado manualmente.');
      // refrescar datos del préstamo para reflejar el nuevo estado
      const refreshed = await api.get(`/loans/${loan.id}`);
      setLoan(refreshed.data);
    } catch (e) {
      console.error('Error al finalizar pedido manualmente', e?.response || e);
      setError(e?.response?.data || 'No se pudo finalizar el pedido. Inténtalo nuevamente.');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      <main style={{ paddingTop: 30 }} className="px-6">
        <div className="max-w-6xl mx-auto big-page">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>Resumen del Pedido {loan ? `#${loan.id}` : ''}</h2>
              <p style={{ margin: '4px 0 0', color: '#4b5563' }}>Revisa los datos del pedido seleccionado.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <BackButton onClick={goBack} />
            </div>
          </div>
          {error && <p style={{ marginTop: 8, color: '#b91c1c', fontSize: 14 }}>{String(error)}</p>}
          {success && <p style={{ marginTop: 8, color: '#047857', fontSize: 14 }}>{String(success)}</p>}
          {loading ? <p>Cargando resumen...</p> : (
            <div>
              {loan ? (
                <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                  <section style={{ flex: '0 0 320px', background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
                    <h4>Cliente</h4>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 800 }}>{loan.client ? (loan.client.name ? `${loan.client.name} ${loan.client.lastName || ''}` : (loan.client.username || loan.client.email)) : ''}</div>
                      <div style={{ marginTop: 4, fontSize: 16, color: '#374151' }}>{loan.client?.username || loan.client?.email}</div>
                      {loan.client?.rut && <div style={{ marginTop: 4, fontSize: 16 }}>RUT: {loan.client.rut}</div>}
                    </div>
                  </section>

                  <section style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14 }}>Resumen</div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{`Pedido #${loan.id}`}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                          <Badge variant={statusToBadgeVariant(loan.status)} title={loan.status || ''} />
                          <div style={{ fontSize: 14 }}>{loan.status}</div>
                        </div>
                        {canForceClose() && (
                          <button
                            type="button"
                            className="primary-cta"
                            style={{ marginTop: 8, padding: '4px 10px', fontSize: 12 }}
                            onClick={handleForceClose}
                            disabled={closing}
                          >
                            {closing ? 'Finalizando...' : 'Finalizar pedido manualmente'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div>Fecha inicio: {loan.initDate}</div>
                      <div>Fecha devolución: {loan.returnDate}</div>
                    </div>

                    <h3 style={{ marginTop: 16 }}>Herramientas solicitadas</h3>
                    {items.length === 0 ? <p>No hay herramientas en este pedido.</p> : (
                      <div>
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {items.map(it => {
                            // Backend returns LoanToolFull with 'tool' field (ToolFull)
                            const t = it.tool || it.idTool || {};
                            const name = t.toolName || t.name || 'Herramienta';
                            const image = t.imageUrl ? `/images/${t.imageUrl}` : (t.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80');
                            const activity = it.toolActivity || '-';
                            // Price is in amounts.priceRent
                            const price = Number(t.amounts?.priceRent || t.priceRent || t.price || 0);
                            const qty = Number(it.amount || it.quantity || 1);
                            const lineTotal = price * qty;
                            return (
                              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 6, background: '#fafafa' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                  <img src={image} alt={name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                                  <div>
                                    <div style={{ fontWeight: 700 }}>{name}</div>
                                    <div style={{ color: '#64748b' }}>Actividad: {activity}</div>
                                    <div style={{ color: '#64748b', fontSize: 13 }}>Cantidad: {qty}</div>
                                  </div>
                                </div>
                                <div style={{ fontWeight: 700 }}>${lineTotal.toLocaleString()}</div>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#334155' }}>Total</div>
                          <div style={{ fontSize: 20, fontWeight: 800 }}>${Number(total || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              ) : <p>Pedido no encontrado.</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LoanSummaryReadOnly;
