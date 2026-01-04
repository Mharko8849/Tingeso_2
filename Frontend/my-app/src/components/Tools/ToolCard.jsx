import React from 'react';

// Reusable ToolCard used across carousel and grids
const ToolCard = ({ tool = {}, style = {}, onClick, showAdd = false, onAdd = null, addDisabled = false, layout = 'horizontal' }) => {
  const priceLabel = typeof tool.price === 'number' ? `$${tool.price.toLocaleString()}` : tool.price || '';
  const DEFAULT_IMAGE = '/NoImage.png';

  // Determine href but allow onClick to override behavior (useful later for router links)
  const href = tool.id ? `/product/${tool.id}` : '/';
  const isVertical = layout === 'vertical';

  return (
    <a
      href={href}
      onClick={(e) => {
        // If caller provided an onClick handler, call it and prevent default navigation
        if (typeof onClick === 'function') {
          e.preventDefault();
          onClick(tool, e);
        }
      }}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
      aria-label={tool.name}
    >
      <div
        className="tool-card card"
        style={{ 
          borderRadius: 8, 
          overflow: 'hidden', 
          boxShadow: '0 6px 18px rgba(15,23,42,0.04)', 
          background: '#fff', 
          position: 'relative', 
          display: 'flex', 
          flexDirection: isVertical ? 'column' : 'row',
          gap: 0, 
          alignItems: 'stretch', 
          height: '100%',
          ...style 
        }}
      >
        {showAdd && (
          <button
            onClick={(e) => {
              e.preventDefault();
              if (typeof onAdd === 'function') onAdd(tool);
            }}
            aria-label={`Agregar ${tool.name}`}
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 5, border: 'none', background: '#2b6cb0', color: '#fff', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}
          >
            +
          </button>
        )}
      
        <div style={isVertical ? { width: '100%', height: '200px', background: '#f6f7fb', position: 'relative' } : { flex: '0 0 160px', background: '#f6f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Visits Badge */}
          {tool.visits !== undefined && (
            <div style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: '#2b6cb0',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: '0.8rem',
              fontWeight: 600,
              zIndex: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {tool.visits === 1 ? '1 Pedido' : `${tool.visits} Pedidos`}
            </div>
          )}

          <img
            src={tool.image || DEFAULT_IMAGE}
            alt={tool.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_IMAGE;
            }}
          />
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: '1 1 auto' }}>
          <div>
            <h6 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#0f172a' }}>{tool.name}</h6>
            <p style={{ margin: 0, color: '#334155', fontWeight: 600 }}>{priceLabel}</p>
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', color: '#64748b', fontSize: 13 }}>
            {tool.stock !== undefined && <div>Stock: {tool.stock}</div>}
          </div>
        </div>
      </div>
    </a>
  );
};

export default ToolCard;
