import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: any) => void;
          renderButton: (el: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // Initialize Google One Tap / Sign-In
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response: any) => {
        setLoading(true);
        try {
          await loginWithGoogle(response.credential);
          navigate('/dashboard');
        } catch (err: any) {
          setError('Falha no login com Google. Tente novamente.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      auto_select: false,
    });

    // Render button
    const btnEl = document.getElementById('googleSignInBtn');
    if (btnEl) {
      window.google.accounts.id.renderButton(btnEl, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
      });
    }
  }, [loginWithGoogle, navigate]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Digite um número de telefone válido (com DDD).');
      return;
    }
    navigate(`/login/otp?phone=${cleaned}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>IworkG</h1>
        <p style={styles.subtitle}>Encontre o profissional certo para o seu serviço</p>

        {error && <div style={styles.error}>{error}</div>}

        {/* Google Sign-In */}
        <div style={styles.section}>
          <div id="googleSignInBtn" style={styles.googleBtn}></div>
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerText}>ou</span>
        </div>

        {/* Phone OTP */}
        <form onSubmit={handlePhoneSubmit} style={styles.form}>
          <label style={styles.label}>Entrar com telefone</label>
          <input
            type="tel"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Carregando...' : 'Receber código SMS'}
          </button>
        </form>

        <div style={styles.forgotRow}>
          <a href="/recuperar" style={styles.forgotLink}>🔐 Esqueci meu acesso</a>
        </div>
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
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 32px 0',
  },
  section: {
    marginBottom: '16px',
  },
  googleBtn: {
    display: 'flex',
    justifyContent: 'center',
    minHeight: '44px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    color: '#999',
    fontSize: '13px',
    position: 'relative',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    textAlign: 'left' as const,
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
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
    transition: 'opacity 0.2s',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  forgotRow: {
    marginTop: '20px',
    textAlign: 'center',
  },
  forgotLink: {
    color: '#6366f1',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
  },
};
