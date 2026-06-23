import { useState, useEffect } from 'react';
import { providerService, type ReviewItem } from '../services/providers';
import { useAuth } from '../contexts/AuthContext';
import InteractiveStars from './InteractiveStars';
import ReportModal from './ReportModal';

interface Props { providerId: string }

export default function ReviewSection({ providerId }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [_success, setSuccess] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [toast, setToast] = useState('');

  const load = () => { providerService.getReviews(providerId).then(setReviews).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(() => { load(); }, [providerId]);

  const handleSubmit = async () => {
    if (rating < 1) { setError('Selecione uma nota.'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      await providerService.submitReview(providerId, { rating, comment: comment.trim() || undefined });
      setSuccess('Avaliação enviada!'); setShowForm(false); setRating(0); setComment(''); load();
    } catch (err: any) { setError(err.response?.data?.error || 'Erro.'); }
    finally { setSubmitting(false); }
  };

  const handleReport = async (reason: string, description: string) => {
    await providerService.submitReport(providerId, { reason, description: description || undefined });
    setToast('Denúncia registrada. Nossa equipe irá analisar.');
    setTimeout(() => setToast(''), 4000);
  };

  return <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>⭐ Avaliações ({reviews.length})</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        {user && !showForm && <button onClick={() => setShowForm(true)} style={st.btn}>Avaliar</button>}
        {user && <button onClick={() => setShowReport(true)} style={{ ...st.btn, background: '#fff', color: '#dc2626', border: '1px solid #fecaca' }}>🚩 Denunciar</button>}
      </div>
    </div>
    {toast && <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a', fontSize: 14, marginBottom: 16 }}>{toast}</div>}
    {showForm && <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, marginBottom: 20, border: '1px solid #e5e7eb' }}>
      <p style={{ fontWeight: 600, margin: '0 0 12px' }}>Sua avaliação</p>
      <div style={{ marginBottom: 12 }}><InteractiveStars rating={rating} onChange={setRating} /></div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Comentário (opcional, máx. 300)" maxLength={300}
        style={{ width: '100%', padding: 10, fontSize: 14, border: '1px solid #d1d5db', borderRadius: 8, resize: 'vertical', minHeight: 60, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <span style={{ fontSize: 12, color: '#9ca3af', display: 'block', textAlign: 'right', marginBottom: 12 }}>{comment.length}/300</span>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSubmit} disabled={submitting} style={st.primary}>{submitting ? 'Enviando...' : 'Enviar Avaliação'}</button>
        <button onClick={() => { setShowForm(false); setError(''); }} style={st.cancel}>Cancelar</button>
      </div>
    </div>}
    {loading ? <p style={{ color: '#9ca3af' }}>Carregando...</p> :
      reviews.length === 0 ? <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Nenhuma avaliação ainda.</p> :
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.map(r => <div key={r.id} style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#6b7280', flexShrink: 0 }}>{r.client.name?.charAt(0) || '?'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{r.client.name}</span>
              <span style={{ color: '#f59e0b', fontSize: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
            </div>
            {r.comment && <p style={{ fontSize: 14, color: '#4b5563', margin: '4px 0 8px', lineHeight: 1.5 }}>{r.comment}</p>}
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>)}
      </div>}
    <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} onSubmit={handleReport} />
  </div>;
}

const st: Record<string, React.CSSProperties> = {
  btn: { padding: '8px 20px', fontSize: 14, fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  primary: { padding: '10px 24px', fontSize: 14, fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  cancel: { padding: '10px 20px', fontSize: 14, fontWeight: 500, background: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
};
