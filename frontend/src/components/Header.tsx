import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  showBack?: boolean;
  backTo?: string;
  title?: string;
}

export default function Header({ showBack, backTo }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        {showBack && (
          <button onClick={handleBack} style={styles.backBtn}>
            ← Voltar
          </button>
        )}
        <h1
          style={{ ...styles.logo, cursor: 'pointer' }}
          onClick={() => navigate(user ? '/dashboard' : '/buscar')}
        >
          IworkG
        </h1>
      </div>

      {user && (
        <div style={styles.right}>
          <span style={styles.greeting}>Olá, {user.name?.split(' ')[0]}</span>
          <button onClick={() => navigate('/dashboard')} style={styles.profileBtn}>
            PERFIL
          </button>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            style={styles.logoutBtn}
          >
            Sair
          </button>
        </div>
      )}
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 32px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    minHeight: '64px',
    position: 'relative' as const,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minWidth: '100px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '100px',
    justifyContent: 'flex-end',
  },
  backBtn: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 700,
    margin: 0,
    userSelect: 'none' as const,
    position: 'absolute' as const,
    left: '50%',
    transform: 'translateX(-50%)',
  },
  greeting: {
    fontSize: '15px',
    opacity: 0.9,
  },
  profileBtn: {
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: 'transparent',
    color: '#fff',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  logoutBtn: {
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
};
