import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/admin';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'reports' | 'bans'>('reports');
  const [reports, setReports] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionJustification, setActionJustification] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    navigate('/buscar', { replace: true });
  }

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminService.getReports(),
      adminService.getBans(),
    ])
      .then(([reportsData, bansData]) => {
        setReports(reportsData);
        setBans(bansData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleResolve = async (reportId: string, action: string) => {
    if (action !== 'dismiss' && !actionJustification.trim()) {
      alert('Informe uma justificativa.');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.resolveReport(reportId, { action, justification: actionJustification });
      showMessage('Denúncia resolvida com sucesso!', 'success');
      setSelectedReport(null);
      setActionJustification('');
      loadData();
    } catch (err: any) {
      showMessage(err?.response?.data?.error || 'Erro ao resolver denúncia.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async (userId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Informe o motivo do banimento.');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.banUser(userId, reason);
      showMessage('Usuário banido!', 'success');
      setSelectedReport(null);
      loadData();
    } catch (err: any) {
      showMessage(err?.response?.data?.error || 'Erro ao banir.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await adminService.unbanUser(userId);
      showMessage('Usuário desbanido!', 'success');
      loadData();
    } catch (err: any) {
      showMessage(err?.response?.data?.error || 'Erro ao desbanir.', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status !== 'pending');

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG Admin</h1>
        <div style={styles.headerRight}>
          <span style={styles.adminName}>{user.name}</span>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            Dashboard
          </button>
        </div>
      </header>

      {message && (
        <div style={{
          ...styles.messageBar,
          backgroundColor: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
          color: messageType === 'success' ? '#16a34a' : '#dc2626',
        }}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('reports')}
          style={{ ...styles.tab, ...(activeTab === 'reports' ? styles.tabActive : {}) }}
        >
          Denúncias {pendingReports.length > 0 && `(${pendingReports.length})`}
        </button>
        <button
          onClick={() => setActiveTab('bans')}
          style={{ ...styles.tab, ...(activeTab === 'bans' ? styles.tabActive : {}) }}
        >
          Banimentos ({bans.length})
        </button>
      </div>

      <main style={styles.main}>
        {loading ? (
          <p style={styles.loading}>Carregando...</p>
        ) : activeTab === 'reports' ? (
          <>
            {pendingReports.length > 0 && (
              <>
                <h3 style={styles.sectionTitle}>Pendentes</h3>
                {pendingReports.map(r => <ReportCard key={r.id} report={r} onSelect={setSelectedReport} />)}
              </>
            )}
            {resolvedReports.length > 0 && (
              <>
                <h3 style={styles.sectionTitle}>Resolvidas</h3>
                {resolvedReports.map(r => <ReportCard key={r.id} report={r} onSelect={setSelectedReport} />)}
              </>
            )}
            {reports.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>✅</span>
                <p>Nenhuma denúncia registrada.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {bans.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>🔒</span>
                <p>Nenhum banimento registrado.</p>
              </div>
            ) : (
              <div style={styles.banList}>
                {bans.map(b => (
                  <div key={b.id} style={styles.banCard}>
                    <div style={styles.banInfo}>
                      <strong>{b.user_name}</strong>
                      <span style={styles.banReason}>{b.reason}</span>
                      <span style={styles.banMeta}>
                        Banido por {b.admin_name} em {formatDate(b.created_at)}
                      </span>
                    </div>
                    <div style={styles.banActions}>
                      <span style={{
                        ...styles.banStatus,
                        color: b.revoked ? '#6b7280' : '#dc2626',
                        backgroundColor: b.revoked ? '#f3f4f6' : '#fef2f2',
                      }}>
                        {b.revoked ? 'Desbanido' : 'Ativo'}
                      </span>
                      {!b.revoked && (
                        <button onClick={() => handleUnban(b.user_id)} style={styles.unbanBtn}>
                          Desbanir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div style={styles.modalOverlay} onClick={() => setSelectedReport(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Detalhes da Denúncia</h3>
            <div style={styles.modalBody}>
              <p><strong>Motivo:</strong> {selectedReport.reason}</p>
              <p><strong>Tipo:</strong> {selectedReport.target_type}</p>
              <p><strong>Denunciante:</strong> {selectedReport.reporter_name}</p>
              <p><strong>Data:</strong> {formatDate(selectedReport.created_at)}</p>
              {selectedReport.description && (
                <p><strong>Descrição:</strong> {selectedReport.description}</p>
              )}
            </div>

            {selectedReport.status === 'pending' && (
              <>
                <textarea
                  placeholder="Justificativa (obrigatória)"
                  value={actionJustification}
                  onChange={e => setActionJustification(e.target.value)}
                  style={styles.justificationInput}
                  rows={3}
                />
                <div style={styles.modalActions}>
                  {selectedReport.target_type === 'portfolio_photo' && (
                    <button
                      onClick={() => handleResolve(selectedReport.id, 'remove_photo')}
                      disabled={actionLoading}
                      style={styles.actionBtnDanger}
                    >
                      Remover Foto
                    </button>
                  )}
                  {selectedReport.target_type === 'review' && (
                    <button
                      onClick={() => handleResolve(selectedReport.id, 'remove_review')}
                      disabled={actionLoading}
                      style={styles.actionBtnDanger}
                    >
                      Remover Avaliação
                    </button>
                  )}
                  {selectedReport.target_type === 'user' && (
                    <button
                      onClick={() => handleBan(selectedReport.target_id, selectedReport.reason)}
                      disabled={actionLoading}
                      style={styles.actionBtnDanger}
                    >
                      Banir Usuário
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(selectedReport.id, 'dismiss')}
                    disabled={actionLoading}
                    style={styles.actionBtnSecondary}
                  >
                    Descartar
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    style={styles.actionBtnCancel}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, onSelect }: { report: any; onSelect: (r: any) => void }) {
  return (
    <div style={reportCardStyles.card} onClick={() => onSelect(report)}>
      <div style={reportCardStyles.top}>
        <span style={{
          ...reportCardStyles.badge,
          backgroundColor: report.status === 'pending' ? '#fef3c7' : '#f0fdf4',
          color: report.status === 'pending' ? '#d97706' : '#16a34a',
        }}>
          {report.status === 'pending' ? 'Pendente' : 'Resolvida'}
        </span>
        <span style={reportCardStyles.type}>{report.target_type}</span>
      </div>
      <p style={reportCardStyles.reason}>{report.reason}</p>
      <div style={reportCardStyles.meta}>
        <span>Por: {report.reporter_name}</span>
        <span>{new Date(report.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  );
}

const reportCardStyles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#fff', borderRadius: '10px', padding: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer',
    border: '1px solid #f0f0f0',
  },
  top: { display: 'flex', gap: '8px', marginBottom: '8px' },
  badge: { padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 },
  type: { fontSize: '12px', color: '#888', alignSelf: 'center' },
  reason: { fontSize: '14px', fontWeight: 500, color: '#1a1a2e', margin: '0 0 8px 0' },
  meta: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' },
};

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff',
  },
  logo: { fontSize: '20px', fontWeight: 700, margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  adminName: { fontSize: '14px', fontWeight: 500 },
  backBtn: {
    padding: '6px 14px', fontSize: '13px',
    backgroundColor: 'transparent', color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: 'pointer',
  },
  messageBar: {
    padding: '10px 24px', fontSize: '14px', fontWeight: 500, textAlign: 'center',
  },
  tabs: {
    display: 'flex', backgroundColor: '#fff', borderBottom: '2px solid #e5e5e5',
  },
  tab: {
    flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600,
    border: 'none', backgroundColor: '#fff', color: '#666', cursor: 'pointer',
    borderBottom: '3px solid transparent',
  },
  tabActive: {
    color: '#1a1a2e', borderBottomColor: '#1a1a2e',
  },
  main: {
    maxWidth: '800px', margin: '24px auto', padding: '0 24px',
  },
  loading: { textAlign: 'center', color: '#888', padding: '48px 0' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, color: '#1a1a2e', marginBottom: '12px', marginTop: '20px' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: '#666' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },

  // Bans
  banList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  banCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: '10px', padding: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  banInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  banReason: { fontSize: '13px', color: '#666' },
  banMeta: { fontSize: '12px', color: '#999' },
  banActions: { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' },
  banStatus: { padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 },
  unbanBtn: {
    padding: '6px 14px', fontSize: '13px', backgroundColor: '#f0fdf4',
    color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer',
  },

  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
    maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  modalTitle: { fontSize: '18px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px 0' },
  modalBody: {
    display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#444',
    marginBottom: '16px',
  },
  justificationInput: {
    width: '100%', padding: '12px', fontSize: '14px',
    border: '2px solid #e0e0e0', borderRadius: '10px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', marginBottom: '12px',
  },
  modalActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  actionBtnDanger: {
    padding: '10px 16px', fontSize: '13px', fontWeight: 600,
    backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
    borderRadius: '8px', cursor: 'pointer',
  },
  actionBtnSecondary: {
    padding: '10px 16px', fontSize: '13px', fontWeight: 600,
    backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
    borderRadius: '8px', cursor: 'pointer',
  },
  actionBtnCancel: {
    padding: '10px 16px', fontSize: '13px', fontWeight: 600,
    backgroundColor: '#f3f4f6', color: '#444', border: '1px solid #e5e5e5',
    borderRadius: '8px', cursor: 'pointer',
  },
};
