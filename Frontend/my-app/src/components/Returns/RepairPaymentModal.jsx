import React, { useEffect, useState } from 'react';
import api from '../../services/http-common';
import { useAlert } from '../../components/Alerts/useAlert';

const RepairPaymentModal = ({ open, onClose, loan, initialItems, onPaid }) => {
  const [items, setItems] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const alert = useAlert();

  useEffect(() => {
    if (!open || !loan) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        // If parent passed items (they already include tool info), use them and skip the GET
        if (initialItems && Array.isArray(initialItems) && initialItems.length > 0) {
          const data = initialItems;
          if (!mounted) return;
          setItems(data);
          // initialize amounts as empty so user must enter them
          const init = {};
          data.forEach(d => { init[d.id] = ''; });
          setAmounts(init);
          return;
        }

        // Fallback: fetch from backend if initialItems not provided
        const resp = await api.get(`/api/loantool/repair/${loan.id}`);
        const data = resp?.data || [];
        if (!mounted) return;
        setItems(data);
        const init = {};
        data.forEach(d => { init[d.id] = ''; });
        setAmounts(init);
      } catch (err) {
        console.error('Error loading repair items', err?.response ?? err);
        try {
          const status = err?.response?.status;
          const msg = status === 404 ? 'Endpoint de reparaciones no encontrado (404). Revisa la ruta en el backend.' : 'No se pudieron cargar las reparaciones';
          alert?.show?.({ severity: 'error', message: msg, autoHideMs: 7000 });
        } catch (e) {}
        onClose && onClose();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, loan, initialItems]);
  // Close on Escape key for better UX
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { onClose && onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  if (!open) return null;

  const submit = async () => {
    if (!loan) return;
    setSubmitting(true);
    try {
      // backend expects a single cost value and an adminUser id
      // validate amounts: must be > 0 for each item
      for (const it of items) {
        const val = Number(amounts[it.id]);
        if (!val || val <= 0) throw new Error('Todos los montos deben ser mayores que 0');
      }
      const totalCost = items.reduce((acc, it) => acc + Number(amounts[it.id] || 0), 0);
      const meResp = await api.get('/api/user/me');
      const adminUser = meResp?.data?.id;
      if (!adminUser) throw new Error('No pude obtener tu id de usuario (employee)');
      const payload = { adminUser: adminUser, cost: Number(totalCost) };
      await api.post(`/api/loantool/repair/${loan.id}/pay`, payload);
      try { alert?.show?.({ severity: 'success', message: 'Reparaciones pagadas correctamente.', autoHideMs: 4000 }); } catch (e) {}
      onPaid && onPaid();
      onClose && onClose();
    } catch (err) {
      console.error('Error paying repairs', err?.response ?? err);
      const resp = err?.response?.data;
      try {
        if (resp) { alert?.show?.({ severity: 'error', message: typeof resp === 'string' ? resp : JSON.stringify(resp), autoHideMs: 8000 }); }
        else { alert?.show?.({ severity: 'error', message: err?.message || 'Error desconocido', autoHideMs: 8000 }); }
      } catch (e) {}
    } finally { setSubmitting(false); }
  };

  return (
    <div onClick={() => onClose && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div
        className="repair-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 8, width: '90%', maxWidth: '70%', padding: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Resumen Reparaciones - Pedido #{loan?.id}</h3>
          <button onClick={() => onClose && onClose()} style={{ background: 'transparent', border: 'none', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? <p>Cargando reparaciones...</p> : (
            items.length === 0 ? <p>No hay items para reparar.</p> : (
              <div style={{ display: 'grid', gap: 12 }}>
                {items.map(it => {
                  const displayName = (it?.idTool && it.idTool.toolName) || it.toolName || it.name || it.description || `Item ${it.id}`;
                  const image = it.idTool?.imageUrl || it.idTool?.image || null;
                  return (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, border: '1px solid #e6e6e6', borderRadius: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                          {image ? (
                            <img src={image} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>Sin imagen</div>
                          )}
                        </div>
                        <div>
                          <div style={{paddingLeft: 8, fontWeight: 700 }}>{displayName}</div>
                          {it.notes && <div style={{ fontSize: 13, color: '#4b5563' }}>{it.notes}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, minWidth: 210 }}>
                        <label style={{padding: 8, justifyContent: 'center', fontSize: 16, color: '#000000ff' }}>Monto reparación</label>
                        <input
                          className="repair-amount-input"
                          type="number"
                          min={1}
                          step={1}
                          value={amounts[it.id] ?? ''}
                          placeholder="Ingrese monto"
                          onChange={e => {
                            const raw = e.target.value;
                            const num = raw === '' ? '' : Number(raw);
                            setAmounts(prev => ({ ...prev, [it.id]: num }));
                          }}
                          onBlur={e => {
                            const num = Number(e.target.value || 0);
                            if (!num || num <= 0) setAmounts(prev => ({ ...prev, [it.id]: 1 }));
                          }}
                          style={{ justifyContent: 'center', paddingLeft: 4, width: 160, padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>Total: ${new Intl.NumberFormat().format(items.reduce((acc, it) => acc + Number(amounts[it.id] || 0), 0))}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="secondary-cta" onClick={() => onClose && onClose()} disabled={submitting}>Cancelar</button>
                    <button
                      className="primary-cta"
                      disabled={submitting || items.some(it => !amounts[it.id] || Number(amounts[it.id]) <= 0)}
                      onClick={submit}
                    >{submitting ? 'Pagando...' : 'Confirmar pago'}</button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default RepairPaymentModal;
