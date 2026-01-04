import React, { useEffect, useState } from 'react';
import NavBar from '../components/Layout/NavBar';
import BackButton from '../components/Common/BackButton';
import CategoryListing from '../components/Categories/CategoryListing';
import OrderItemsDrawer from '../components/Orders/OrderItemsDrawer';
import api from '../services/http-common';
import TransitionAlert from '../components/Alerts/TransitionAlert';

const OrdersCreateTools = () => {
  const [filters, setFilters] = useState({ minPrice: 0, maxPrice: 500000 });
  const [tools, setTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(false);

  const [selectedClient, setSelectedClient] = useState(null);
  const [items, setItems] = useState([]);
  const [loanId, setLoanId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('order_selected_client');
      if (raw) setSelectedClient(JSON.parse(raw));
      // restore loan id if present
      const lid = sessionStorage.getItem('order_loan_id');
      if (lid) setLoanId(Number(lid));
      // restore any locally selected items (Option B: keep LoanXTools local until confirm)
      const its = sessionStorage.getItem('order_items');
      if (its) {
        try { setItems(JSON.parse(its)); } catch (e) { /* ignore parse errors */ }
      }
    } catch (e) { console.warn('could not read selected client', e); }
    fetchTools(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Loan draft creation moved to the client-selection step (Next button). Do not auto-create here.
  }, [selectedClient]);

  const fetchTools = async (f) => {
    setLoadingTools(true);
    try {
      const qs = {};
      if (f?.minPrice) qs.minPrice = f.minPrice;
      if (f?.maxPrice) qs.maxPrice = f.maxPrice;
      if (f?.q) qs.q = f.q;
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
    // Validate with backend that the client doesn't already have this tool in another active loan
    (async () => {
      try {
        if (!selectedClient || !selectedClient.id) {
          setAlert({ severity: 'error', message: 'No hay cliente seleccionado. Vuelve atrás.' });
          return;
        }
        const resp = await api.get(`/loan-tools/validate/${selectedClient.id}/${t.id}`);
        const already = resp.data === true;
        if (already) {
          setAlert({ severity: 'error', message: 'El cliente ya tiene esta herramienta en otro pedido activo.' });
          return;
        }
      } catch (e) {
        console.warn('Validation call failed, allowing add as fallback', e?.response?.data || e.message || e);
        // If validation fails, allow add but inform user
      }

      // include price if available (from the tool object or from current tools list)
      const toolObj = tools.find(x => x.id === t.id);
      const price = (t.price !== undefined && t.price !== null) ? t.price : (toolObj ? toolObj.price : 0);
      const newItem = { id: t.id, name: t.name, qty: 1, stock: t.stock, image: t.image, price };
      const next = [newItem, ...items];
      setItems(next);
      try { sessionStorage.setItem('order_items', JSON.stringify(next)); } catch (e) { /* ignore */ }
      // show immediate success feedback to the user
      setAlert({ severity: 'success', message: 'Herramienta agregada al pedido.' });
    })();
  };

  // Quantity limited to 1 per business rules.
  const changeQty = (id, qty) => setItems(s => s.map(i => i.id === id ? { ...i, qty: 1 } : i));
  const removeItem = async (id) => {
    // Option B: LoanXTools are local until confirm; removing item just updates local state
    const next = items.filter(i => i.id !== id);
    setItems(next);
    try { sessionStorage.setItem('order_items', JSON.stringify(next)); } catch (e) { /* ignore */ }
  };

  const goBackSelectClient = async () => {
    // Attempt to delete any draft loan and clear local/session state before navigating back
    try {
      const lid = loanId || sessionStorage.getItem('order_loan_id');
      if (lid) {
        try {
          const me = await api.get('/users/me');
          const employeeId = me.data?.id;
          if (employeeId) {
            await api.delete(`/loans/${lid}`);
          }
        } catch (e) {
          console.warn('Could not delete loan draft on goBackSelectClient', e?.response?.data || e.message || e);
        }
      }
    } catch (e) { /* ignore */ }

    // clear local and session draft state
    setItems([]);
    setSelectedClient(null);
    setLoanId(null);
    try {
      sessionStorage.removeItem('order_selected_client');
      sessionStorage.removeItem('order_items');
      sessionStorage.removeItem('order_loan_id');
      sessionStorage.removeItem('order_resume');
    } catch (e) {}

    window.history.pushState({}, '', '/admin/orders/create');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const createOrder = async () => {
    // Instead of immediately posting to backend, redirect to the resume/summary page
    if (!selectedClient) { setAlert({ severity: 'error', message: 'No hay cliente seleccionado. Vuelve atrás.' }); return; }
    if (!items || items.length === 0) { setAlert({ severity: 'error', message: 'Agrega al menos una herramienta' }); return; }

    for (const it of items) {
      if (it.stock !== undefined && it.qty > it.stock) { setAlert({ severity: 'error', message: `Cantidad solicitada mayor al stock para ${it.name}` }); return; }
    }

  // Ensure a loan draft exists before saving the resume
  let currentLoanId = loanId || sessionStorage.getItem('order_loan_id');
  if (!currentLoanId) {
    setAlert({ severity: 'error', message: 'No se encontró el pedido asociado. Vuelve al paso anterior y crea el pedido con las fechas.' });
    return;
  }

  // Save resume data to sessionStorage so the resume page can read it (include loanId)
  const resume = { client: selectedClient, items, loanId: currentLoanId };
  try {
    sessionStorage.setItem('order_resume', JSON.stringify(resume));
    // navigate to resume page
    window.history.pushState({}, '', '/admin/orders/resume');
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch (e) {
    console.warn('Could not save resume data', e);
    setAlert({ severity: 'error', message: 'No se pudo preparar el resumen del pedido' });
  }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />
      {alert && <TransitionAlert alert={alert} onClose={() => setAlert(null)} />}
      <main style={{ paddingTop: 30 }} className="px-6">
        <div className="max-w-6xl mx-auto">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0 }}>Crear Pedido — Herramientas</h2>
              </div>
              <div style={{ marginTop: 6 }}>{selectedClient ? `Cliente: ${selectedClient.username} — ${selectedClient.name || ''}` : 'Cliente no seleccionado'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <BackButton onClick={goBackSelectClient} />
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

      {/* Drawer with horizontal list of selected items */}
      <OrderItemsDrawer items={items} onChangeQty={changeQty} onRemove={removeItem} onCreate={createOrder} onCancel={async () => {
        // attempt to delete draft loan on cancel
        try {
          const lid = loanId || sessionStorage.getItem('order_loan_id');
          if (lid) {
            const me = await api.get('/users/me');
            const employeeId = me.data?.id;
            if (employeeId) {
              // backend exposes DELETE /loans/{id}
              await api.delete(`/loans/${lid}`);
            }
          }
        } catch (e) {
          console.warn('Could not delete loan draft on cancel', e?.response?.data || e.message || e);
        }
        setItems([]);
        try { sessionStorage.removeItem('order_selected_client'); sessionStorage.removeItem('order_items'); sessionStorage.removeItem('order_loan_id'); } catch (e) {}
        setLoanId(null);
        window.history.pushState({}, '', '/admin/orders/create');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }} creating={creating} />
    </div>
  );
};

export default OrdersCreateTools;
