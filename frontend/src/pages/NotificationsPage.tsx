import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, type NotificationItem } from '../services/notifications';

const TYPE_ICONS: Record<string, string> = {
  new_request: '📋',
  interest: '👋',
  review: '⭐',
  promotion: '🎉',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    notificationService.getNotifications()
      .then(data => setNotifications(data.notifications))
      .catch(err => setError(err.response?.data?.error || 'Erro ao carregar.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <C m="Carregando notificações..." />;
  if (error) return <C m={<><p style={{ color: '#dc2626' }}>{error}</p><button onClick={() => navigate(-1)} style={s.back}>Voltar</button></>} />;

  return (
    <div style={s.container}>
      <header style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>← Voltar</button>
        <h1 style={s.logo}>IworkG</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={s.markAllBtn}>
              ✓ Marcar todas lidas
            </button>
          )}
          <button onClick={() => navigate('/preferencias')} style={s.prefsBtn}>⚙️</button>
        </div>
      </header>

      <main style={s.main}>
        <h2 style={s.title}>🔔 Notificações {unreadCount > 0 && <span style={s.badge}>{unreadCount}</span>}</h2>

        {notifications.length === 0 ? (
          <div style={s.empty}>
            <span style={{ fontSize: 40 }}>🔕</span>
            <p>Nenhuma notificação ainda.</p>
          </div>
        ) : (
          <div style={s.list}>
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                style={{ ...s.item, ...(!n.read ? s.unread : {}) }}
              >
                <div style={s.itemLeft}>
                  <span style={s.itemIcon}>{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div style={s.itemContent}>
                    <p style={s.itemTitle}>{n.title}</p>
                    {n.body && <p style={s.itemBody}>{n.body}</p>}
                    <span style={s.itemDate}>{new Date(n.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                {!n.read && <span style={s.dot} />}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function C({ m }: { m: any }) {
  return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5', fontFamily: 'system-ui', gap: 16, textAlign: 'center', padding: 24 }}>
    <div style={{ background: '#fff', padding: 48, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>{m}</div>
  </div>;
}

const s: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff' },
  logo: { fontSize: 18, fontWeight: 700, margin: 0 },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  back: { padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  markAllBtn: { padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' },
  prefsBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' },
  main: { maxWidth: 650, margin: '24px auto', padding: '0 24px' },
  title: { fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 },
  badge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 24, height: 24, borderRadius: 12, background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, padding: '0 6px' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#fff', borderRadius: 12, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.04)', transition: 'background 0.15s' },
  unread: { background: '#f0f7ff', borderLeft: '3px solid #2563eb' },
  itemLeft: { display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 },
  itemIcon: { fontSize: 22, flexShrink: 0, marginTop: 2 },
  itemContent: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14, fontWeight: 600, color: '#1f2937', margin: '0 0 4px' },
  itemBody: { fontSize: 13, color: '#6b7280', margin: '0 0 6px', lineHeight: 1.4 },
  itemDate: { fontSize: 11, color: '#9ca3af' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#2563eb', flexShrink: 0 },
  empty: { textAlign: 'center', padding: '60px 0', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' },
};
