import { useState } from 'react';
import { providerService, type PortfolioPhoto } from '../services/provider';

interface Props { photos: PortfolioPhoto[]; isOwner: boolean; onChanged: () => void }
const TAGS = ['Geral', 'Antes', 'Depois'] as const;

export default function PortfolioGallery({ photos, isOwner, onChanged }: Props) {
  const [lb, setLb] = useState<number | null>(null);
  const [up, setUp] = useState(false);
  const [uerr, setUerr] = useState('');
  const [tag, setTag] = useState('Geral');
  const [del, setDel] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setUerr('Formato inválido. Use JPG, PNG ou WebP.'); return; }
    if (file.size > 6 * 1024 * 1024) { setUerr('Arquivo excede 5MB.'); return; }
    if (photos.length >= 10) { setUerr('Limite de 10 fotos atingido.'); return; }
    setUp(true); setUerr('');
    try { await providerService.uploadPhoto(file, tag); onChanged(); e.target.value = ''; } catch (err: any) { setUerr(err.response?.data?.error || 'Erro ao enviar.'); } finally { setUp(false); }
  };

  const handleDel = async (id: string) => { if (!confirm('Excluir esta foto?')) return; setDel(id); try { await providerService.deletePhoto(id); onChanged(); } catch { alert('Erro ao excluir.'); } finally { setDel(null); } };

  return <div style={{ fontFamily: 'system-ui, sans-serif' }}>
    {isOwner && <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 12, border: '2px dashed #bae6fd', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={tag} onChange={e => setTag(e.target.value)} style={{ padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', fontFamily: 'inherit' }}>{TAGS.map(t => <option key={t}>{t}</option>)}</select>
        <label style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, background: up ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: up ? 'not-allowed' : 'pointer', display: 'inline-block' }}>{up ? '⏳ Enviando...' : '📷 Adicionar Foto'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} disabled={up} /></label>
      </div>
      {uerr && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{uerr}</p>}
    </div>}
    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{photos.length} de 10 fotos</p>
    {photos.length === 0 ? <div style={{ textAlign: 'center', padding: '48px 20px', background: '#f9fafb', borderRadius: 12 }}><span style={{ fontSize: 48 }}>📸</span><p style={{ color: '#9ca3af', margin: '8px 0 0' }}>{isOwner ? 'Adicione fotos "Antes e Depois" dos seus serviços.' : 'Nenhuma foto no portfólio.'}</p></div> :
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
      {photos.map((p, i) => <div key={p.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#f3f4f6', cursor: 'pointer' }}>
        <img src={p.url} alt={p.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => setLb(i)} loading="lazy" />
        <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: p.tag === 'Antes' ? 'rgba(239,68,68,.8)' : p.tag === 'Depois' ? 'rgba(34,197,94,.8)' : 'rgba(0,0,0,.55)', color: '#fff' }}>{p.tag}</span>
        {isOwner && <button onClick={() => handleDel(p.id)} disabled={del === p.id} style={{ position: 'absolute', top: 8, right: 8, padding: '4px 8px', border: 'none', borderRadius: 6, background: 'rgba(255,255,255,.9)', cursor: 'pointer', fontSize: 14 }}>{del === p.id ? '⏳' : '🗑️'}</button>}
      </div>)}
    </div>}
    {lb !== null && photos[lb] && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLb(null)}>
      <button style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 10 }} onClick={() => setLb(null)}>✕</button>
      {photos.length > 1 && <><button style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 36, cursor: 'pointer', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} onClick={e => { e.stopPropagation(); if (lb > 0) setLb(lb - 1); }} disabled={lb === 0}>‹</button>
      <button style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 36, cursor: 'pointer', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} onClick={e => { e.stopPropagation(); if (lb < photos.length - 1) setLb(lb + 1); }} disabled={lb === photos.length - 1}>›</button></>}
      <img src={photos[lb].url} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, background: 'rgba(0,0,0,.5)', padding: '8px 16px', borderRadius: 8, display: 'flex', gap: 24 }}><span>{photos[lb].tag}</span><span>{lb + 1} / {photos.length}</span></div>
    </div>}
  </div>;
}
