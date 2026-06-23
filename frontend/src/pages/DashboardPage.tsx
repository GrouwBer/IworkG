import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { providerService } from '../services/provider';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Provider availability state
  const [disponivel, setDisponivel] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);

  // Load provider profile if user is a provider
  useEffect(() => {
    if (user?.role === 'provider') {
      providerService.getMyProfile()
        .then((profile) => setDisponivel(profile.active))
        .catch(() => {
          // Profile may not exist yet — default to available
          setDisponivel(true);
        });
    }
  }, [user]);

  const handleToggle = useCallback(async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const result = await providerService.toggleStatus();
      setDisponivel(result.active);
    } catch {
      // silently fail — keep previous state
    } finally {
      setToggling(false);
    }
  }, [toggling]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG</h1>
        <div style={styles.userInfo}>
          {user?.avatarUrl && (
            <img src={user.avatarUrl} alt="" style={styles.avatar} />
          )}
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <h2>Bem-vindo, {user?.name}!</h2>
        <p style={styles.role}>
          Perfil: <strong>{user?.role === 'client' ? 'Cliente' : user?.role === 'provider' ? 'Prestador' : 'Admin'}</strong>
        </p>
        <p style={styles.info}>
          {user?.email && <>Email: {user.email}<br /></>}
          {user?.phone && <>Telefone: {user.phone}</>}
        </p>

        {/* ── Provider Availability Toggle (RF020) ── */}
        {user?.role === 'provider' && disponivel !== null && (
          <div style={styles.toggleSection}>
            <div style={styles.toggleRow}>
              <div style={styles.toggleInfo}>
                <span style={styles.toggleLabel}>Status de disponibilidade</span>
                <span style={{
                  ...styles.toggleStatus,
                  color: disponivel ? '#16a34a' : '#dc2626',
                }}>
                  {disponivel ? '🟢 Disponível para serviços' : '🔴 Ocupado'}
                </span>
              </div>
              <button
                onClick={handleToggle}
                disabled={toggling}
                style={{
                  ...styles.toggleButton,
                  backgroundColor: disponivel ? '#16a34a' : '#dc2626',
                  opacity: toggling ? 0.7 : 1,
                }}
                aria-label={disponivel ? 'Ficar ocupado' : 'Ficar disponível'}
              >
                <span style={{
                  ...styles.toggleKnob,
                  transform: disponivel ? 'translateX(24px)' : 'translateX(2px)',
                }} />
              </button>
            </div>
            <p style={styles.toggleHint}>
              {disponivel
                ? 'Seu perfil está visível nas buscas. Clique para ficar ocupado.'
                : 'Seu perfil NÃO aparece nas buscas. Clique para ficar disponível.'
              }
            </p>
          </div>
        )}

        <div style={styles.placeholder}>
          <p>🚧 As demais funcionalidades serão implementadas nas próximas issues.</p>
          <p>Sprint 1 — Fundação: Autenticação (✓) | Filtros (#9) | Busca geográfica</p>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
  },
  logo: { fontSize: '20px', fontWeight: 700, margin: 0 },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: { width: '32px', height: '32px', borderRadius: '50%' },
  userName: { fontSize: '14px', fontWeight: 500 },
  logoutBtn: {
    padding: '6px 16px',
    fontSize: '13px',
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '32px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  role: { fontSize: '16px', color: '#555' },
  info: { fontSize: '14px', color: '#777', marginBottom: '32px' },
  toggleSection: {
    padding: '20px 24px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  toggleLabel: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1e293b',
  },
  toggleStatus: {
    fontSize: '13px',
    fontWeight: 500,
  },
  toggleButton: {
    position: 'relative',
    width: '52px',
    height: '28px',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    flexShrink: 0,
  },
  toggleKnob: {
    position: 'absolute',
    top: '2px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s ease',
  },
  toggleHint: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '8px 0 0 0',
  },
  placeholder: {
    padding: '24px',
    backgroundColor: '#f0f9ff',
    borderRadius: '12px',
    border: '1px solid #bae6fd',
    fontSize: '14px',
    color: '#0369a1',
  },
};
