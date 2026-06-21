import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function OTPPage() {
  const { sendOTP, verifyOTP, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // Auto-send OTP on mount
  useEffect(() => {
    if (!phone) {
      navigate('/login');
      return;
    }
    handleSendOTP();
  }, []);

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await sendOTP(phone);
      setCodeSent(true);
      setMessage('Código enviado para seu telefone!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao enviar código.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Digite o código de 6 dígitos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOTP(phone, code);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Verificar Código</h1>
        <p style={styles.subtitle}>
          Enviamos um código de 6 dígitos para<br />
          <strong>{phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</strong>
        </p>

        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleVerify} style={styles.form}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <button onClick={handleSendOTP} style={styles.resendBtn} disabled={loading}>
          Reenviar código
        </button>

        <button onClick={() => navigate('/login')} style={styles.backBtn}>
          Voltar
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
  },
  title: { fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', color: '#666', margin: '0 0 24px 0', lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    padding: '14px',
    fontSize: '24px',
    textAlign: 'center',
    letterSpacing: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  resendBtn: {
    marginTop: '16px',
    background: 'none',
    border: 'none',
    color: '#1a1a2e',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  backBtn: {
    marginTop: '8px',
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '14px',
    cursor: 'pointer',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  success: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
};
