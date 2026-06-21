import React from 'react';

interface CardProps {
  children: React.ReactNode;
  padding?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Card — Design System (NF001)
 * Cartão reutilizável com sombra suave e bordas arredondadas.
 */
export function Card({ children, padding = '20px', hover = false, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding,
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border)',
        cursor: onClick ? 'pointer' : undefined,
        transition: `box-shadow var(--transition-fast), transform var(--transition-fast)`,
        ...(hover && {
          ':hover': {
            boxShadow: 'var(--shadow-md)',
            transform: 'translateY(-1px)',
          },
        }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
