import React, { useEffect, useState } from 'react';
import api from '../../services/http-common';
import './ModalAddStockTool.css';

const ModalAddStockTool = ({ open, onClose, toolId, onAdded }) => {
  // allow empty string while typing, validate on blur/confirm (like RepairPaymentModal)
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toolName, setToolName] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // resolve current user id
      const me = await api.get('/api/user/me');
      const userId = me.data?.id;
      if (!userId) throw new Error('Usuario no identificado');

      // validate quantity (must be integer >= 1)
      const qty = Number(quantity || 0);
      if (!qty || qty < 1) throw new Error('Cantidad inválida. Debe ser un número entero mayor o igual a 1');

      // call backend add-stock endpoint: POST /inventory/add-stock/{idUser}/{idTool}?quantity=
      await api.post(`/inventory/add-stock/${userId}/${toolId}`, null, { params: { quantity: qty } });

      if (onAdded) onAdded();
      onClose();
    } catch (e) {
      console.warn('Failed to add stock', e);
      // prefer backend message when available
      const msg = e?.response?.data || e?.message || 'No se pudo añadir stock';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !toolId) return;
    let mounted = true;
    setLoadingName(true);
    (async () => {
      try {
        const res = await api.get('/inventory/filter', { params: { idTool: toolId } });
        const arr = res.data || [];
        const t = (arr[0] && arr[0].idTool) || {};
        if (!mounted) return;
        setToolName(t.toolName || t.name || '');
      } catch (e) {
        console.warn('Failed to fetch tool name', e);
        if (mounted) setToolName('');
      } finally {
        if (mounted) setLoadingName(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, toolId]);

  if (!open) return null;

  return (
    <div className="mas-backdrop">
      <div className="mas-modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
          </div>
          <h3 style={{ margin: 0 }}>Añadir stock</h3>
          <div style={{ width: 60 }} />
        </div>

        <p style={{ marginTop: 8 }}>Herramienta ID: <strong>{toolId}</strong></p>
        {loadingName ? <p style={{ marginTop: 4 }}>Cargando nombre...</p> : (toolName ? <p style={{ marginTop: 4 }}>Nombre: <strong>{toolName}</strong></p> : null)}
        <div className="mas-row">
          <label>Cantidad</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => {
              const raw = e.target.value;
              const num = raw === '' ? '' : Number(raw);
              setQuantity(num);
            }}
            onBlur={(e) => {
              const num = Number(e.target.value || 0);
              if (!num || num < 1) setQuantity(1);
            }}
          />
        </div>
        {error && <div className="mas-error">{error}</div>}
        <div className="mas-actions">
          <button className="mas-btn mas-confirm" onClick={handleConfirm} disabled={loading}>{loading ? 'Guardando...' : 'Confirmar'}</button>
          <button className="mas-btn mas-cancel" onClick={onClose} disabled={loading}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalAddStockTool;
