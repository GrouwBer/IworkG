import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { providerService, type ProviderProfile } from '../services/providers';
import { useAuth } from '../contexts/AuthContext';
import ContactModal from '../components/ContactModal';
import ReviewSection from '../components/ReviewSection';
import Header from '../components/Header';
import api from '../services/api';

const DEFAULT_AVATAR = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e2e8f0" rx="60"/><text x="60" y="68" text-anchor="middle" font-size="44" fill="#94a3b8">👤</text></svg>'
);

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    api.get(`/api/favorites/check/${id}`)
      .then(res => setIsFavorited(res.data.favorited))
      .catch(() => {});
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!user) return;
    setFavLoading(true);
    try {
      const res = await api.post(`/api/favorites/${id}`);
      setIsFavorited(res.data.favorited);
    } catch { /* ignore */ }
    finally { setFavLoading(false); }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    providerService.getProviderProfile(id)
      .then(setProfile)
      .catch((err) => setError(err.response?.data?.error || 'Erro ao carregar perfil.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
        <Header showBack />
        <p style={{ textAlign: 'center', padding: 40, color: '#666' }}>Carregando...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
        <Header showBack />
        <p style={{ textAlign: 'center', padding: 40, color: 'red' }}>{error || 'Perfil não encontrado.'}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
      <Header showBack />

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <img src={profile.avatarUrl || DEFAULT_AVATAR} alt={profile.name} style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 16 }} />
            <h2 style={{ fontSize: 24, margin: '0 0 8px' }}>{profile.name}</h2>
            <span style={{ padding: '4px 12px', backgroundColor: '#eff6ff', borderRadius: 20, fontSize: 14, color: '#1d4ed8' }}>
              {profile.category.icon} {profile.category.name}
            </span>
            {profile.city && (
              <span style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
                📍 {profile.city}, {profile.state}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            {user && (
              <button onClick={() => setShowContactModal(true)}
                style={{ padding: '12px 28px', fontSize: 15, fontWeight: 600, backgroundColor: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                💬 Entrar em Contato
              </button>
            )}
            {user && (
              <button onClick={handleToggleFavorite} disabled={favLoading}
                style={{ padding: '12px 28px', fontSize: 15, fontWeight: 600, backgroundColor: isFavorited ? '#fef2f2' : '#f0fdf4', color: isFavorited ? '#dc2626' : '#16a34a', border: `2px solid ${isFavorited ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10, cursor: 'pointer' }}>
                {isFavorited ? '❤️ Favoritado' : '♡ Favoritar'}
              </button>
            )}
          </div>

          {profile.description && (
            <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 24 }}>{profile.description}</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24 }}>⭐</div>
              <strong style={{ fontSize: 18 }}>{profile.rating?.toFixed(1) || '—'}</strong>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>({profile.reviewCount || 0} avaliações)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24 }}>📅</div>
              <strong style={{ fontSize: 18 }}>—</strong>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>de experiência</div>
            </div>
          </div>
        </div>

        {id && <ReviewSection providerId={id} />}
      </main>

      {showContactModal && profile && (
        <ContactModal
          open={showContactModal}
          onClose={() => setShowContactModal(false)}
          providerId={id!}
          providerName={profile.name}
          providerPhone={profile.phone || null}
        />
      )}
    </div>
  );
}
