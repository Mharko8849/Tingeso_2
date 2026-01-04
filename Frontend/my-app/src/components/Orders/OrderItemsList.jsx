import React from 'react';
import Badge from '../Badges/Badge';

const OrderItemsList = ({ items = [], onChangeQty = () => {}, onRemove = () => {}, onCreate = () => {}, onCancel = () => {}, creating = false }) => {
  const totalItems = items.reduce((s, i) => s + (i.qty || 0), 0);

  return (
    <div>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge variant={totalItems > 0 ? 'green' : undefined} ariaLabel={`Pedido tiene ${totalItems} items`} />
        Items del pedido
      </h4>
      {items.length === 0 && <div>No hay items</div>}
      {items.map((it) => (
        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid #eee' }}>
          <div style={{ flex: 1 }}>{it.name}</div>
          <div>
            <input type="number" value={it.qty} min={1} onChange={(e) => onChangeQty(it.id, Number(e.target.value))} style={{ width: 72, padding: 6 }} />
          </div>
          <div><button className="link" onClick={() => onRemove(it.id)}>Quitar</button></div>
        </div>
      ))}

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#444' }}>Total items: <strong>{totalItems}</strong></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="primary-cta" onClick={onCreate} disabled={creating}>{creating ? 'Creando...' : 'Crear Pedido'}</button>
          <button className="link" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  ); 
};

export default OrderItemsList;
