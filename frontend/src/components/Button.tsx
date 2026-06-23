import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'var(--color-bg-tertiary)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  danger: {
    backgroundColor: 'var(--color-danger)',
    color: 'var(--color-text-inverse)',
    border: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid transparent',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: '36px', padding: '0 12px', fontSize: 'var(--text-sm)' },
  md: { height: '48px', padding: '0 20px', fontSize: 'var(--text-base)' },
  lg: { height: '56px', padding: '0 28px', fontSize: 'var(--text-lg)' },
};

/**
 * Button — Design System (NF001)
 * Altura mínima 48px (size md/lg), bordas arredondadas, alto contraste.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all var(--transition-fast)',
        width: fullWidth ? '100%' : undefined,
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {loading && <span style={{ fontSize: '14px' }}>⏳</span>}
      {children}
    </button>
  );
}
