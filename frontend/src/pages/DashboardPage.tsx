import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
  placeholder: {
    padding: '24px',
    backgroundColor: '#f0f9ff',
    borderRadius: '12px',
    border: '1px solid #bae6fd',
    fontSize: '14px',
    color: '#0369a1',
  },
};
