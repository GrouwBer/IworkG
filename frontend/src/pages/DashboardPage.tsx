import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { providerService, type ProviderProfile } from '../services/provider';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RaioSlider } from '../components/RaioSlider';
import { showToast } from '../components/Toast';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingRaio, setSavingRaio] = useState(false);

  // Load provider profile
  useEffect(() => {
    if (user?.role === 'provider') {
      providerService.getMyProfile()
        .then(setProfile)
        .catch(() => { /* profile may not exist yet */ });
    }
  }, [user]);

  const handleToggleStatus = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await providerService.toggleStatus();
      setProfile((prev) => prev ? { ...prev, active: result.active } : prev);
      showToast(result.message, result.active ? 'success' : 'info');
    } catch {
      showToast('Erro ao alternar status.', 'error');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleRaioChange = useCallback(async (raioKm: number) => {
    if (savingRaio) return;
    setSavingRaio(true);
    try {
      const result = await providerService.setRaioAtuacao(raioKm);
      setProfile((prev) => prev ? { ...prev, raioAtuacaoKm: result.raioAtuacaoKm } : prev);
      showToast(result.message, 'success');
    } catch {
      showToast('Erro ao salvar raio de atuação.', 'error');
    } finally {
      setSavingRaio(false);
    }
  }, [savingRaio]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG</h1>
        <div style={styles.headerRight}>
          {user?.avatarUrl && (
            <img src={user.avatarUrl} alt="" style={styles.avatar} />
          )}
          <span style={styles.userName}>{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={styles.main}>
        <h2>Bem-vindo, {user?.name}!</h2>

        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <p style={styles.role}>
            Perfil: <strong>{
              user?.role === 'client' ? 'Cliente' :
              user?.role === 'provider' ? 'Prestador' : 'Admin'
            }</strong>
          </p>
          <p style={styles.info}>
            {user?.email && <>📧 {user.email}<br /></>}
            {user?.phone && <>📱 {user.phone}</>}
          </p>
        </Card>

        {/* ── Provider: Raio de Atuação (RF021) ── */}
        {user?.role === 'provider' && profile && (
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={styles.sectionTitle}>⚙️ Configurações do Prestador</h3>

            {/* Status toggle */}
            <div style={styles.settingRow}>
              <div>
                <span style={styles.settingLabel}>Status de disponibilidade</span>
                <p style={styles.settingHint}>
                  {profile.active
                    ? 'Seu perfil está visível nas buscas.'
                    : 'Seu perfil NÃO aparece nas buscas.'}
                </p>
              </div>
              <Button
                variant={profile.active ? 'primary' : 'secondary'}
                size="sm"
                loading={loading}
                onClick={handleToggleStatus}
              >
                {profile.active ? '🟢 Disponível' : '🔴 Ocupado'}
              </Button>
            </div>

            {/* Divider */}
            <div style={styles.divider} />

            {/* Raio de atuação slider */}
            <div style={styles.settingRow}>
              <RaioSlider
                value={profile.raioAtuacaoKm}
                onChange={handleRaioChange}
                disabled={savingRaio}
              />
            </div>
          </Card>
        )}

        {/* Placeholder para features futuras */}
        <Card style={{ backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', borderOpacity: 0.3 }}>
          <p style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            🚧 As demais funcionalidades serão implementadas nas próximas issues.<br />
            Sprint 1 — Fundação: Autenticação (✓) | Filtros (#9) | Status (#11) | Raio & Design (#12)
          </p>
        </Card>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-secondary)',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-4) var(--space-8)',
    backgroundColor: '#1a1a2e',
    color: '#fff',
  },
  logo: {
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    margin: 0,
    color: '#fff',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-full)',
  },
  userName: {
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
  },
  main: {
    maxWidth: '720px',
    margin: 'var(--space-10) auto',
    padding: '0 var(--space-4)',
  },
  role: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-1)',
  },
  info: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-tertiary)',
    margin: 0,
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    marginBottom: 'var(--space-4)',
    color: 'var(--color-text)',
  },
  settingRow: {
    padding: 'var(--space-2) 0',
  },
  settingLabel: {
    fontSize: 'var(--text-base)',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  settingHint: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-tertiary)',
    margin: 'var(--space-1) 0 0 0',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--color-border)',
    margin: 'var(--space-4) 0',
  },
};
