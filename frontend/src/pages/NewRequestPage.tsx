import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchService, type Category } from '../services/search';
import { requestService } from '../services/requests';
import { getCachedLocation, cacheLocation, lookupCep } from '../services/location';

export default function NewRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [photoUrl, setPhotoUrl] = useState('');

  // Location state
  const [cepInput, setCepInput] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    searchService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleGpsClick = () => {
    if (!navigator.geolocation) {
      setCepError('GPS não disponível neste dispositivo.');
      return;
    }
    setGpsLoading(true);
    setCepError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        cacheLocation(coords.lat, coords.lng);
        setLocationLat(coords.lat);
        setLocationLng(coords.lng);
        setLocationCity('');
        setLocationState('');
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setCepError('Permissão de GPS negada. Use o CEP.');
      }
    );
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
    setLocationLat(result.lat);
    setLocationLng(result.lng);
    setLocationCity(result.city);
    setLocationState(result.state);
  };

  const handleSubmit = async () => {
    setError('');

    if (!title.trim()) {
      setError('Informe o título do pedido.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria.');
      return;
    }

    setSubmitting(true);
    try {
      await requestService.createRequest({
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: categoryId,
        urgency,
        photo_url: photoUrl.trim() || undefined,
        lat: locationLat ?? undefined,
        lng: locationLng ?? undefined,
        city: locationCity || undefined,
        state: locationState || undefined,
        address: undefined,
      });
      navigate('/meus-pedidos');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao publicar pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const urgencyOptions = [
    { value: 'low', label: 'Baixa', color: '#16a34a' },
    { value: 'medium', label: 'Média', color: '#ca8a04' },
    { value: 'high', label: 'Alta', color: '#dc2626' },
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG</h1>
        <span style={styles.greeting}>Novo Pedido</span>
      </header>

      <main style={styles.main}>
        <h2 style={styles.pageTitle}>Publicar Pedido</h2>

        {/* Título */}
        <label style={styles.label}>Título *</label>
        <input
          style={styles.input}
          placeholder="Ex: Preciso de um eletricista para reparo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
        <span style={styles.charCount}>{title.length}/100</span>

        {/* Categoria */}
        <label style={styles.label}>Categoria *</label>
        <div style={styles.chipsScroll}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              style={{
                ...styles.chip,
                ...(categoryId === cat.id ? styles.chipActive : {}),
              }}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Descrição */}
        <label style={styles.label}>Descrição</label>
        <textarea
          style={styles.textarea}
          placeholder="Descreva detalhes do serviço que precisa..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={4}
        />
        <span style={styles.charCount}>{description.length}/500</span>

        {/* Urgência */}
        <label style={styles.label}>Urgência</label>
        <div style={styles.urgencyRow}>
          {urgencyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setUrgency(opt.value)}
              style={{
                ...styles.urgencyBtn,
                borderColor: urgency === opt.value ? opt.color : '#e0e0e0',
                backgroundColor: urgency === opt.value ? opt.color : '#fff',
                color: urgency === opt.value ? '#fff' : '#444',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Foto (URL) */}
        <label style={styles.label}>URL da Foto (opcional)</label>
        <input
          style={styles.input}
          placeholder="https://exemplo.com/foto.jpg"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />

        {/* Localização */}
        <label style={styles.label}>Localização</label>
        <div style={styles.locationBar}>
          <button onClick={handleGpsClick} style={styles.gpsBtn} disabled={gpsLoading}>
            {gpsLoading ? '📡 Obtendo...' : '📍 GPS'}
          </button>
          <span style={styles.orSep}>ou</span>
          <input
            type="text"
            placeholder="CEP"
            value={cepInput}
            onChange={(e) => setCepInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCepLookup()}
            style={styles.cepInput}
            maxLength={9}
          />
          <button onClick={handleCepLookup} disabled={cepLoading} style={styles.cepBtn}>
            {cepLoading ? '...' : 'Buscar'}
          </button>
          {(locationCity || locationState) && (
            <span style={styles.locationInfo}>
              📍 {[locationCity, locationState].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
        {cepError && <div style={styles.errorText}>{cepError}</div>}

        {/* Error */}
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            ...styles.submitBtn,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Publicando...' : 'Publicar Pedido'}
        </button>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff',
  },
  logo: { fontSize: '20px', fontWeight: 700, margin: 0 },
  greeting: { fontSize: '14px', opacity: 0.9 },
  main: {
    maxWidth: '600px', margin: '24px auto', padding: '0 24px',
  },
  pageTitle: { fontSize: '22px', fontWeight: 700, color: '#1a1a2e', marginBottom: '24px' },
  label: {
    display: 'block', fontSize: '14px', fontWeight: 600, color: '#444',
    marginTop: '20px', marginBottom: '8px',
  },
  input: {
    width: '100%', padding: '12px 16px', fontSize: '15px',
    border: '2px solid #e0e0e0', borderRadius: '10px', outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '12px 16px', fontSize: '15px',
    border: '2px solid #e0e0e0', borderRadius: '10px', outline: 'none',
    resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  charCount: { display: 'block', textAlign: 'right', fontSize: '12px', color: '#999', marginTop: '4px' },
  chipsScroll: {
    display: 'flex', gap: '8px', flexWrap: 'wrap',
  },
  chip: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '20px',
    border: '2px solid #e0e0e0', backgroundColor: '#fff',
    fontSize: '13px', fontWeight: 500, color: '#444',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  chipActive: { backgroundColor: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' },
  urgencyRow: { display: 'flex', gap: '12px' },
  urgencyBtn: {
    flex: 1, padding: '10px', fontSize: '14px', fontWeight: 600,
    borderRadius: '10px', border: '2px solid #e0e0e0',
    cursor: 'pointer', textAlign: 'center',
  },
  locationBar: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
  },
  gpsBtn: {
    padding: '8px 14px', fontSize: '13px', borderRadius: '8px',
    border: '2px solid #1a1a2e', backgroundColor: '#fff',
    color: '#1a1a2e', cursor: 'pointer', fontWeight: 600,
  },
  orSep: { fontSize: '13px', color: '#999' },
  cepInput: {
    padding: '8px 12px', fontSize: '14px',
    border: '2px solid #e0e0e0', borderRadius: '8px', width: '140px', outline: 'none',
  },
  cepBtn: {
    padding: '8px 14px', fontSize: '13px', borderRadius: '8px',
    border: 'none', backgroundColor: '#1a1a2e', color: '#fff', cursor: 'pointer', fontWeight: 600,
  },
  locationInfo: { fontSize: '13px', color: '#0369a1', fontWeight: 500 },
  errorText: { fontSize: '13px', color: '#dc2626', marginTop: '4px' },
  errorBox: {
    marginTop: '16px', padding: '12px 16px', backgroundColor: '#fef2f2',
    color: '#dc2626', borderRadius: '10px', fontSize: '14px',
  },
  submitBtn: {
    width: '100%', marginTop: '24px', padding: '14px',
    backgroundColor: '#1a1a2e', color: '#fff', border: 'none',
    borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
  },
};
