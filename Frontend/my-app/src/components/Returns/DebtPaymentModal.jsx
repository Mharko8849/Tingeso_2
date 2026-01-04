import React, { useEffect, useState } from 'react';
import api from '../../services/http-common';
import { useAlert } from '../../components/Alerts/useAlert';

const DebtPaymentModal = ({ open, onClose, loan, totalFine, onPaid }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const alert = useAlert();

  useEffect(() => {
    if (!open || !loan) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        // Cargar herramientas con multa asociadas al préstamo
        const resp = await api.get(`/api/loantool/loan/${loan.id}`);
        if (!mounted) return;
        const data = Array.isArray(resp?.data) ? resp.data : [];
        // Filtrar solo las que tienen multa/deuda > 0
        const withFine = data.filter(it => {
          const fine = Number(it.fine ?? it.debt ?? 0);
          return fine > 0;
        });
        setItems(withFine);
      } catch (err) {
        console.error('Error loading debt items', err?.response ?? err);
        try {
          alert?.show?.({ severity: 'error', message: 'No se pudieron cargar las herramientas con multa.', autoHideMs: 7000 });
        } catch (e) {}
        onClose && onClose();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, loan]);

  const submit = async () => {
    if (!loan) return;
    setSubmitting(true);
    try {
      const meResp = await api.get('/api/user/me');
      const employeeId = meResp?.data?.id;
      if (!employeeId) throw new Error('No pude obtener tu id de usuario (employee)');
      const url = `/api/loantool/paydebt/${loan.id}/user/${employeeId}`;
      await api.post(url);
      try { alert?.show?.({ severity: 'success', message: 'Deuda pagada correctamente.', autoHideMs: 3000 }); } catch (e) {}
      onPaid && onPaid();
      onClose && onClose();
    } catch (err) {
      console.error('Error al pagar deuda', err?.response ?? err);
      const resp = err?.response?.data;
      try {
        if (resp) { alert?.show?.({ severity: 'error', message: typeof resp === 'string' ? resp : JSON.stringify(resp), autoHideMs: 8000 }); }
        else { alert?.show?.({ severity: 'error', message: err?.message || 'Error desconocido', autoHideMs: 8000 }); }
      } catch (e) {}
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div className="repair-modal" style={{ width: '90%', maxWidth: '70%', background: '#fff', padding: 20, borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Pagar Multa - Pedido #{loan?.id}</h3>
          <button onClick={() => onClose && onClose()} style={{ background: 'transparent', border: 'none', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <p>Cargando herramientas con multa...</p>
          ) : items.length === 0 ? (
            <p>No hay herramientas con multa para este pedido.</p>
          ) : (
            <>
              <div style={{ display: 'grid', gap: 12 }}>
                {items.map(it => {
                  const name = (it.idTool && (it.idTool.toolName || it.idTool.name)) || it.toolName || it.name || `Herramienta ${it.id}`;
                  const image = it.idTool?.imageUrl || it.idTool?.image || null;
                  const fine = Number(it.fine ?? it.debt ?? 0) || 0;
                  return (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                          {image ? (
                            <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>Sin imagen</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{name}</div>
                          <div style={{ fontSize: 13, color: '#4b5563' }}>Multa: ${new Intl.NumberFormat().format(fine)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>Total a pagar: ${new Intl.NumberFormat().format(Number(totalFine || 0))}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="secondary-cta" onClick={() => onClose && onClose()} disabled={submitting}>Cancelar</button>
                  <button className="primary-cta" disabled={submitting} onClick={submit}>{submitting ? 'Pagando...' : 'Pagar deuda'}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtPaymentModal;
