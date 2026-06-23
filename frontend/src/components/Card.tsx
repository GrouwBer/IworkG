import React, { useState } from 'react';

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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding,
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--color-border)',
        cursor: onClick ? 'pointer' : undefined,
        transform: isHovered ? 'translateY(-1px)' : undefined,
        transition: `box-shadow var(--transition-fast), transform var(--transition-fast)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
