import { useState } from 'react';

interface Props { isOpen: boolean; onClose: () => void; onSubmit: (reason: string, description: string) => Promise<void> }
const REASONS = ['Perfil falso', 'Comportamento inadequado', 'Golpe', 'Outro'];

export default function ReportModal({ isOpen, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState(REASONS[0]);
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try { await onSubmit(reason, desc.trim() || ''); onClose(); }
    catch (err: any) { setError(err.response?.data?.error || 'Erro ao enviar denúncia.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🚩 Denunciar Prestador</h3>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        <div style={{ padding: '0 4px' }}>
          <label style={s.label}>Motivo</label>
          <select value={reason} onChange={e => setReason(e.target.value)} style={s.select}>
            {REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <label style={{ ...s.label, marginTop: 16 }}>Descrição adicional (opcional)</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={500}
            placeholder="Descreva o ocorrido..."
            style={{ ...s.select, resize: 'vertical', minHeight: 80 }} />
          {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>
        <div style={s.footer}>
          <button onClick={onClose} style={s.cancelBtn}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} style={s.submitBtn}>
            {loading ? 'Enviando...' : 'Enviar Denúncia'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 480, boxShadow: '0 4px 24px rgba(0,0,0,.15)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 },
  select: { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit', boxSizing: 'border-box' },
  footer: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6' },
  cancelBtn: { padding: '10px 20px', fontSize: 14, fontWeight: 500, background: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { padding: '10px 24px', fontSize: 14, fontWeight: 600, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
};
