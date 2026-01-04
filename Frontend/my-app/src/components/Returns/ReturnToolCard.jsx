import React, { useState, useEffect } from 'react';
import './returns.css';
import api from '../../services/http-common';

const formatCurrency = (v) => {
  if (v == null) return '-';
  const n = Number(v);
  if (isNaN(n)) return v;
  return `$${n.toLocaleString()}`;
};

const daysBetween = (start, end) => {
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return 1;
    const ms = e.setHours(0,0,0,0) - s.setHours(0,0,0,0);
    const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    return days;
  } catch (err) {
    return 1;
  }
};

const ReturnToolCard = ({ item, onStateChange, disabled = false }) => {
  const name = item.idTool?.toolName || `Herramienta ${item.idTool?.id}`;
  const activity = item.toolActivity || '-';
  const priceRent = Number(item.idTool?.priceRent ?? item.idTool?.price ?? item.price ?? 0) || 0;
  const initialFine = Number(item.fine ?? item.debt ?? 0) || 0; // use fine if available, fallback to debt

  // Try to compute number of rental days from loan info if available
  const initDate = item.idLoan?.initDate || item.idLoan?.init_date || null;
  const returnDate = item.idLoan?.returnDate || item.idLoan?.return_date || null;
  const days = (initDate && returnDate) ? daysBetween(initDate, returnDate) : 1;
  const totalCost = priceRent * days;

  const [selectedState, setSelectedState] = useState('');
  const [displayFine, setDisplayFine] = useState(initialFine);

  const [loadingFine, setLoadingFine] = useState(false);

  useEffect(() => {
    // reset when item changes
    setDisplayFine(initialFine);
    setSelectedState('');
  }, [item]);

  const fetchFineFromBackend = async (state) => {
    if (!state) {
      setDisplayFine(initialFine);
      return;
    }
    if (!item?.id) {
      console.warn('No item id available to request fine');
      return;
    }

    setLoadingFine(true);
    try {
      const url = `/api/loantool/fine/${item.id}`;
      console.debug('[ReturnToolCard] requesting fine', { url, params: { state } });
      // Use query param (state) so GET doesn't require a body
      const res = await api.get(url, { params: { state } });
      console.debug('[ReturnToolCard] fine response', { status: res.status, data: res.data });
      if (res && (typeof res.data === 'number' || typeof res.data === 'string')) {
        setDisplayFine(Number(res.data));
      } else {
        console.warn('Unexpected fine response', res);
      }
    } catch (err) {
      console.error('Failed to fetch fine from backend', err?.response ?? err);
      // keep previous value
    } finally {
      setLoadingFine(false);
    }
  };

  const onStateChangeLocal = (ev) => {
    if (disabled) return; // prevent changes when disabled (loan finalized)
    const st = ev.target.value;
    setSelectedState(st);
    // notify parent so it can build the map of states for the batch call
    if (typeof onStateChange === 'function') {
      try { onStateChange(item.id, st); } catch (e) { console.warn('onStateChange callback failed', e); }
    }
    fetchFineFromBackend(st);
  };

  return (
    <li className="card return-tool-card">
      <div className="tool-rect">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
            {item.idTool?.imageUrl ? (
              <img
                src={item.idTool.imageUrl}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>
                Sin imagen
              </div>
            )}
          </div>

          <div>
            <div className="tool-name">{name}</div>
            <div className="tool-activity">Actividad: <span className="muted">{activity}</span></div>
          </div>
        </div>

        <div className="tool-cost">Costo: <strong>{formatCurrency(priceRent)}</strong>{days > 1 ? <span className="muted"> ({days} días, total {formatCurrency(totalCost)})</span> : null}</div>
        <div className="tool-debt">Multa: <strong>{formatCurrency(displayFine)}</strong></div>

        <div className="tool-state">
          <span className="tool-state-label">Estado:</span>
          <select id={`state-${item.id}`} value={selectedState} onChange={onStateChangeLocal} className="tool-state-select" disabled={disabled}>
            <option value="">-- Seleccionar estado --</option>
            <option value="SIN DAÑO">SIN DAÑO</option>
            <option value="DAÑO">DAÑO</option>
            <option value="IRREPARABLE">IRREPARABLE</option>
          </select>
        </div>
      </div>
    </li>
  );
};

export default ReturnToolCard;
