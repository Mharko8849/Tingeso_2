import React from 'react';
import ToolCard from './ToolCard';

// ToolGrid now accepts `toolCardProps` which are forwarded to each ToolCard.
const ToolGrid = ({ tools = [], toolCardProps = {} }) => {
  if (!tools || tools.length === 0) return <div>No se encontraron herramientas.</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18 }}>
      {tools.map((t) => {
        // allow addDisabled to be computed per-tool when a function is provided
        const resolvedAddDisabled = typeof toolCardProps.addDisabled === 'function' ? toolCardProps.addDisabled(t) : toolCardProps.addDisabled;
        const perToolProps = { ...toolCardProps, addDisabled: resolvedAddDisabled };
        return <ToolCard key={t.id} tool={t} style={{ margin: 0 }} {...perToolProps} />;
      })}
    </div>
  );
};

export default ToolGrid;
