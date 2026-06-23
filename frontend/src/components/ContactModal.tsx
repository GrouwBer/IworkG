import { useState } from 'react';
import api from '../services/api';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  providerPhone: string | null;
}

export default function ContactModal({ open, onClose, providerId, providerName, providerPhone }: ContactModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleContact = async (type: 'whatsapp' | 'phone') => {
    if (!providerPhone) {
      setError('Este prestador não possui telefone cadastrado.');
      return;
    }
    setLoading(type);
    setError('');

    try {
      // Register contact in history
      await api.post('/api/contacts', {
        provider_id: providerId,
        contact_type: type,
      });

      const cleanedPhone = providerPhone.replace(/\D/g, '');

      if (type === 'whatsapp') {
        window.open(`https://wa.me/55${cleanedPhone}`, '_blank');
      } else if (type === 'phone') {
        window.open(`tel:+55${cleanedPhone}`, '_blank');
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar contato.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Entrar em Contato</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <p style={styles.subtitle}>
          Entre em contato com <strong>{providerName}</strong>
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.options}>
          {/* WhatsApp */}
          <button
            onClick={() => handleContact('whatsapp')}
            disabled={loading !== null}
            style={styles.optionBtn}
          >
            <span style={styles.optionIcon}>💬</span>
            <div style={styles.optionText}>
              <strong>WhatsApp</strong>
              <span style={styles.optionDesc}>
                {providerPhone
                  ? `Conversar pelo WhatsApp`
                  : 'Telefone não cadastrado'}
              </span>
            </div>
            {loading === 'whatsapp' && <span style={styles.spinner}>⏳</span>}
          </button>

          {/* Phone Call */}
          <button
            onClick={() => handleContact('phone')}
            disabled={loading !== null}
            style={styles.optionBtn}
          >
            <span style={styles.optionIcon}>📞</span>
            <div style={styles.optionText}>
              <strong>Ligar</strong>
              <span style={styles.optionDesc}>
                {providerPhone
                  ? `Discar para ${providerPhone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')}`
                  : 'Telefone não cadastrado'}
              </span>
            </div>
            {loading === 'phone' && <span style={styles.spinner}>⏳</span>}
          </button>

          {/* Chat (Phase 2) */}
          <button
            disabled
            style={{ ...styles.optionBtn, ...styles.optionDisabled }}
          >
            <span style={styles.optionIcon}>💭</span>
            <div style={styles.optionText}>
              <strong>Chat In-App</strong>
              <span style={styles.optionDesc}>Disponível em breve</span>
            </div>
            <span style={styles.badge}>Em breve</span>
          </button>
        </div>

        <p style={styles.footer}>
          Ao entrar em contato, o evento será registrado no seu histórico.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    fontSize: '16px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    width: '100%',
  },
  optionDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  optionIcon: {
    fontSize: '28px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  optionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    fontSize: '14px',
  },
  optionDesc: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '20px',
    whiteSpace: 'nowrap' as const,
  },
  spinner: {
    fontSize: '18px',
  },
  footer: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    margin: 0,
  },
};
