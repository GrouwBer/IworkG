import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { notificationService } from '../services/notifications';
import Toast from '../components/Toast';
import Header from '../components/Header';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetch = () => notificationService.getNotifications()
      .then(data => setUnreadCount(data.unreadCount))
      .catch(() => {});
    fetch();
    const interval = setInterval(fetch, 30000); // poll a cada 30s
    return () => clearInterval(interval);
  }, []);

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'EXCLUIR') return;
    setDeleting(true);
    try {
      await api.delete('/api/auth/account', { data: { confirm: true } });
      setToast({ message: '✅ Conta excluída com sucesso.', type: 'success' });
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || 'Erro ao excluir conta.', type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
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

      <Header />

      <div style={styles.quickActions}>
        <button onClick={() => navigate('/buscar')} style={styles.quickBtn}>
          🔍 Buscar Prestadores
        </button>
        {user?.role === 'provider' && (
          <button onClick={() => navigate('/mural')} style={{ ...styles.quickBtn, backgroundColor: '#2563eb' }}>
            📋 Mural de Pedidos
          </button>
        )}
        <button onClick={() => navigate('/meus-pedidos')} style={styles.quickBtn}>
          📝 Meus Pedidos
        </button>
        <button onClick={() => navigate('/notificacoes')} style={{ ...styles.quickBtn, position: 'relative' as const }}>
          🔔 Notificações
          {unreadCount > 0 && <span style={styles.bellBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
      </div>

      <main style={styles.main}>
        <h2>Bem-vindo, {user?.name}!</h2>
        <p style={styles.role}>
          Perfil: <strong>{user?.role === 'client' ? 'Cliente' : user?.role === 'provider' ? 'Prestador' : 'Admin'}</strong>
        </p>
        <p style={styles.info}>
          {user?.email && <>Email: {user.email}<br /></>}
          {user?.phone && <>Telefone: {user.phone}</>}
        </p>

        <div style={styles.navGrid}>
          <button onClick={() => navigate('/buscar')} style={styles.navCard}>
            <span style={{ fontSize: 24 }}>🔍</span>
            <strong>Buscar</strong>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Encontre prestadores</span>
          </button>
          <button onClick={() => navigate('/favoritos')} style={styles.navCard}>
            <span style={{ fontSize: 24 }}>⭐</span>
            <strong>Favoritos</strong>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Seus prestadores salvos</span>
          </button>
          <button onClick={() => navigate('/contatos')} style={styles.navCard}>
            <span style={{ fontSize: 24 }}>💬</span>
            <strong>Contatos</strong>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Histórico de conversas</span>
          </button>
          <button onClick={() => navigate('/meus-pedidos')} style={styles.navCard}>
            <span style={{ fontSize: 24 }}>📋</span>
            <strong>Meus Pedidos</strong>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Pedidos que você criou</span>
          </button>
        </div>

        {user?.role === 'provider' && (
          <div style={styles.ctaBox}>
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Painel do Prestador</p>
            <button onClick={() => navigate('/prestador/meu-perfil')} style={{ ...styles.ctaBtn, backgroundColor: '#1a1a2e' }}>
              👤 Meu Perfil
            </button>
            <button onClick={() => navigate('/mural')} style={{ ...styles.ctaBtn, backgroundColor: '#2563eb', marginTop: 8 }}>
              📋 Mural de Pedidos
            </button>
          </div>
        )}

        {user?.role === 'client' && (
          <div style={styles.ctaBox}>
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Quer trabalhar na plataforma?</p>
            <button onClick={() => navigate('/register/provider')} style={styles.ctaBtn}>
              🛠️ Tornar-se Prestador
            </button>
          </div>
        )}

        {user?.role === 'admin' && (
          <div style={styles.ctaBox}>
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Painel Administrativo</p>
            <button onClick={() => navigate('/admin')} style={styles.ctaBtn}>
              ⚙️ Ir para Admin
            </button>
          </div>
        )}

        {/* Configurações da Conta */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>⚙️ Configurações da Conta</h3>

          <button
            onClick={() => setShowDeleteModal(true)}
            style={styles.deleteBtn}
          >
            🗑️ Excluir Conta
          </button>
        </div>
      </main>

      {/* Deletion Modal (RF004 / LGPD) */}
      {showDeleteModal && (
        <div style={styles.overlay} onClick={() => setShowDeleteModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>⚠️ Excluir Conta</h3>
            <p style={styles.modalText}>
              <strong>Tem certeza? Esta ação é irreversível.</strong>
            </p>
            <p style={styles.modalText}>
              Seus dados pessoais serão removidos permanentemente. Avaliações que você
              fez serão mantidas anonimizadas para não prejudicar a reputação dos prestadores.
            </p>
            <p style={styles.modalText}>
              Digite <strong>EXCLUIR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="EXCLUIR"
              style={styles.modalInput}
            />
            <div style={styles.modalActions}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                style={styles.cancelBtn}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'EXCLUIR' || deleting}
                style={{
                  ...styles.confirmDeleteBtn,
                  opacity: deleteConfirm !== 'EXCLUIR' || deleting ? 0.5 : 1,
                }}
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir Minha Conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
  },
  bellBadge: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-6px',
    minWidth: '16px',
    height: '16px',
    borderRadius: '8px',
    backgroundColor: '#dc2626',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    lineHeight: 1,
  },
  quickActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    padding: '16px',
    maxWidth: '800px',
    margin: '0 auto',
    flexWrap: 'wrap' as const,
  },
  quickBtn: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 600,
    backgroundColor: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
  info: { fontSize: '14px', color: '#777', marginBottom: '24px' },
  navGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '24px',
  },
  navCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '16px 12px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13px',
    textAlign: 'center' as const,
    transition: 'all 0.15s',
  },
  ctaBox: {
    padding: '20px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    border: '2px solid #bfdbfe',
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  ctaBtn: {
    padding: '12px 32px',
    fontSize: '15px',
    fontWeight: 600,
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  placeholder: {
    padding: '24px',
    backgroundColor: '#f0f9ff',
    borderRadius: '12px',
    border: '1px solid #bae6fd',
    fontSize: '14px',
    color: '#0369a1',
    marginBottom: '24px',
  },
  section: {
    padding: '20px',
    backgroundColor: '#fafafa',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
    margin: '0 0 16px',
  },
  deleteBtn: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  // Modal styles
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
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#dc2626',
    margin: 0,
    textAlign: 'center',
  },
  modalText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.5',
    margin: 0,
    textAlign: 'center',
  },
  modalInput: {
    padding: '12px 16px',
    fontSize: '18px',
    fontWeight: 700,
    border: '2px solid #fecaca',
    borderRadius: '10px',
    outline: 'none',
    textAlign: 'center',
    letterSpacing: '4px',
    textTransform: 'uppercase',
    color: '#1f2937',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  confirmDeleteBtn: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    fontWeight: 700,
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
};
