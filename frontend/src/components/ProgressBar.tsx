interface Props { currentStep: number; totalSteps: number; labels: string[] }

export default function ProgressBar({ currentStep, totalSteps, labels }: Props) {
  const pct = Math.round((currentStep / totalSteps) * 100);
  return <div style={{ marginBottom: 32 }}>
    <div style={{ width: '100%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#2563eb', borderRadius: 4, transition: 'width 0.4s', minWidth: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, paddingRight: 8 }}>{pct}%</span>
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      {labels.map((l, i) => { const n = i + 1; const done = n < currentStep; const active = n === currentStep; return <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, opacity: active ? 1 : done ? .75 : .45 }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: done ? '#16a34a' : active ? '#2563eb' : '#e5e7eb', color: done || active ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, boxShadow: active ? '0 0 0 3px rgba(37,99,235,.2)' : undefined }}>{done ? '✓' : n}</span>
        <span style={{ fontSize: 11, color: active ? '#1d4ed8' : '#6b7280', textAlign: 'center', fontWeight: active ? 700 : 500 }}>{l}</span>
      </div>; })}
    </div>
  </div>;
}
