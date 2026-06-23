import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/Toast';

type Step = 'identify' | 'verify' | 'reset';

export default function ForgotAccessPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('identify');
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSendCode = async () => {
    if (!identifier) {
      setToast({ message: 'Informe seu telefone ou e-mail.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const payload = method === 'phone'
        ? { phone: identifier }
        : { email: identifier };
      const { data } = await api.post('/api/auth/recover/send', payload);
      setToast({ message: data.message, type: 'success' });
      setStep('verify');
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || 'Erro ao enviar código.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setToast({ message: 'Digite o código de recuperação.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const payload = method === 'phone'
        ? { phone: identifier, code }
        : { email: identifier, code };
      const { data } = await api.post('/api/auth/recover/verify', payload);
      setRecoveryToken(data.recoveryToken);
      setToast({ message: 'Código verificado! Defina seu novo acesso.', type: 'success' });
      setStep('reset');
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || 'Código inválido.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!newPhone && !newEmail) {
      setToast({ message: 'Informe ao menos um novo telefone ou e-mail.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/recover/reset', {
        recoveryToken,
        newPhone: newPhone || undefined,
        newEmail: newEmail || undefined,
      });
      setToast({ message: data.message, type: 'success' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || 'Erro ao redefinir acesso.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'success'}
        visible={!!toast}
        onClose={() => setToast(null)}
      />

      <div style={styles.card}>
        <h1 style={styles.logo}>IworkG</h1>
        <h2 style={styles.title}>
          {step === 'identify' && '🔐 Recuperar Acesso'}
          {step === 'verify' && '📩 Verificar Código'}
          {step === 'reset' && '✏️ Definir Novo Acesso'}
        </h2>

        {step === 'identify' && (
          <>
            <p style={styles.desc}>
              Informe seu telefone ou e-mail para receber um código de recuperação.
            </p>

            {/* Method toggle */}
            <div style={styles.toggleRow}>
              <button
                onClick={() => setMethod('phone')}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: method === 'phone' ? '#2563eb' : '#e5e7eb',
                  color: method === 'phone' ? '#fff' : '#374151',
                }}
              >
                📱 Telefone
              </button>
              <button
                onClick={() => setMethod('email')}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: method === 'email' ? '#2563eb' : '#e5e7eb',
                  color: method === 'email' ? '#fff' : '#374151',
                }}
              >
                📧 E-mail
              </button>
            </div>

            <input
              type={method === 'email' ? 'email' : 'tel'}
              placeholder={method === 'phone' ? '(XX) XXXXX-XXXX' : 'seu@email.com'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={styles.input}
            />

            <button
              onClick={handleSendCode}
              disabled={loading}
              style={{ ...styles.primaryBtn, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '⏳ Enviando...' : '📨 Enviar Código'}
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <p style={styles.desc}>
              Digite o código de 6 dígitos enviado para {method === 'phone' ? 'seu telefone' : 'seu e-mail'}.
            </p>

            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ ...styles.input, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
            />

            <button
              onClick={handleVerifyCode}
              disabled={loading || code.length < 4}
              style={{ ...styles.primaryBtn, opacity: loading || code.length < 4 ? 0.6 : 1 }}
            >
              {loading ? '⏳ Verificando...' : '✅ Verificar Código'}
            </button>

            <button onClick={() => setStep('identify')} style={styles.linkBtn}>
              ← Voltar e tentar outro contato
            </button>
          </>
        )}

        {step === 'reset' && (
          <>
            <p style={styles.desc}>
              Defina seu novo método de acesso.
            </p>

            <label style={styles.label}>Novo Telefone</label>
            <input
              type="tel"
              placeholder="(XX) XXXXX-XXXX"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>Novo E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              style={styles.input}
            />

            <p style={styles.hint}>Preencha ao menos um dos campos acima.</p>

            <button
              onClick={handleReset}
              disabled={loading || (!newPhone && !newEmail)}
              style={{ ...styles.primaryBtn, opacity: loading || (!newPhone && !newEmail) ? 0.6 : 1 }}
            >
              {loading ? '⏳ Salvando...' : '💾 Salvar e Ir para Login'}
            </button>
          </>
        )}

        <button onClick={() => navigate('/login')} style={styles.backBtn}>
          ← Voltar ao Login
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
    padding: '16px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 4px',
    textAlign: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
    textAlign: 'center',
  },
  desc: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: 0,
  },
  toggleRow: {
    display: 'flex',
    gap: '8px',
  },
  toggleBtn: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    color: '#1f2937',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
    textAlign: 'center',
  },
  primaryBtn: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 700,
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    width: '100%',
  },
  linkBtn: {
    padding: '8px',
    fontSize: '13px',
    color: '#6366f1',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    textAlign: 'center',
  },
  backBtn: {
    padding: '10px',
    fontSize: '13px',
    color: '#6b7280',
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
  },
};
