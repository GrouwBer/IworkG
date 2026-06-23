import React, { useEffect, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let addToastFn: ((message: string, type: ToastType) => void) | null = null;

/**
 * Toast API — use imperativamente:
 *   import { showToast } from './components/Toast';
 *   showToast('Salvo!', 'success');
 */
export function showToast(message: string, type: ToastType = 'info') {
  addToastFn?.(message, type);
}

const typeStyles: Record<ToastType, React.CSSProperties> = {
  success: { backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', borderColor: 'var(--color-success)' },
  error: { backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' },
  warning: { backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)', borderColor: 'var(--color-warning)' },
  info: { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' },
};

const typeIcons: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

/**
 * Toast — Design System (NF001)
 * Notificação temporária. Renderize <ToastContainer /> no App.
 */
export function ToastContainer({ message, type: _type, visible: _visible, onClose: _onClose }: {
  message?: string;
  type?: string;
  visible?: boolean;
  onClose?: () => void;
}) {

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = add;
    return () => { addToastFn = null; };
  }, [add]);

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--space-6)',
      right: 'var(--space-6)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      maxWidth: '360px',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => remove(toast.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            animation: 'slideIn 0.3s ease',
            ...typeStyles[toast.type],
          }}
        >
          <span>{typeIcons[toast.type]}</span>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
