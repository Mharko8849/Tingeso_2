import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import FiltersSidebar from '../components/Filters/FiltersSidebar';
import ToolGrid from '../components/Tools/ToolGrid';
import ToolCard from '../components/Tools/ToolCard';
import CategoryListing from '../components/Categories/CategoryListing';
import ClientSearch from '../components/Clients/ClientSearch';
import OrderItemsDrawer from '../components/Orders/OrderItemsDrawer';
import api from '../services/http-common';
import { getUser } from '../services/auth';
import TransitionAlert from '../components/Alerts/TransitionAlert';

const Orders = () => {
  const [filters, setFilters] = useState({ minPrice: 0, maxPrice: 500000 });
  const [tools, setTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(false);

  const [selectedClient, setSelectedClient] = useState(null);
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [alert, setAlert] = useState(null);

  const [initDate, setInitDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  useEffect(() => { fetchTools(filters); }, []);

  const fetchTools = async (f) => {
    setLoadingTools(true);
    try {
      const qs = {};
      if (f?.minPrice) qs.minPrice = f.minPrice;
      if (f?.maxPrice) qs.maxPrice = f.maxPrice;
      const resp = await api.get('/inventory/filter', { params: qs });
      const inv = resp.data || [];
      const map = new Map();
      (inv || []).forEach((entry) => {
        // Backend returns InventoryFull which contains ToolFull in 'toolFull' field
        const t = entry.toolFull || entry.idTool || {};
        const tid = t.id;
        if (!map.has(tid)) {
          map.set(tid, {
            id: tid,
            name: t.toolName || t.name || '—',
            price: t.amounts?.priceRent ?? (typeof t.priceRent === 'number' ? t.priceRent : (typeof t.price === 'number' ? t.price : 0)),
            image: t.imageUrl ? `/images/${t.imageUrl}` : (t.image || '/images/NoImage.png'),
            stock: 0,
          });
        }
        const item = map.get(tid);
        // Backend uses toolStateName
        const state = entry.toolStateName || entry.toolState;
        if (state === 'DISPONIBLE') {
          item.stock = (item.stock || 0) + (entry.stockTool || 0);
        }
      });
      setTools(Array.from(map.values()));
    } catch (e) {
      console.warn('fetchTools failed', e);
      setTools([]);
    } finally { setLoadingTools(false); }
  };

  const addTool = (t) => {
    if (!t || !t.id) return;
    // Business rule: only one unit per tool per client/order allowed.
    const exists = items.find(p => p.id === t.id);
    if (exists) {
      setAlert({ severity: 'error', message: 'El cliente ya tiene esta herramienta en el pedido. Sólo 1 unidad por herramienta.' });
      return;
    }
    setItems(prev => [{ id: t.id, name: t.name, qty: 1, stock: t.stock, image: t.image }, ...prev]);
  };

  // Quantity is capped to 1 per business rules.
  const changeQty = (id, qty) => {
    setItems(s => s.map(i => i.id === id ? { ...i, qty: 1 } : i));
  };

  const removeItem = (id) => setItems(s => s.filter(i => i.id !== id));

  const createOrder = async () => {
    if (!selectedClient) { setAlert({ severity: 'error', message: 'Selecciona un cliente' }); return; }
    if (!items || items.length === 0) { setAlert({ severity: 'error', message: 'Agrega al menos una herramienta' }); return; }
    if (!initDate || !returnDate) { setAlert({ severity: 'error', message: 'Selecciona las fechas de inicio y devolución' }); return; }

    // validate against stock
    for (const it of items) {
      if (it.stock !== undefined && it.qty > it.stock) {
        setAlert({ severity: 'error', message: `Cantidad solicitada mayor al stock para ${it.name}` });
        return;
      }
    }

    setCreating(true);
    try {
      const user = getUser();
      const employeeId = user ? user.id : null;
      if (!employeeId) throw new Error("No se pudo identificar al empleado");

      const userId = selectedClient.userId || selectedClient.id;

      // 1. Create Loan
      const loanResp = await api.post(`/loans/create/${userId}`, null, {
        params: {
          employeeId,
          initDate,
          returnDate
        }
      });
      const loan = loanResp.data;
      if (!loan || !loan.id) throw new Error("Error al crear el préstamo");

      // 2. Add tools to loan
      // We do this sequentially to avoid race conditions or overwhelming the server, though parallel could work too.
      for (const item of items) {
        await api.post(`/loan-tools/add/${loan.id}/${item.id}`);
      }

      setAlert({ severity: 'success', message: 'Pedido creado correctamente' });
      // reset
      setItems([]);
      setSelectedClient(null);
    } catch (e) {
      console.warn('createOrder failed', e);
      setAlert({ severity: 'error', message: 'No se pudo crear el pedido. Intente nuevamente.' });
    } finally { setCreating(false); }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      {alert && <TransitionAlert alert={alert} onClose={() => setAlert(null)} />}
      <main style={{ paddingTop: 30 }} className="px-6">
        <div className="max-w-6xl mx-auto">
          <h2 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', fontWeight: 700 }}>Administración — Pedidos</h2>
          <div style={{ marginTop: 6 }}>{selectedClient ? `Cliente seleccionado: ${selectedClient.username} — ${selectedClient.name || ''}` : 'Cliente no seleccionado'}</div>

          <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Fecha Inicio</label>
              <input
                type="date"
                value={initDate}
                onChange={(e) => setInitDate(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Fecha Devolución</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {loadingTools ? <div>Cargando herramientas...</div> : (
              <CategoryListing tools={tools} onApplyFilters={fetchTools} initialFilters={filters} toolCardProps={{ showAdd: true, onAdd: addTool, addDisabled: (t) => (t.stock <= 0) || items.some(it => it.id === t.id) }} />
            )}
          </div>

          {/* alert moved to top (below NavBar) */}
        </div>
      </main>
      <OrderItemsDrawer items={items} onChangeQty={changeQty} onRemove={removeItem} onCreate={createOrder} onCancel={() => { setItems([]); setSelectedClient(null); }} creating={creating} />
    </div>
  );
};

export default Orders;
