import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoritesService, type FavoriteItem } from '../services/history';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await favoritesService.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (providerId: string) => {
    await favoritesService.toggleFavorite(providerId);
    setFavorites(prev => prev.filter(f => f.provider.id !== providerId));
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Voltar</button>
        <h1 style={styles.logo}>IworkG</h1>
        <span />
      </header>

      <main style={styles.main}>
        <h2 style={styles.title}>Favoritos</h2>
        <p style={styles.subtitle}>Prestadores que você favoritou</p>

        {loading ? (
          <p style={styles.empty}>Carregando...</p>
        ) : favorites.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🤍</span>
            <p>Nenhum favorito ainda.</p>
            <p style={styles.emptyHint}>Toque no coração no perfil de um prestador para adicionar aos favoritos.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {favorites.map((item) => (
              <div key={item.favoriteId} style={styles.card}>
                <div style={styles.avatar}>
                  {item.provider.avatarUrl ? (
                    <img src={item.provider.avatarUrl} alt="" style={styles.avatarImg} />
                  ) : (
                    <span style={styles.avatarPlaceholder}>{item.provider.name.charAt(0)}</span>
                  )}
                </div>
                <div style={styles.info}>
                  <strong>{item.provider.name}</strong>
                  {item.provider.category && (
                    <span style={styles.category}>{item.provider.category.icon} {item.provider.category.name}</span>
                  )}
                  {item.provider.rating > 0 && (
                    <span style={styles.rating}>⭐ {item.provider.rating.toFixed(1)} ({item.provider.reviewCount})</span>
                  )}
                </div>
                <div style={styles.actions}>
                  <button onClick={() => handleRemove(item.provider.id)} style={styles.heartBtn}>
                    ❤️
                  </button>
                  <button onClick={() => navigate(`/provider/${item.provider.id}`)} style={styles.viewBtn}>
                    Perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff' },
  logo: { fontSize: '18px', fontWeight: 700, margin: 0 },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  main: { maxWidth: '700px', margin: '24px auto', padding: '0 24px' },
  title: { fontSize: '22px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 24px 0' },
  empty: { textAlign: 'center', color: '#888', padding: '48px 0' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: '#666' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '12px' },
  emptyHint: { fontSize: '13px', color: '#999', marginTop: '4px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { fontSize: '20px', fontWeight: 600, color: '#666' },
  info: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  category: { fontSize: '13px', color: '#666' },
  rating: { fontSize: '12px', color: '#f59e0b' },
  actions: { display: 'flex', gap: '8px', alignItems: 'center' },
  heartBtn: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px' },
  viewBtn: { padding: '8px 14px', fontSize: '13px', backgroundColor: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' },
};
