import React from 'react';

interface ChipProps {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Chip — Design System (NF001)
 * Pill/etiqueta para filtros e categorias. Touch-friendly (min 44px).
 */
export function Chip({ label, icon, active = false, onClick, style }: ChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: '10px 18px',
        minHeight: '44px',
        borderRadius: 'var(--radius-full)',
        border: active
          ? '2px solid var(--color-primary)'
          : '2px solid var(--color-border)',
        backgroundColor: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
        color: active ? 'var(--color-primary)' : 'var(--color-text)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        transition: 'all var(--transition-fast)',
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: 'var(--text-base)' }}>{icon}</span>}
      {label}
    </button>
  );
}
