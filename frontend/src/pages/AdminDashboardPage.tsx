import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService, type AdminStats } from '../services/admin';

const PERIODS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadStats(period);
  }, [period]);

  const loadStats = (days: number) => {
    setLoading(true);
    setError('');
    adminService.getStats(days)
      .then(setStats)
      .catch(err => setError(err.response?.data?.error || 'Erro ao carregar estatísticas.'))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return <div style={styles.center}><p>Carregando dashboard...</p></div>;
  }

  if (error) {
    return <div style={styles.center}><p style={{ color: '#991b1b' }}>{error}</p></div>;
  }

  if (!stats) return null;

  const maxContacts = Math.max(1, ...stats.contactsByDay.map(d => d.count));

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Dashboard</button>
        <h1 style={styles.logo}>Painel Admin</h1>
        <button onClick={() => navigate('/admin/categorias')} style={styles.navBtn}>📋 Categorias</button>
      </header>

      <main style={styles.main}>
        {/* Period selector */}
        <div style={styles.periodBar}>
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              style={{ ...styles.periodBtn, ...(period === p.days ? styles.periodBtnActive : {}) }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Metric cards */}
        <div style={styles.cardGrid}>
          <div style={styles.card}><span style={styles.cardLabel}>Clientes</span><span style={styles.cardValue}>{stats.totalClients}</span></div>
          <div style={styles.card}><span style={styles.cardLabel}>Prestadores</span><span style={styles.cardValue}>{stats.totalProviders}</span></div>
          <div style={styles.card}><span style={styles.cardLabel}>Pedidos</span><span style={styles.cardValue}>{stats.totalRequests}</span></div>
          <div style={styles.card}><span style={styles.cardLabel}>Contatos</span><span style={styles.cardValue}>{stats.totalContacts}</span></div>
        </div>

        {/* Conversion rate */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Taxa de Conversão</h3>
          <div style={styles.conversionBar}>
            <div style={styles.conversionInfo}>
              <span>{stats.conversionRate.withInterest} de {stats.conversionRate.total} pedidos com interessados</span>
              <strong style={{ color: '#16a34a', fontSize: '24px' }}>{stats.conversionRate.rate}%</strong>
            </div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${stats.conversionRate.rate}%` }} />
            </div>
          </div>
        </div>

        {/* Contacts by day chart */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Contatos por Dia</h3>
          {stats.contactsByDay.length === 0 ? (
            <p style={styles.empty}>Nenhum contato no período.</p>
          ) : (
            <div style={styles.chart}>
              {stats.contactsByDay.map(d => (
                <div key={d.date} style={styles.barCol}>
                  <span style={styles.barValue}>{d.count}</span>
                  <div style={{ ...styles.bar, height: `${Math.max(4, (d.count / maxContacts) * 120)}px` }} />
                  <span style={styles.barLabel}>{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top categories chart */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Categorias Mais Buscadas</h3>
          {stats.topCategories.length === 0 ? (
            <p style={styles.empty}>Nenhum dado no período.</p>
          ) : (
            <div style={styles.catList}>
              {stats.topCategories.map((cat, i) => (
                <div key={cat.name} style={styles.catRow}>
                  <span style={styles.catRank}>#{i + 1}</span>
                  <span style={styles.catIcon}>{cat.icon}</span>
                  <span style={styles.catName}>{cat.name}</span>
                  <span style={styles.catCount}>{cat.count} pedidos</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff' },
  logo: { fontSize: '18px', fontWeight: 700, margin: 0 },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  navBtn: { padding: '8px 18px', fontSize: '14px', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  center: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui', gap: '16px' },
  main: { maxWidth: '900px', margin: '24px auto', padding: '0 24px' },
  periodBar: { display: 'flex', gap: '8px', marginBottom: '20px' },
  periodBtn: { padding: '8px 20px', fontSize: '13px', fontWeight: 600, backgroundColor: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' },
  periodBtnActive: { backgroundColor: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' },
  cardLabel: { fontSize: '12px', color: '#888', fontWeight: 500, textTransform: 'uppercase' },
  cardValue: { fontSize: '28px', fontWeight: 700, color: '#1a1a2e' },
  section: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px 0' },
  empty: { textAlign: 'center', color: '#999', padding: '24px 0', fontSize: '14px' },
  conversionBar: { padding: '8px 0' },
  conversionInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px', color: '#666' },
  progressTrack: { height: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: '6px', transition: 'width 0.5s ease' },
  chart: { display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', paddingTop: '20px', overflowX: 'auto' },
  barCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '32px', flex: 1 },
  barValue: { fontSize: '10px', color: '#888', fontWeight: 600 },
  bar: { width: '100%', maxWidth: '40px', backgroundColor: '#3b82f6', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s ease' },
  barLabel: { fontSize: '9px', color: '#aaa', transform: 'rotate(-45deg)', marginTop: '4px', whiteSpace: 'nowrap' },
  catList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  catRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  catRank: { fontSize: '12px', fontWeight: 700, color: '#888', width: '24px' },
  catIcon: { fontSize: '18px' },
  catName: { flex: 1, fontSize: '14px', fontWeight: 500, color: '#333' },
  catCount: { fontSize: '13px', color: '#888' },
};
