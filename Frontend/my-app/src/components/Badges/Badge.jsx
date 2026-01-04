import React from 'react';
import './Badge.css';

// Default styles for different badge variants.
const VARIANT_DEFAULTS = {
  green: {
    backgroundColor: 'limegreen',
    boxShadow: '0 0 6px rgba(50,205,50,0.45)'
  },
  yellow: {
    backgroundColor: '#f0df1cff',
    boxShadow: '0 0 8px rgba(255, 218, 30, 0.35)'
  },
  red: {
    backgroundColor: '#ef4444',
    boxShadow: '0 0 6px rgba(239,68,68,0.7)'
  },
  blue: {
    backgroundColor: '#60a5fa',
    boxShadow: '0 0 8px rgba(96,165,250,0.45)'
  }
};

// Base styles to ensure visibility even if CSS fails to load.
const FALLBACK_BASE_STYLE = {
  display: 'inline-block',
  boxSizing: 'border-box',
  flex: '0 0 auto',
  width: 16,
  height: 16,
  minWidth: 16,
  maxWidth: 16,
  minHeight: 16,
  maxHeight: 16,
  overflow: 'hidden',
  borderRadius: '50%',
  verticalAlign: 'middle',
  lineHeight: 0,
};

/**
 * Badge component.
 * Renders a small colored circle indicating status.
 * 
 * Props:
 *  - variant: 'green' | 'red' | 'blue' | 'yellow' (default 'red')
 *  - className: additional CSS classes
 *  - title: tooltip text
 *  - ariaLabel: accessibility label
 *  - style: inline style overrides
 */
const Badge = ({ variant = 'red', className = '', title = '', ariaLabel = '', style = {} }) => {
  const cls = `badge badge--${variant} ${className}`.trim();
  
  // Determines the aria-label based on props or defaults to a descriptive text.
  const aLabel = ariaLabel || (title ? title : (variant === 'green' ? 'Activo' : (variant === 'red' ? 'Inactivo' : 'Estado')));

  const mergedStyle = { 
    ...FALLBACK_BASE_STYLE, 
    ...(VARIANT_DEFAULTS[variant] || VARIANT_DEFAULTS.green), 
    ...style 
  };

  return <span className={cls} title={title} aria-label={aLabel} style={mergedStyle} />;
};

export default Badge;
