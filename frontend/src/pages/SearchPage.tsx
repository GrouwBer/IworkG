import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchService, type Category, type Provider } from '../services/search';

export default function SearchPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const selectedCategory = searchParams.get('category_id') || '';

  // Load categories on mount
  useEffect(() => {
    searchService.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch providers when category changes
  useEffect(() => {
    setLoading(true);
    setMessage('');

    const filters: any = { limit: 50 };
    if (selectedCategory) filters.category_id = selectedCategory;

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          filters.lat = pos.coords.latitude;
          filters.lng = pos.coords.longitude;
          doSearch(filters);
        },
        () => doSearch(filters), // Fallback: search without location
        { timeout: 5000 } // 5s timeout for geolocation
      );
    } else {
      doSearch(filters);
    }

    // Safety: stop loading after 15s even if geolocation hangs
    const timeout = setTimeout(() => {
      setLoading(false);
      setMessage('Tempo limite ao obter localização. Tente novamente.');
    }, 15000);

    return () => clearTimeout(timeout);
  }, [selectedCategory]);

  const doSearch = (filters: any) => {
    searchService.searchProviders(filters)
      .then((data) => {
        setProviders(data.results);
        if (data.results.length === 0) {
          const cat = categories.find(c => c.id === selectedCategory);
          setMessage(cat
            ? `Nenhum ${cat.name} na sua região`
            : 'Nenhum prestador encontrado.'
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === selectedCategory) {
      // Deselect
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
        <span style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</span>
      </header>

      {/* Category chips */}
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

      {/* Results */}
      <main style={styles.main}>
        {loading ? (
          <p style={styles.loading}>Buscando prestadores...</p>
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
                      <span style={styles.cardLocation}>📍 {p.city}, {p.state}</span>
                    )}
                  </div>
                  {p.rating > 0 && (
                    <div style={styles.rating}>
                      ⭐ {p.rating.toFixed(1)}
                      <span style={styles.reviewCount}>({p.reviewCount})</span>
                    </div>
                  )}
                </div>
                {p.description && (
                  <p style={styles.cardDescription}>{p.description}</p>
                )}
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
  },
  chipActive: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    borderColor: '#1a1a2e',
  },
  chipIcon: { fontSize: '16px' },
  main: {
    maxWidth: '900px',
    margin: '24px auto',
    padding: '0 24px',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '48px 0',
  },
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
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    color: '#666',
    fontSize: '20px',
    fontWeight: 600,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', color: '#1a1a2e' },
  cardCategory: { fontSize: '13px', color: '#666' },
  cardLocation: { fontSize: '12px', color: '#888', display: 'block', marginTop: '2px' },
  rating: {
    fontSize: '14px',
    color: '#f59e0b',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  reviewCount: { fontSize: '12px', color: '#999', fontWeight: 400 },
  cardDescription: {
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.5,
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
};
