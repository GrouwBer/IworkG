import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { providerService, type OwnProfile } from '../services/providers';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

export default function ProviderEditPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    providerService.getOwnProfile()
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone || '');
        setDescription(data.profile?.description || '');
      })
      .catch((err) => setError(err.response?.data?.error || 'Erro ao carregar perfil.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload: any = { name, phone };
      if (description) payload.description = description;
      if (avatarPreview) payload.avatarUrl = avatarPreview;

      await providerService.updateProfile(payload);
      setToast({ message: '✅ Perfil atualizado com sucesso!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || 'Erro ao salvar perfil.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [name, phone, description, avatarPreview]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ fontSize: '16px', color: '#666' }}>Carregando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ fontSize: '16px', color: '#dc2626' }}>{error}</p>
        <button onClick={() => navigate('/buscar')} style={styles.backBtn}>Voltar</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'success'}
        visible={!!toast}
        onClose={() => setToast(null)}
      />

      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG</h1>
        <div style={styles.headerRight}>
          <button onClick={() => navigate('/prestador/' + authUser?.id)} style={styles.viewBtn}>
            👁️ Ver Perfil Público
          </button>
          <button onClick={() => navigate('/buscar')} style={styles.backNavBtn}>
            ← Voltar
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <h2 style={styles.pageTitle}>✏️ Editar Perfil</h2>

        <div style={styles.formCard}>
          {/* Avatar Upload */}
          <div style={styles.avatarSection}>
            <img
              src={avatarPreview || profile?.avatarUrl || ''}
              alt=""
              style={styles.avatar}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e2e8f0" rx="60"/><text x="60" y="68" text-anchor="middle" font-size="44" fill="#94a3b8">👤</text></svg>'
                );
              }}
            />
            <label style={styles.uploadLabel}>
              📷 Alterar Foto
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Name */}
          <div style={styles.field}>
            <label style={styles.label}>Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="Seu nome completo"
            />
          </div>

          {/* Phone */}
          <div style={styles.field}>
            <label style={styles.label}>Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>

          {/* Category (read-only) */}
          {profile?.profile?.categoryName && (
            <div style={styles.field}>
              <label style={styles.label}>Categoria</label>
              <div style={styles.readonlyField}>
                {profile.profile.categoryIcon} {profile.profile.categoryName}
              </div>
            </div>
          )}

          {/* Rating (read-only) */}
          {profile?.profile && (
            <div style={styles.field}>
              <label style={styles.label}>Avaliação</label>
              <div style={styles.readonlyField}>
                {'★'.repeat(Math.floor(profile.profile.rating))}
                {'☆'.repeat(5 - Math.floor(profile.profile.rating))}
                {' '}{profile.profile.rating.toFixed(1)} ({profile.profile.reviewCount} avaliações)
              </div>
            </div>
          )}

          {/* Bio / Description */}
          <div style={styles.field}>
            <label style={styles.label}>Bio / Descrição Profissional</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
              placeholder="Conte um pouco sobre seu trabalho..."
              rows={5}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...styles.saveBtn,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '💾 Salvando...' : '💾 Salvar Alterações'}
          </button>
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
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: '#f5f5f5',
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  viewBtn: {
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  backNavBtn: {
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: 500,
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '600px',
    margin: '32px auto',
    padding: '0 16px',
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 20px',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #e5e7eb',
  },
  uploadLabel: {
    display: 'inline-block',
    padding: '8px 20px',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid #c7d2fe',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#1f2937',
    transition: 'border-color 0.2s',
  },
  textarea: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#1f2937',
    resize: 'vertical',
    fontFamily: 'system-ui, sans-serif',
    transition: 'border-color 0.2s',
  },
  readonlyField: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  saveBtn: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 700,
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  backBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
