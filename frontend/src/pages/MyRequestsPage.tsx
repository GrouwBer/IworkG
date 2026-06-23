import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestService, type ServiceRequest } from '../services/requests';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: 'Aberto', color: '#16a34a' },
  in_progress: { label: 'Em Andamento', color: '#2563eb' },
  completed: { label: 'Concluído', color: '#6b7280' },
  cancelled: { label: 'Cancelado', color: '#dc2626' },
};

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: '#16a34a' },
  medium: { label: 'Média', color: '#ca8a04' },
  high: { label: 'Alta', color: '#dc2626' },
};

export default function MyRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = () => {
    setLoading(true);
    requestService.getMyRequests()
      .then((data) => setRequests(data.requests))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await requestService.updateRequest(id, { status: 'cancelled' });
      loadRequests();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao cancelar pedido.');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG</h1>
        <span style={styles.greeting}>Meus Pedidos</span>
      </header>

      <main style={styles.main}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitle}>Meus Pedidos</h2>
          <button onClick={() => navigate('/publicar')} style={styles.newBtn}>
            + Novo Pedido
          </button>
        </div>

        {loading ? (
          <p style={styles.loading}>Carregando...</p>
        ) : requests.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📋</span>
            <p>Você ainda não publicou nenhum pedido.</p>
            <button onClick={() => navigate('/publicar')} style={styles.emptyBtn}>
              Publicar Pedido
            </button>
          </div>
        ) : (
          <div style={styles.list}>
            {requests.map((req) => {
              const statusInfo = STATUS_LABELS[req.status] || { label: req.status, color: '#666' };
              const urgencyInfo = URGENCY_LABELS[req.urgency] || { label: req.urgency, color: '#666' };
              return (
                <div
                  key={req.id}
                  style={styles.card}
                  onClick={() => navigate(`/pedido/${req.id}`)}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.cardLeft}>
                      <h3 style={styles.cardTitle}>{req.title}</h3>
                      <div style={styles.cardMeta}>
                        {req.category && (
                          <span style={styles.categoryTag}>
                            {req.category.icon} {req.category.name}
                          </span>
                        )}
                        <span style={{
                          ...styles.badge,
                          backgroundColor: statusInfo.color + '20',
                          color: statusInfo.color,
                        }}>
                          {statusInfo.label}
                        </span>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: urgencyInfo.color + '20',
                          color: urgencyInfo.color,
                        }}>
                          {urgencyInfo.label}
                        </span>
                      </div>
                    </div>
                    <div style={styles.cardRight}>
                      <span style={styles.date}>{formatDate(req.createdAt || req.created_at)}</span>
                      <span style={styles.interestCount}>
                        👥 {req.interestCount || req.interest_count || 0}
                      </span>
                    </div>
                  </div>

                  {req.description && (
                    <p style={styles.cardDesc}>{req.description}</p>
                  )}

                  {req.status === 'open' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(req.id);
                      }}
                      style={styles.cancelBtn}
                    >
                      Cancelar Pedido
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff',
  },
  logo: { fontSize: '20px', fontWeight: 700, margin: 0 },
  greeting: { fontSize: '14px', opacity: 0.9 },
  main: { maxWidth: '700px', margin: '24px auto', padding: '0 24px' },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px',
  },
  pageTitle: { fontSize: '22px', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  newBtn: {
    padding: '10px 20px', backgroundColor: '#1a1a2e', color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
  loading: { textAlign: 'center', color: '#888', padding: '48px 0' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: '#666' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
  emptyBtn: {
    marginTop: '16px', padding: '12px 24px', backgroundColor: '#1a1a2e',
    color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', gap: '12px' },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 8px 0' },
  cardMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  categoryTag: { fontSize: '13px', color: '#666' },
  badge: {
    padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
  },
  cardRight: { textAlign: 'right', whiteSpace: 'nowrap' },
  date: { display: 'block', fontSize: '12px', color: '#999' },
  interestCount: { display: 'block', fontSize: '13px', color: '#888', marginTop: '4px' },
  cardDesc: {
    fontSize: '13px', color: '#666', lineHeight: 1.5, margin: '12px 0 0 0',
  },
  cancelBtn: {
    marginTop: '12px', padding: '6px 16px', fontSize: '13px',
    backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
    borderRadius: '8px', cursor: 'pointer', fontWeight: 500,
  },
};
