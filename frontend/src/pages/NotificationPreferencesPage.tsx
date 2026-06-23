import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, type NotificationPreferences } from '../services/notifications';

const TOGGLES: { key: keyof NotificationPreferences; label: string; desc: string; icon: string }[] = [
  { key: 'new_requests', label: 'Novos Pedidos', desc: 'Quando novos pedidos aparecem no mural da sua região', icon: '📋' },
  { key: 'interests', label: 'Interesses', desc: 'Quando alguém demonstra interesse no seu pedido', icon: '👋' },
  { key: 'reviews', label: 'Avaliações', desc: 'Quando você recebe uma nova avaliação', icon: '⭐' },
  { key: 'promotions', label: 'Promoções', desc: 'Novidades, dicas e promoções da plataforma', icon: '🎉' },
];

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    notificationService.getPreferences()
      .then(setPrefs)
      .catch(err => setError(err.response?.data?.error || 'Erro ao carregar preferências.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    const newVal = prefs[key] ? 0 : 1;
    setPrefs({ ...prefs, [key]: newVal });
    setSaving(key);
    try {
      await notificationService.updatePreferences({ [key]: newVal });
    } catch {
      setPrefs({ ...prefs, [key]: prefs[key] }); // rollback
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <C m="Carregando..." />;
  if (error || !prefs) return <C m={<><p style={{ color: '#dc2626' }}>{error}</p><button onClick={() => navigate(-1)} style={st.back}>Voltar</button></>} />;

  return (
    <div style={st.container}>
      <header style={st.header}>
        <button onClick={() => navigate(-1)} style={st.backBtn}>← Voltar</button>
        <h1 style={st.logo}>IworkG</h1>
        <span style={{ opacity: 0 }}>.</span>
      </header>

      <main style={st.main}>
        <h2 style={st.title}>⚙️ Preferências de Notificação</h2>
        <p style={st.subtitle}>Escolha quais notificações você quer receber.</p>

        <div style={st.list}>
          {TOGGLES.map(t => (
            <div key={t.key} style={st.row}>
              <div style={st.rowLeft}>
                <span style={st.rowIcon}>{t.icon}</span>
                <div>
                  <p style={st.rowLabel}>{t.label}</p>
                  <p style={st.rowDesc}>{t.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(t.key)}
                disabled={saving === t.key}
                style={{
                  ...st.toggle,
                  background: prefs[t.key] ? '#16a34a' : '#d1d5db',
                }}
              >
                <span style={{
                  ...st.toggleDot,
                  transform: prefs[t.key] ? 'translateX(22px)' : 'translateX(2px)',
                }} />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function C({ m }: { m: any }) {
  return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5', fontFamily: 'system-ui', gap: 16, textAlign: 'center', padding: 24 }}>
    <div style={{ background: '#fff', padding: 48, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>{m}</div>
  </div>;
}

const st: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff' },
  logo: { fontSize: 18, fontWeight: 700, margin: 0 },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  back: { padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 },
  main: { maxWidth: 550, margin: '24px auto', padding: '0 24px' },
  title: { fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' },
  subtitle: { fontSize: 14, color: '#6b7280', margin: '0 0 24px' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.04)', gap: 12 },
  rowLeft: { display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 },
  rowIcon: { fontSize: 22, flexShrink: 0, marginTop: 2 },
  rowLabel: { fontSize: 14, fontWeight: 600, color: '#1f2937', margin: '0 0 4px' },
  rowDesc: { fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.4 },
  toggle: { width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0, flexShrink: 0 },
  toggleDot: { position: 'absolute', top: 2, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' },
};
