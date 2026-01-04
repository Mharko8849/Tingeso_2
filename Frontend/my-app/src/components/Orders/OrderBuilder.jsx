import React, { useEffect, useState } from 'react';
import Badge from '../Badges/Badge';
import api from '../../services/http-common';
import { getUser } from '../../services/auth';
import ToolCard from '../Tools/ToolCard';
import '../Tools/ToolDropdown.css';
import PaginationBar from '../Common/PaginationBar';

const OrderBuilder = ({ onClose, onCreated }) => {
  const [clients, setClients] = useState([]);
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const [tools, setTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [queryTools, setQueryTools] = useState('');
  const [toolsPage, setToolsPage] = useState(1);
  const [toolsPageSize, setToolsPageSize] = useState(8);

  const [items, setItems] = useState([]); // { id, name, qty }
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    // fetch clients (admins can view all clients)
    const fetchClients = async () => {
      try {
        const resp = await api.get('/clients');
        const mappedClients = (resp.data || []).map(clientFull => ({
          ...clientFull.user,
          id: clientFull.id, // Use client ID
          userId: clientFull.user.id,
          loans: clientFull.loans,
          stateClient: clientFull.stateClient
        }));
        setClients(mappedClients);
      } catch (e) {
        console.warn('Could not fetch clients', e);
        setClients([]);
      }
    };
    fetchClients();

    // initial tools load (reuse Inventory filtering endpoint)
    fetchTools('');
  }, []);

  const fetchTools = async (q) => {
    setLoadingTools(true);
    try {
      const params = {};
      if (q) params.q = q;
      const resp = await api.get('/inventory/filter', { params });
      const inv = resp.data || [];
      const map = new Map();
      (inv || []).forEach((entry) => {
        const t = entry.idTool || {};
        const tid = t.id;
        if (!map.has(tid)) {
          map.set(tid, {
            id: tid,
            name: t.toolName || t.name || '—',
            price: t.priceRent || t.price || 0,
            image: t.image,
            stock: 0,
          });
        }
        const item = map.get(tid);
        if (entry.toolState === 'DISPONIBLE') {
          item.stock = (item.stock || 0) + (entry.stockTool || 0);
        }
      });
      setTools(Array.from(map.values()));
    } catch (e) {
      console.warn('fetchTools fallback', e);
      setTools([]);
    } finally {
      setLoadingTools(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!clientQuery) return true;
    const s = clientQuery.toLowerCase();
    return (String(c.username || '') + ' ' + String(c.name || '') + ' ' + String(c.lastName || '') + ' ' + String(c.email || '')).toLowerCase().includes(s);
  });

  const addTool = (tool) => {
    if (!tool || !tool.id) return;
    setItems((prev) => {
      const found = prev.find((p) => p.id === tool.id);
      if (found) {
        return prev.map((p) => p.id === tool.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [{ id: tool.id, name: tool.name, qty: 1 }, ...prev];
    });
  };

  const removeItem = (id) => setItems((s) => s.filter((i) => i.id !== id));
  const changeQty = (id, qty) => setItems((s) => s.map((i) => i.id === id ? { ...i, qty: Math.max(1, qty) } : i));

  const totalTools = tools.length;
  const totalToolsPages = Math.max(1, Math.ceil(totalTools / toolsPageSize));
  const safeToolsPage = Math.min(Math.max(1, toolsPage), totalToolsPages);
  const toolsStart = (safeToolsPage - 1) * toolsPageSize;
  const toolsEnd = toolsStart + toolsPageSize;
  const pagedTools = tools.slice(toolsStart, toolsEnd);

  const createOrder = async () => {
    if (!selectedClient) { setAlert({ severity: 'error', message: 'Selecciona un cliente' }); return; }
    if (!items || items.length === 0) { setAlert({ severity: 'error', message: 'Añade al menos una herramienta' }); return; }

    try {
      const user = getUser();
      const employeeId = user ? user.id : null;
      if (!employeeId) throw new Error("No se pudo identificar al empleado");

      const initDate = new Date().toISOString().split('T')[0];
      const returnDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 1. Create Loan
      const loanResp = await api.post(`/loans/create/${selectedClient.id}`, null, {
        params: { employeeId, initDate, returnDate }
      });
      const loan = loanResp.data;

      // 2. Add Items
      for (const item of items) {
        for (let i = 0; i < item.qty; i++) {
           await api.post(`/loan-tools/add/${loan.id}/${item.id}`);
        }
      }

      setAlert({ severity: 'success', message: 'Pedido creado correctamente' });
      if (onCreated) onCreated(loan);
      setTimeout(() => { if (onClose) onClose(); }, 900);
    } catch (e) {
      console.warn('createOrder failed', e);
      setAlert({ severity: 'error', message: 'Error creando pedido: ' + (e.response?.data?.message || e.message) });
    }
  };

  return (
    <div className="tool-overlay" onClick={onClose}>
      <div className="tool-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1200 }}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <h3>Crear Pedido</h3>

        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <div style={{ width: 320 }}>
            <label>Buscar cliente</label>
            <input placeholder="Escribe nombre, usuario o email" value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
            <div style={{ marginTop: 8, maxHeight: 240, overflow: 'auto', border: '1px solid #eee', borderRadius: 6 }}>
              {filteredClients.map((c) => (
                <div key={c.id} style={{ padding: 8, cursor: 'pointer', background: selectedClient?.id === c.id ? '#eef6ff' : 'transparent' }} onClick={() => setSelectedClient(c)}>
                  <div style={{ fontWeight: 700 }}>{c.username} {c.name ? `- ${c.name} ${c.lastName || ''}` : ''}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{c.email}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <h4>Cliente seleccionado</h4>
              {selectedClient ? (
                <div style={{ padding: 10, border: '1px solid #eee', borderRadius: 6 }}>
                  <div style={{ fontWeight: 700 }}>{selectedClient.username}</div>
                  <div style={{ fontSize: 13 }}>{selectedClient.name} {selectedClient.lastName}</div>
                  <div style={{ fontSize: 13 }}>{selectedClient.email}</div>
                </div>
              ) : <div>No hay cliente seleccionado</div>}
            </div>

          </div>

          <div style={{ flex: 1 }}>
            <label>Buscar herramientas</label>
            <input placeholder="Filtrar por nombre" value={queryTools} onChange={(e) => { setQueryTools(e.target.value); setToolsPage(1); fetchTools(e.target.value); }} style={{ width: '100%', padding: 8, marginTop: 6 }} />

            <div style={{ marginTop: 12 }}>
              {loadingTools ? <div>Cargando herramientas...</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {pagedTools.map((t) => (
                    <ToolCard key={t.id} tool={t} showAdd={true} onAdd={addTool} addDisabled={t.stock <= 0} />
                  ))}
                </div>
              )}
              <PaginationBar
                page={safeToolsPage}
                pageSize={toolsPageSize}
                total={totalTools}
                onPageChange={(p) => setToolsPage(p)}
                onPageSizeChange={(ps) => { setToolsPageSize(ps); setToolsPage(1); }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge variant={items && items.length > 0 ? 'green' : undefined} ariaLabel={`Pedido tiene ${items.length} items`} />
                Items del pedido
              </h4>
              {items.length === 0 && <div>No hay items</div>}
              {items.map((it) => (
                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid #eee' }}>
                  <div style={{ flex: 1 }}>{it.name}</div>
                  <div>
                    <input type="number" value={it.qty} min={1} onChange={(e) => changeQty(it.id, Number(e.target.value))} style={{ width: 64, padding: 6 }} />
                  </div>
                  <div><button className="link" onClick={() => removeItem(it.id)}>Quitar</button></div>
                </div>
              ))}

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="primary-cta" onClick={createOrder}>Crear Pedido</button>
                <button className="link" onClick={onClose}>Cancelar</button>
              </div>

              {alert && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: alert.severity === 'success' ? '#bbf7d0' : '#fecaca', color: alert.severity === 'success' ? '#064e3b' : '#7f1d1d' }}>{alert.message}</div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderBuilder;
