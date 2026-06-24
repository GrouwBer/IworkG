import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestService, type OpenRequest } from '../services/requests';
import { searchService, type Category } from '../services/search';
import { providerService } from '../services/providers';
import Header from '../components/Header';

const URGENCY_COLORS: Record<string, string> = {
  Alta: '#dc2626',
  Media: '#f59e0b',
  Baixa: '#6b7280',
};

export default function RequestBoardPage() {
  const { user: _user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<OpenRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [providerLocation, setProviderLocation] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const [ready, setReady] = useState(false);

  // Load categories + provider profile (with timeout fallback)
  useEffect(() => {
    searchService.getCategories()
      .then(setCategories)
      .catch(() => {});

    // Fallback: initialize after 5s even if GPS hangs
    const timeout = setTimeout(() => { setReady(true); }, 5000);

    providerService.getOwnProfile()
      .then(profileData => {
        clearTimeout(timeout);
        const radius = profileData.profile?.serviceRadiusKm || 20;
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => {
              setProviderLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, radius });
              setReady(true);
            },
            () => {
              if (profileData.profile?.latitude && profileData.profile?.longitude) {
                setProviderLocation({ lat: profileData.profile.latitude, lng: profileData.profile.longitude, radius });
              }
              setReady(true);
            },
            { timeout: 5000 }
          );
        } else if (profileData.profile?.latitude && profileData.profile?.longitude) {
          setProviderLocation({ lat: profileData.profile.latitude, lng: profileData.profile.longitude, radius });
          setReady(true);
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        setReady(true);
      });
  }, []);

  // Fetch open requests (only after initialization to avoid (0,0) race — W1)
  useEffect(() => {
    if (!ready) return;

    setLoading(true);
    setMessage('');

    const params: any = { limit: 50 };
    if (selectedCategory) params.category = selectedCategory;
    if (providerLocation?.lat && providerLocation?.lng) {
      params.lat = providerLocation.lat;
      params.lng = providerLocation.lng;
      params.radius = providerLocation.radius;
    }

    requestService.getOpenRequests(params)
      .then(data => {
        setRequests(data.results);
        if (data.results.length === 0) {
          setMessage('Nenhum pedido aberto na sua região.');
        }
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Erro ao carregar mural.');
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, providerLocation, ready]);

  const handleInterest = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await requestService.expressInterest(requestId);
      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, interestCount: r.interestCount + 1 } : r
      ));
    } catch (err: any) {
      // 409 = already expressed interest — ignore
      if (err.response?.status !== 409) {
        alert(err.response?.data?.error || 'Erro ao demonstrar interesse');
      }
    }
  };

  // Approximate distance from provider to request (Haversine simplified — squared Euclidean)
  const calcDistance = (reqLat: number | null, reqLng: number | null): string => {
    if (!reqLat || !reqLng || !providerLocation?.lat || !providerLocation?.lng) return '';
    const dlat = reqLat - providerLocation.lat;
    const dlng = reqLng - providerLocation.lng;
    const km = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
    if (km < 1) return '< 1 km';
    return `${Math.round(km)} km`;
  };

  if (loading) {
    return <div style={styles.center}><p>Carregando mural...</p></div>;
  }

  if (error && requests.length === 0) {
    return (
      <div style={styles.center}>
        <p style={{ color: '#991b1b', textAlign: 'center', maxWidth: '350px', fontSize: 16 }}>{error}</p>
        <button onClick={() => navigate('/buscar')} style={{ ...styles.backBtn, marginTop: 16, padding: '12px 32px', fontSize: 16 }}>
          ← Ir para Busca
        </button>
        <button onClick={() => navigate('/dashboard')} style={{ ...styles.backBtn, marginTop: 8, padding: '12px 32px', fontSize: 16, backgroundColor: '#1a1a2e', color: '#fff', border: 'none' }}>
          🏠 Ir para Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header showBack backTo="/dashboard" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📋 Mural de Pedidos</h2>
        <button onClick={() => navigate('/publicar')} style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Novo Pedido
        </button>
      </div>

      {/* Category filter */}
      <div style={styles.filterBar}>
        <button
          onClick={() => setSelectedCategory('')}
          style={{ ...styles.chip, ...(selectedCategory === '' ? styles.chipActive : {}) }}
        >
          Todas
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{ ...styles.chip, ...(selectedCategory === cat.id ? styles.chipActive : {}) }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Mural */}
      <main style={styles.main}>
        {message && <p style={styles.empty}>{message}</p>}

        {requests.map(req => (
          <div
            key={req.id}
            onClick={() => navigate(`/pedido/${req.id}`)}
            style={styles.card}
          >
            <div style={styles.cardTop}>
              <div style={styles.cardCategory}>
                {req.category ? (
                  <>{req.category.icon} {req.category.name}</>
                ) : (
                  'Serviço'
                )}
              </div>
              <span style={{ ...styles.urgencyBadge, backgroundColor: URGENCY_COLORS[req.urgency] || '#6b7280' }}>
                {req.urgency}
              </span>
            </div>

            <h3 style={styles.cardTitle}>{req.title}</h3>
            {req.description && (
              <p style={styles.cardDesc}>
                {req.description.length > 120
                  ? req.description.slice(0, 120) + '...'
                  : req.description}
              </p>
            )}

            {req.budget != null ? (
              <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, margin: '2px 0 0 0' }}>
                💰 Até R$ {Number(req.budget).toFixed(2)}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', margin: '2px 0 0 0' }}>
                💰 A combinar
              </p>
            )}

            <div style={styles.cardMeta}>
              <span>📍 {req.city || 'Local não informado'}{req.state ? `, ${req.state}` : ''}</span>
              {providerLocation?.lat && (
                <span>{calcDistance(req.latitude, req.longitude)}</span>
              )}
              <span>{req.interestCount} interessado{req.interestCount !== 1 ? 's' : ''}</span>
            </div>

            <div style={styles.cardActions}>
              <span style={styles.date}>{new Date(req.createdAt).toLocaleDateString('pt-BR')}</span>
              <button
                onClick={(e) => handleInterest(req.id, e)}
                style={styles.interestBtn}
              >
                Tenho Interesse
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff' },
  logo: { fontSize: '18px', fontWeight: 700, margin: 0 },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  role: { fontSize: '14px', opacity: 0.8 },
  center: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui', gap: '16px' },
  filterBar: { display: 'flex', gap: '8px', padding: '12px 24px', overflowX: 'auto', backgroundColor: '#fff', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' },
  chip: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', flexShrink: 0, color: '#444' },
  chipActive: { backgroundColor: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' },
  main: { maxWidth: '700px', margin: '16px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  empty: { textAlign: 'center', color: '#888', padding: '48px 0', fontSize: '15px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'box-shadow 0.2s' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cardCategory: { fontSize: '13px', color: '#666', fontWeight: 500 },
  urgencyBadge: { padding: '3px 10px', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px 0' },
  cardDesc: { fontSize: '14px', color: '#666', lineHeight: 1.4, margin: '0 0 12px 0' },
  cardMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999', marginBottom: '12px' },
  cardActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f0f0f0' },
  date: { fontSize: '12px', color: '#bbb' },
  interestBtn: { padding: '8px 18px', fontSize: '13px', fontWeight: 600, backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};
