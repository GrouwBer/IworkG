import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestService, type InterestedProvider, type ServiceRequest } from '../services/requests';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [interests, setInterests] = useState<InterestedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [sending, setSending] = useState(false);

  const isProvider = user?.role === 'provider';
  const isClient = user?.role === 'client';
  const isOwner = request && user?.id === request.client?.id;

  useEffect(() => {
    if (!id) return;
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await requestService.getInterests(id!);
      setRequest(data.request);
      setInterests(data.interests);
      // Check if current user already expressed interest
      if (data.interests.some(i => i.provider.id === user?.id)) {
        setInterestSent(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterest = async () => {
    setSending(true);
    setError('');
    try {
      await requestService.expressInterest(id!);
      setInterestSent(true);
      setShowConfirm(false);
      loadRequest(); // Refresh interests list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao demonstrar interesse.');
      setShowConfirm(false);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div style={styles.center}><p>Carregando pedido...</p></div>;
  }

  if (error && !request) {
    return (
      <div style={styles.center}>
        <p style={{ color: '#991b1b' }}>{error}</p>
        <button onClick={() => navigate('/buscar')} style={styles.backBtn}>Voltar</button>
      </div>
    );
  }

  if (!request) {
    return <div style={styles.center}><p>Pedido não encontrado.</p></div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Voltar</button>
        <h1 style={styles.logo}>IworkG</h1>
        <span />
      </header>

      <main style={styles.main}>
        {/* Request details */}
        <div style={styles.card}>
          <h2 style={styles.title}>{request.title}</h2>
          {request.description && <p style={styles.description}>{request.description}</p>}
          <div style={styles.meta}>
            <span>📍 {request.city || 'Local não informado'}{request.state ? `, ${request.state}` : ''}</span>
            <span style={styles.status}>Status: {request.status === 'open' ? '🟢 Aberto' : request.status}</span>
          </div>

          {/* Provider: Interest button */}
          {isProvider && request.status === 'open' && (
            <div style={styles.actionArea}>
              {interestSent ? (
                <div style={styles.successBadge}>✅ Interesse registrado!</div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  style={styles.interestBtn}
                  disabled={sending}
                >
                  Tenho Interesse
                </button>
              )}
            </div>
          )}
        </div>

        {/* Client: Interested providers list */}
        {(isClient || isOwner) && interests.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              Prestadores Interessados ({interests.length})
            </h3>
            <div style={styles.providerList}>
              {interests.map((item) => (
                <div key={item.interestId} style={styles.providerCard}>
                  <div style={styles.providerAvatar}>
                    {item.provider.avatarUrl ? (
                      <img src={item.provider.avatarUrl} alt="" style={styles.avatarImg} />
                    ) : (
                      <span style={styles.avatarPlaceholder}>
                        {item.provider.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={styles.providerInfo}>
                    <strong style={styles.providerName}>{item.provider.name}</strong>
                    {item.provider.category && (
                      <span style={styles.providerCategory}>
                        {item.provider.category.icon} {item.provider.category.name}
                      </span>
                    )}
                    {item.provider.rating > 0 && (
                      <span style={styles.providerRating}>
                        ⭐ {item.provider.rating.toFixed(1)} ({item.provider.reviewCount} avaliações)
                      </span>
                    )}
                    {item.provider.city && (
                      <span style={styles.providerLocation}>
                        📍 {item.provider.city}, {item.provider.state}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/prestador/${item.provider.id}`)}
                    style={styles.viewProfileBtn}
                  >
                    Ver Perfil
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isClient && interests.length === 0 && request.status === 'open' && (
          <p style={styles.emptyText}>Nenhum prestador demonstrou interesse ainda.</p>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Demonstrar Interesse</h3>
            <p>Deseja demonstrar interesse neste serviço?</p>
            <p style={styles.modalHint}>O cliente será notificado e poderá entrar em contato.</p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowConfirm(false)} style={styles.cancelBtn}>
                Cancelar
              </button>
              <button onClick={handleInterest} style={styles.confirmBtn} disabled={sending}>
                {sending ? 'Enviando...' : 'Sim, tenho interesse!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div style={styles.errorToast}>{error}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff' },
  logo: { fontSize: '18px', fontWeight: 700, margin: 0 },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  main: { maxWidth: '700px', margin: '24px auto', padding: '0 24px' },
  center: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui', gap: '16px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' },
  title: { fontSize: '22px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 12px 0' },
  description: { fontSize: '15px', color: '#555', lineHeight: 1.6, margin: '0 0 16px 0' },
  meta: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888', marginBottom: '16px' },
  status: { fontWeight: 600 },
  actionArea: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' },
  interestBtn: { width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600, backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' },
  successBadge: { textAlign: 'center', padding: '14px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '10px', fontSize: '16px', fontWeight: 600 },
  section: { marginTop: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px 0' },
  providerList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  providerCard: { display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
  providerAvatar: { width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0e0e0', color: '#666', fontSize: '20px', fontWeight: 600 },
  providerInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  providerName: { fontSize: '15px', color: '#1a1a2e' },
  providerCategory: { fontSize: '13px', color: '#666' },
  providerRating: { fontSize: '12px', color: '#f59e0b' },
  providerLocation: { fontSize: '12px', color: '#888' },
  viewProfileBtn: { padding: '8px 14px', fontSize: '13px', backgroundColor: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' },
  emptyText: { textAlign: 'center', color: '#888', padding: '32px 0' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%', textAlign: 'center' },
  modalHint: { fontSize: '13px', color: '#888', marginTop: '8px' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '24px' },
  cancelBtn: { flex: 1, padding: '12px', fontSize: '14px', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600, backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  errorToast: { position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', zIndex: 200 },
};
