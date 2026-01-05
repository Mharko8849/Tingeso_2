import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import FiltersSidebar from '../components/Filters/FiltersSidebar';
import ToolGrid from '../components/Tools/ToolGrid';
import ToolCard from '../components/Tools/ToolCard';
import CategoryListing from '../components/Categories/CategoryListing';
import ClientSearch from '../components/Clients/ClientSearch';
import OrderItemsDrawer from '../components/Orders/OrderItemsDrawer';
import api from '../services/http-common';
import TransitionAlert from '../components/Alerts/TransitionAlert';

const Orders = () => {
  const [filters, setFilters] = useState({ minPrice: 0, maxPrice: 500000 });
  const [tools, setTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(false);

  const [selectedClient, setSelectedClient] = useState(null);
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [alert, setAlert] = useState(null);

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

    // validate against stock
    for (const it of items) {
      if (it.stock !== undefined && it.qty > it.stock) {
        setAlert({ severity: 'error', message: `Cantidad solicitada mayor al stock para ${it.name}` });
        return;
      }
    }

    const payload = { clientId: selectedClient.id, items: items.map(i => ({ toolId: i.id, quantity: i.qty })) };
    setCreating(true);
    try {
      const resp = await api.post('/orders', payload);
      setAlert({ severity: 'success', message: 'Pedido creado correctamente' });
      // reset
      setItems([]);
      setSelectedClient(null);
    } catch (e) {
      console.warn('createOrder failed', e);
      setAlert({ severity: 'error', message: 'No se pudo crear el pedido (simulado)' });
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
