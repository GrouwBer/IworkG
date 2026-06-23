import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { providerService, type ProviderProfile, type PortfolioPhoto } from '../services/provider';
import PortfolioGallery from '../components/PortfolioGallery';

export default function MyProviderPage() {
  const { user, isAuthenticated, loading: al } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [load, setLoad] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => { if (al) return; if (!isAuthenticated) { nav('/login'); return; }
    (async () => { try {
      const p = await providerService.getMyProfile(); setProfile(p);
      const pt = await providerService.getMyPortfolio(); setPhotos(pt.photos);
    } catch (e: any) { if (e.response?.status === 404) setErr('Complete seu cadastro de prestador primeiro.'); else if (e.response?.status === 401) nav('/login'); else setErr('Erro ao carregar.'); } finally { setLoad(false); } })();
  }, [isAuthenticated, al]);

  const refresh = async () => { try { const d = await providerService.getMyPortfolio(); setPhotos(d.photos); } catch {} };

  if (al || load) return <C m="Carregando..." />;
  if (err) return <C m={<><p style={{ color: '#dc2626' }}>{err}</p><button onClick={() => nav('/dashboard')} style={s.back}>Voltar ao Dashboard</button></>} />;
  if (!profile) return null;

  return <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#1a1a2e', color: '#fff' }}><h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, cursor: 'pointer' }} onClick={() => nav('/dashboard')}>IworkG</h1><button onClick={() => nav('/dashboard')} style={s.back}>← Dashboard</button></header>
    <main style={{ maxWidth: 800, margin: '24px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0 }}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1 }}><h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{user?.name}</h2><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{profile.categories.map(c => <span key={c.id} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, background: '#eff6ff', color: '#1d4ed8', borderRadius: 20 }}>{c.icon} {c.name}</span>)}</div></div>
          {profile.rating > 0 && <div style={{ padding: '8px 14px', background: '#fef3c7', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#92400e', flexShrink: 0 }}>⭐ {profile.rating.toFixed(1)}</div>}
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#374151', marginBottom: 20 }}>{profile.description}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, padding: '16px 0 0', borderTop: '1px solid #f3f4f6' }}>
          {[['🛠️', 'Experiência', `${profile.experienceYears} anos`], ['📍', 'Localização', `${profile.city}, ${profile.state}`], ['📏', 'Raio', `${profile.serviceRadiusKm} km`], ['📝', 'Avaliações', `${profile.reviewCount}`]].map(([ic, lb, vl]) => <div key={lb} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 20 }}>{ic}</span><div><span style={{ display: 'block', fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>{lb}</span><span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{vl}</span></div></div>)}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>📸 Portfólio — Antes e Depois</h3>
        <PortfolioGallery photos={photos} isOwner={true} onChanged={refresh} />
      </div>
    </main>
  </div>;
}
function C({ m }: { m: any }) { return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}><div style={{ background: '#fff', padding: 48, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>{m}</div></div>; }
const s: Record<string, React.CSSProperties> = { back: { padding: '8px 16px', fontSize: 13, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' } };
