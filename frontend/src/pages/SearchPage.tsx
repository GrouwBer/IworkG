import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchService, type Category, type Provider } from '../services/search';

// ── Location helpers ──
const LOCATION_CACHE_KEY = 'iworkg_location';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedLocation(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const { lat, lng, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
    return { lat, lng };
  } catch {
    return null;
  }
}

function cacheLocation(lat: number, lng: number) {
  localStorage.setItem(
    LOCATION_CACHE_KEY,
    JSON.stringify({ lat, lng, ts: Date.now() })
  );
}

async function lookupCep(
  cep: string
): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await resp.json();
    if (data.erro) return null;

    // Nominatim (OpenStreetMap) geocoding: address → lat/lng
    const addr = `${data.logradouro}, ${data.localidade}, ${data.uf}`;
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`
    );
    const geoData = await geo.json();
    if (!geoData.length) return null;

    return {
      lat: parseFloat(geoData[0].lat),
      lng: parseFloat(geoData[0].lon),
      city: data.localidade,
      state: data.uf,
    };
  } catch {
    return null;
  }
}

export default function SearchPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Location state
  const [cepInput, setCepInput] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');

  const selectedCategory = searchParams.get('category_id') || '';

  // Load categories on mount
  useEffect(() => {
    searchService.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch providers when category changes
  useEffect(() => {
    setLoading(true);
    setMessage('');

    const cached = getCachedLocation();
    if (cached) {
      // Use cached coordinates immediately
      doSearch({ lat: cached.lat, lng: cached.lng });
    } else if (navigator.geolocation) {
      // Try GPS
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          cacheLocation(coords.lat, coords.lng);
          doSearch(coords);
        },
        () => {
          // GPS failed or denied — show CEP prompt
          setLoading(false);
          setMessage('Informe seu CEP para encontrar prestadores próximos.');
        }
      );
    } else {
      // No GPS available
      setLoading(false);
      setMessage('Informe seu CEP para encontrar prestadores próximos.');
    }
  }, [selectedCategory]);

  const doSearch = (coords?: { lat: number; lng: number }) => {
    setLoading(true);
    setMessage('');

    const filters: any = { limit: 50 };
    if (selectedCategory) filters.category_id = selectedCategory;
    if (coords) {
      filters.lat = coords.lat;
      filters.lng = coords.lng;
    }

    searchService
      .searchProviders(filters)
      .then((data) => {
        setProviders(data.results);
        if (data.results.length === 0) {
          const cat = categories.find((c) => c.id === selectedCategory);
          setMessage(
            cat
              ? `Nenhum ${cat.name} encontrado na sua região`
              : 'Nenhum prestador encontrado.'
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCepLookup = async () => {
    setCepLoading(true);
    setCepError('');
    const result = await lookupCep(cepInput);
    setCepLoading(false);

    if (!result) {
      setCepError('CEP inválido ou não encontrado.');
      return;
    }

    cacheLocation(result.lat, result.lng);
    setLocationCity(result.city);
    setLocationState(result.state);
    setMessage('');
    doSearch({ lat: result.lat, lng: result.lng });
  };

  const handleGpsClick = () => {
    if (!navigator.geolocation) {
      setCepError('GPS não disponível neste dispositivo.');
      return;
    }
    setLoading(true);
    setCepError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        cacheLocation(coords.lat, coords.lng);
        setLocationCity('');
        setLocationState('');
        doSearch(coords);
      },
      () => {
        setLoading(false);
        setCepError('Permissão de GPS negada. Use o CEP.');
      }
    );
  };

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
        <span style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</span>
      </header>

      {/* Location Bar */}
      <div style={styles.locationBar}>
        <button onClick={handleGpsClick} style={styles.gpsBtn}>
          📍 Usar GPS
        </button>
        <span style={styles.orSep}>ou</span>
        <input
          type="text"
          placeholder="CEP (ex: 01310-100)"
          value={cepInput}
          onChange={(e) => setCepInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCepLookup()}
          style={styles.cepInput}
          maxLength={9}
        />
        <button
          onClick={handleCepLookup}
          disabled={cepLoading}
          style={styles.cepBtn}
        >
          {cepLoading ? '...' : 'Buscar'}
        </button>
        {(locationCity || locationState) && (
          <span style={styles.locationInfo}>
            📍 {[locationCity, locationState].filter(Boolean).join(', ')}
          </span>
        )}
      </div>
      {cepError && <div style={styles.cepError}>{cepError}</div>}

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
                      <img src={p.avatarUrl} alt={p.name} style={styles.avatarImg} />
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
                      </span>
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

  // ── Location Bar ──
  locationBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e5e5',
    flexWrap: 'wrap',
  },
  gpsBtn: {
    padding: '8px 14px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '2px solid #1a1a2e',
    backgroundColor: '#fff',
    color: '#1a1a2e',
    cursor: 'pointer',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  orSep: { fontSize: '13px', color: '#999' },
  cepInput: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    width: '140px',
    outline: 'none',
  },
  cepBtn: {
    padding: '8px 14px',
    fontSize: '13px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  locationInfo: {
    fontSize: '13px',
    color: '#0369a1',
    fontWeight: 500,
    marginLeft: '4px',
  },
  cepError: {
    padding: '6px 24px',
    fontSize: '13px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
  },

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
  cardName: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 4px 0',
    color: '#1a1a2e',
  },
  cardCategory: { fontSize: '13px', color: '#666' },
  cardLocation: {
    fontSize: '12px',
    color: '#888',
    display: 'block',
    marginTop: '2px',
  },
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
