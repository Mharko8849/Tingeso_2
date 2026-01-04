import React, { useRef, useState, useEffect } from 'react';
import Badge from '../Badges/Badge';
// Order items drawer: small horizontal scroller showing selected items

const OrderItemsDrawer = ({ items = [], onChangeQty = () => {}, onRemove = () => {}, onCreate = () => {}, onCancel = () => {}, creating = false }) => {
  const [open, setOpen] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    // if there are no items, keep it closed
    if (!items || items.length === 0) setOpen(false);
  }, [items]);

  const scrollBy = (delta) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };
  const totalItems = items.length;
  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80';

  // (button removed) badge/button layout was previously here — removed per request

  return (
    <div>
      {/* New Pedido button (initial simple blue box like 'Crear Pedido') */}
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1400 }}>
        <button
          onClick={() => setOpen(o => !o)}
          className="primary-cta"
          style={{ padding: '15px 18px', minHeight: 44, borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          {/* Badge placed inline to the left of the text (shows only when there are items) */}
          {totalItems > 0 && (
            <Badge
              variant="green"
              ariaLabel={`Pedido tiene ${totalItems} items`}
              style={{ width: 16, height: 16, boxShadow: '0 0 6px rgba(50,205,50,0.45)', border: '1px solid rgba(255,255,255,0.85)' }}
            />
          )}
          <span>{`Pedido (${totalItems})`}</span>
        </button>
      </div>

      {/* Drawer panel */}
      <div style={{ position: 'fixed', right: 20, left: 20, bottom: 20, height: open ? 320 : 0, zIndex: 1300, transition: 'height 220ms ease', pointerEvents: open ? 'auto' : 'none' }}>
        <div style={{ height: '100%', background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.06)', padding: 12, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>Items del pedido</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="link" onClick={() => { setOpen(false); onCancel && onCancel(); }}>Cancelar</button>
              <button className="primary-cta" onClick={onCreate} disabled={creating}>{creating ? 'Creando...' : 'Crear Pedido'}</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <button className="link" onClick={() => scrollBy(-300)} aria-label="scroll-left">◀</button>

            <div ref={scrollerRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, flex: 1 }}>
              {items && items.length > 0 ? items.map((it) => (
                <div key={it.id} style={{ minWidth: 260, maxWidth: 420, border: '1px solid #eee', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center', background: '#fafafa' }}>
                  <img src={it.image || DEFAULT_IMAGE} alt={it.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, flex: '0 0 64px' }} />
                  <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontWeight: 700 }}>{it.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ padding: '6px 0' }}>Cantidad: <strong>1</strong></div>
                      <button className="link" onClick={() => onRemove(it.id)}>Quitar</button>
                    </div>
                  </div>
                </div>
              )) : <div style={{ color: '#666' }}>No hay items</div>}
            </div>

            <button className="link" onClick={() => scrollBy(300)} aria-label="scroll-right">▶</button>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <div style={{ color: '#374151', alignSelf: 'center' }}>Total items: <strong>{totalItems}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsDrawer;
