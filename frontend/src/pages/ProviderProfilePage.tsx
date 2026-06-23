import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providerService, type ProviderProfile } from '../services/providers';
import { useAuth } from '../contexts/AuthContext';
import ReviewSection from '../components/ReviewSection';

const DEFAULT_AVATAR = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e2e8f0" rx="60"/><text x="60" y="68" text-anchor="middle" font-size="44" fill="#94a3b8">👤</text></svg>'
);

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const isOwner = user && profile && user.id === profile.id;

  const handleShare = async () => {
    const shareUrl = `https://iwork.app/provider/${id}`;
    const shareData = {
      title: `${profile?.name} — IworkG`,
      text: `Confira o perfil de ${profile?.name} no IworkG!`,
      url: shareUrl,
    };
    try {
      if (navigator.share && window.innerWidth <= 768) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('🔗 Link copiado para a área de transferência!');
      }
    } catch (err) {
      // User cancelled share or clipboard failed — fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('🔗 Link copiado para a área de transferência!');
      } catch {
        // Last resort
        prompt('Copie o link abaixo:', shareUrl);
      }
    }
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
      <div style={styles.loadingContainer}>
        <p style={{ fontSize: '16px', color: '#666' }}>Carregando perfil...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ fontSize: '16px', color: '#dc2626' }}>{error || 'Perfil não encontrado.'}</p>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>Voltar</button>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) stars.push('★');
      else if (i === full && half) stars.push('☆');
      else stars.push('☆');
    }
    return stars.join('');
  };

  return (
    <div style={styles.container}>
      {/* Header/Nav */}
      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG</h1>
        <div style={styles.headerRight}>
          {isOwner && (
            <button
              onClick={() => navigate('/prestador/editar')}
              style={styles.editBtn}
            >
              ✏️ Editar Perfil
            </button>
          )}
          <button onClick={() => navigate('/buscar')} style={styles.backNavBtn}>
            ← Buscar
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Profile Card */}
        <div style={styles.profileCard}>
          <img
            src={profile.avatarUrl || DEFAULT_AVATAR}
            alt={profile.name}
            style={styles.avatar}
          />
          <h2 style={styles.name}>{profile.name}</h2>

          {/* Category chip */}
          <span style={styles.categoryChip}>
            {profile.category.icon} {profile.category.name}
          </span>

          {/* Rating */}
          <div style={styles.ratingRow}>
            <span style={styles.stars}>{renderStars(profile.rating)}</span>
            <span style={styles.ratingText}>
              {profile.rating.toFixed(1)} ({profile.reviewCount} {profile.reviewCount === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>

          {/* Location */}
          {profile.city && profile.state && (
            <p style={styles.location}>📍 {profile.city}, {profile.state}</p>
          )}

          {/* Description */}
          {profile.description && (
            <p style={styles.bio}>{profile.description}</p>
          )}

          {/* Action Buttons */}
          <div style={styles.actionRow}>
            <button style={styles.contactBtn}>
              💬 Entrar em Contato
            </button>
            <button style={styles.favBtn}>
              ♡ Favoritar
            </button>
            <button onClick={handleShare} style={styles.shareBtn}>
              📤 Compartilhar
            </button>
          </div>
        </div>

        {/* Portfolio Gallery */}
        {profile.portfolio.length > 0 && (
          <div style={styles.portfolioSection}>
            <h3 style={styles.sectionTitle}>📸 Portfólio — Antes e Depois</h3>
            <div style={styles.gallery}>
              {profile.portfolio.map((item) => (
                <div
                  key={item.id}
                  style={styles.galleryItem}
                  onClick={() => setLightboxImg(item.imageUrl)}
                >
                  <img src={item.imageUrl} alt={item.caption || 'Portfólio'} style={styles.galleryImg} />
                  {item.caption && <p style={styles.galleryCaption}>{item.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews + Report (issues #17, #18) */}
        {id && <ReviewSection providerId={id} />}
      </main>

      {/* Lightbox */}
      {lightboxImg && (
        <div style={styles.lightbox} onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" style={styles.lightboxImg} />
          <span style={styles.lightboxClose}>✕</span>
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
  editBtn: {
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
    maxWidth: '720px',
    margin: '32px auto',
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #e5e7eb',
    marginBottom: '16px',
  },
  name: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 8px',
  },
  categoryChip: {
    display: 'inline-block',
    padding: '6px 16px',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  stars: {
    fontSize: '20px',
    color: '#f59e0b',
    letterSpacing: '2px',
  },
  ratingText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  location: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  bio: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '1.6',
    textAlign: 'center' as const,
    maxWidth: '500px',
    marginBottom: '20px',
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  contactBtn: {
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: 600,
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  favBtn: {
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: 600,
    backgroundColor: '#fff',
    color: '#dc2626',
    border: '2px solid #fecaca',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  shareBtn: {
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: 600,
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    border: '2px solid #bbf7d0',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  portfolioSection: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
    margin: '0 0 16px',
  },
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  },
  galleryItem: {
    borderRadius: '10px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
    transition: 'transform 0.2s',
  },
  galleryImg: {
    width: '100%',
    height: '160px',
    objectFit: 'cover',
    display: 'block',
  },
  galleryCaption: {
    padding: '8px 12px',
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
    backgroundColor: '#f9fafb',
  },
  lightbox: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    cursor: 'pointer',
  },
  lightboxImg: {
    maxWidth: '90vw',
    maxHeight: '85vh',
    borderRadius: '8px',
    objectFit: 'contain',
  },
  lightboxClose: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    fontSize: '28px',
    color: '#fff',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: '50%',
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
