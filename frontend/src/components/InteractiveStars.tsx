import { useState } from 'react';
interface Props { rating: number; onChange: (r: number) => void; size?: 'sm' | 'md' }
const labels = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente'];
export default function InteractiveStars({ rating, onChange, size = 'md' }: Props) {
  const [hover, setHover] = useState(0);
  const s = size === 'sm' ? 24 : 32;
  const a = hover || rating;
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
    {[1,2,3,4,5].map(i => <span key={i} onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
      style={{ fontSize: s, cursor: 'pointer', userSelect: 'none', color: i <= a ? '#f59e0b' : '#d1d5db', transition: 'transform 0.1s', transform: i <= a ? 'scale(1.1)' : 'scale(1)' }}>★</span>)}
    {a > 0 && <span style={{ marginLeft: 8, fontSize: 13, color: '#6b7280' }}>{labels[a]}</span>}
  </div>;
}
