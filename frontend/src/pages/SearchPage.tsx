import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchService, type Category, type Provider } from '../services/search';

const DEFAULT_RADIUS = 20;

export default function SearchPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCategory = searchParams.get('category_id') || '';

  useEffect(() => {
    searchService.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        () => { /* silent fail */ },
        { timeout: 8000, enableHighAccuracy: false }
      );
    }
  }, []);

  const doSearch = useCallback((catId: string, rad: number) => {
    const filters: any = { limit: 50 };
    if (catId) filters.category_id = catId;
    if (userLat != null && userLng != null) {
      filters.lat = userLat;
      filters.lng = userLng;
      filters.radius_km = rad;
    }

    setLoading(true);
    setMessage('');

    searchService.searchProviders(filters)
      .then((data) => {
        setProviders(data.results);
        if (data.results.length === 0) {
          const cat = categories.find(c => c.id === catId);
          setMessage(cat
            ? 'Nenhum ' + cat.name + ' encontrado em um raio de ' + rad + 'km'
            : 'Nenhum prestador encontrado.'
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userLat, userLng, categories]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(selectedCategory, radius);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedCategory, radius, doSearch]);

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === selectedCategory) {
      setSearchParams({});
    } else {
      setSearchParams({ category_id: categoryId });
    }
  };

  const clearFilter = () => setSearchParams({});

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG</h1>
        <span style={styles.greeting}>Ola, {user?.name?.split(' ')[0]}</span>
      </header>

      <div style={styles.chipsWrapper}>
        <div style={styles.chipsScroll}>
          <button
            onClick={clearFilter}
            style={{
              ...styles.chip,
              ...(!selectedCategory ? styles.chipActive : {}),
            }}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              style={{
                ...styles.chip,
                ...(selectedCategory === cat.id ? styles.chipActive : {}),
              }}
            >
              <span style={styles.chipIcon}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {userLat != null && (
        <div style={styles.radiusBar}>
          <span style={styles.radiusLabel}>Raio: {radius} km</span>
          <input
            type="range"
            min={2}
            max={100}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={styles.radiusSlider}
          />
          <span style={styles.radiusRange}>2 — 100 km</span>
        </div>
      )}

      <main style={styles.main}>
        {loading ? (
          <div style={styles.loadingState}>
            <span style={styles.skeletonIcon}>🔍</span>
            <p>Buscando prestadores proximos...</p>
          </div>
        ) : message ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🔍</span>
            <p>{message}</p>
            {selectedCategory && (
              <button onClick={clearFilter} style={styles.clearBtn}>
                Ver todos os prestadores
              </button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {providers.map((p) => (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.avatar}>
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" style={styles.avatarImg} />
                    ) : (
                      <span style={styles.avatarPlaceholder}>
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={styles.cardInfo}>
                    <h3 style={styles.cardName}>{p.name}</h3>
                    <span style={styles.cardCategory}>
                      {p.category.icon} {p.category.name}
                    </span>
                    {p.city && (
                      <span style={styles.cardLocation}>
                        📍 {p.city}, {p.state}
                        {p.distanceKm != null && (
                          <span style={styles.distance}> · {p.distanceKm} km</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div style={styles.ratingCol}>
                    {p.rating > 0 && (
                      <div style={styles.rating}>
                        ⭐ {p.rating.toFixed(1)}
                        <span style={styles.reviewCount}>({p.reviewCount})</span>
                      </div>
                    )}
                    {p.score != null && (
                      <div style={styles.score}>
                        {p.score.toFixed(1)} pts
                      </div>
                    )}
                  </div>
                </div>
                {p.description && (
                  <p style={styles.cardDescription}>{p.description}</p>
                )}
                <div style={styles.cardMeta}>
                  <span>🛠️ {p.experienceYears} anos exp.</span>
                  <span>📏 ate {p.serviceRadiusKm} km</span>
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
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
  },
  logo: { fontSize: '20px', fontWeight: 700, margin: 0 },
  greeting: { fontSize: '14px', opacity: 0.9 },
  chipsWrapper: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e5e5',
    padding: '12px 0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  chipsScroll: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    padding: '0 24px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '2px solid #e0e0e0',
    backgroundColor: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    color: '#444',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
    flexShrink: 0,
    fontFamily: 'inherit',
  },
  chipActive: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    borderColor: '#1a1a2e',
  },
  chipIcon: { fontSize: '16px' },
  radiusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    backgroundColor: '#f0f9ff',
    borderBottom: '1px solid #bae6fd',
  },
  radiusLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0369a1',
    minWidth: '80px',
  },
  radiusSlider: {
    flex: 1,
    accentColor: '#2563eb',
  },
  radiusRange: {
    fontSize: '11px',
    color: '#6b7280',
    minWidth: '65px',
    textAlign: 'right',
  },
  main: {
    maxWidth: '900px',
    margin: '24px auto',
    padding: '0 24px',
  },
  loadingState: {
    textAlign: 'center',
    color: '#888',
    padding: '48px 0',
  },
  skeletonIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
  emptyState: {
    textAlign: 'center',
    padding: '64px 24px',
    color: '#666',
  },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
  clearBtn: {
    marginTop: '16px',
    padding: '10px 24px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: {
    color: '#666',
    fontSize: '20px',
    fontWeight: 600,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', color: '#1a1a2e' },
  cardCategory: { fontSize: '13px', color: '#666' },
  cardLocation: { fontSize: '12px', color: '#888', display: 'block', marginTop: '2px' },
  distance: { color: '#2563eb', fontWeight: 600 },
  ratingCol: { textAlign: 'right', flexShrink: 0 },
  rating: {
    fontSize: '14px',
    color: '#f59e0b',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  reviewCount: { fontSize: '12px', color: '#999', fontWeight: 400 },
  score: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px',
  },
  cardDescription: {
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.5,
    margin: '0 0 10px 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#9ca3af',
    paddingTop: '10px',
    borderTop: '1px solid #f3f4f6',
  },
};
