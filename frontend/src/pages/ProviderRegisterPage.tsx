import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { providerService, type WizardState, type Category } from '../services/provider';
import ProgressBar from '../components/ProgressBar';

const T = 6;
const LABELS = ['Dados', 'Categorias', 'Descrição', 'Localização', 'Verificação', 'Revisão'];

interface F { name: string; phone: string; sel: string[]; desc: string; exp: string; rad: string; addr: string; city: string; state: string }

export default function ProviderRegisterPage() {
  const { isAuthenticated, loading: al } = useAuth();
  const nav = useNavigate();
  const [wiz, setWiz] = useState<WizardState | null>(null);
  const [step, setStep] = useState(1);
  const [load, setLoad] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [f, setF] = useState<F>({ name: '', phone: '', sel: [], desc: '', exp: '', rad: '10', addr: '', city: '', state: '' });

  useEffect(() => { if (al) return; if (!isAuthenticated) { nav('/login'); return; }
    (async () => { try {
      const s = await providerService.getWizard(); setWiz(s);
      setF(p => ({ ...p, name: s.stepData.name || s.prefill.name || '', phone: s.stepData.phone || s.prefill.phone || '', sel: s.stepData.selectedCategories || [], desc: s.stepData.description || '', exp: s.stepData.experienceYears || '', rad: s.stepData.serviceRadius || '10', addr: s.stepData.address || '', city: s.stepData.city || '', state: s.stepData.state || '' }));
      setStep(s.currentStep);
    } catch (e: any) { if (e.response?.status === 401) nav('/login'); else setErr('Erro ao carregar wizard.'); } finally { setLoad(false); } })();
  }, [isAuthenticated, al]);

  const save = async (st: number, d: Partial<F>) => { setSaving(true); setErr(''); try { await providerService.saveWizard(st, d); } catch { setErr('Erro ao salvar.'); throw new Error(); } finally { setSaving(false); } };
  const val = (s: number): string | null => {
    if (s === 1) { if (!f.name.trim()) return 'Nome obrigatório.'; if (f.phone.replace(/\D/g, '').length < 10) return 'Telefone inválido.'; }
    if (s === 2 && f.sel.length === 0) return 'Selecione ao menos uma categoria.';
    if (s === 3 && f.desc.trim().length < 10) return 'Descrição: mínimo 10 caracteres.';
    if (s === 4) { if (!f.addr.trim()) return 'Endereço obrigatório.'; if (!f.city.trim() || !f.state.trim()) return 'Cidade/estado obrigatórios.'; if (Number(f.rad) < 1) return 'Raio mínimo 1 km.'; }
    return null;
  };
  const next = async () => {
    const v = step === T ? (!acceptedTerms ? 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para finalizar.' : null) : val(step);
    if (v) { setErr(v); return; }
    await save(step, { name: f.name, phone: f.phone, ...(step === 2 ? { selectedCategories: f.sel } : {}), ...(step === 3 ? { description: f.desc, experienceYears: f.exp } : {}), ...(step === 4 ? { serviceRadius: f.rad, address: f.addr, city: f.city, state: f.state } : {}) } as any);
    if (step === T) { setSaving(true); try { await providerService.completeWizard({ categories: f.sel, description: f.desc, experience_years: Number(f.exp) || 0, service_radius_km: Number(f.rad) || 10, address: f.addr, city: f.city, state: f.state }); setDone(true); } catch (e: any) { setErr(e.response?.data?.error || 'Erro ao finalizar.'); } finally { setSaving(false); } } else { setStep(s => s + 1); setErr(''); }
  };
  const back = async () => { if (step === 1) return; try { await save(step, {}); } catch {} setStep(s => s - 1); setErr(''); };
  const tc = (id: string) => setF(p => ({ ...p, sel: p.sel.includes(id) ? p.sel.filter(c => c !== id) : [...p.sel, id] }));

  if (al || load) return <C m="Carregando..." />;
  if (done) return <C m={<><span style={{ fontSize: 48 }}>🎉</span><h2>Cadastro Concluído!</h2><p style={{ color: '#16a34a' }}>Seu perfil já está ativo.</p><button onClick={() => nav('/dashboard')} style={b.primary}>Ir para Dashboard</button></>} />;

  return <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#1a1a2e', color: '#fff' }}><h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, cursor: 'pointer' }} onClick={() => nav('/dashboard')}>IworkG</h1><span style={{ fontSize: 14, opacity: .8 }}>Cadastro de Prestador</span></header>
    <main style={{ maxWidth: 700, margin: '24px auto', padding: '0 16px' }}>
      <ProgressBar currentStep={step} totalSteps={T} labels={LABELS} />
      {err && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 14, marginBottom: 16 }}><span>{err}</span><button onClick={() => setErr('')} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 18, cursor: 'pointer' }}>×</button></div>}
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
        {step === 1 && <S1 f={f} s={setF} />}
        {step === 2 && <S2 f={f} w={wiz} tc={tc} />}
        {step === 3 && <S3 f={f} s={setF} />}
        {step === 4 && <S4 f={f} s={setF} />}
        {step === 5 && <S5 />}
        {step === 6 && <S6 f={f} w={wiz} acceptedTerms={acceptedTerms} setAcceptedTerms={setAcceptedTerms} />}
        <div style={{ display: 'flex', marginTop: 32, gap: 12, borderTop: '1px solid #f3f4f6', paddingTop: 24 }}>
          {step > 1 && <button onClick={back} disabled={saving} style={b.secondary}>← Voltar</button>}
          <div style={{ flex: 1 }} />
          <button onClick={next} disabled={saving} style={b.primary}>{saving ? 'Salvando...' : step === T ? 'Finalizar' : 'Próximo →'}</button>
        </div>
      </div>
    </main>
  </div>;
}
function C({ m }: { m: any }) { return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}><div style={{ background: '#fff', padding: 48, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>{m}</div></div>; }
function ST({ n, t, d }: { n: number; t: string; d: string }) { return <><h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Etapa {n}: {t}</h3><p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px' }}>{d}</p></>; }
const li: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 500, color: '#374151' };
const ii: React.CSSProperties = { padding: '10px 14px', fontSize: 15, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' };
const b: Record<string, React.CSSProperties> = { primary: { padding: '12px 28px', fontSize: 15, fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }, secondary: { padding: '12px 20px', fontSize: 15, fontWeight: 500, background: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' } };

function S1({ f, s }: { f: F; s: any }) { return <div><ST n={1} t="Dados Básicos" d="Confirme seus dados." /><label style={li}><span>Nome *</span><input style={ii} value={f.name} onChange={e => s({ name: e.target.value })} /></label><label style={{ ...li, marginTop: 16 }}><span>Telefone *</span><input style={ii} type="tel" value={f.phone} onChange={e => s({ phone: e.target.value })} /></label></div>; }
function S2({ f, w, tc }: { f: F; w: WizardState | null; tc: (id: string) => void }) { return <div><ST n={2} t="Categorias" d="Selecione as categorias." /><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>{(w?.categories || []).map((c: Category) => { const sel = f.sel.includes(c.id); return <button key={c.id} onClick={() => tc(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: `2px solid ${sel ? '#2563eb' : '#e5e7eb'}`, borderRadius: 12, background: sel ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', boxShadow: sel ? '0 0 0 1px #2563eb' : undefined }}><span style={{ fontSize: 20 }}>{c.icon}</span>{c.name}</button>; })}</div>{f.sel.length > 0 && <p style={{ marginTop: 12, fontSize: 13, color: '#2563eb', fontWeight: 500 }}>{f.sel.length} selecionada(s)</p>}</div>; }
function S3({ f, s }: { f: F; s: any }) { return <div><ST n={3} t="Descrição" d="Conte sobre sua experiência." /><label style={li}><span>Descrição *</span><textarea style={{ ...ii, resize: 'vertical', minHeight: 100 }} rows={5} value={f.desc} onChange={e => s({ desc: e.target.value })} maxLength={500} /></label><span style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', display: 'block' }}>{f.desc.length}/500</span><label style={{ ...li, marginTop: 16 }}><span>Anos de experiência</span><input style={ii} type="number" value={f.exp} onChange={e => s({ exp: e.target.value })} min={0} max={60} /></label></div>; }
function S4({ f, s }: { f: F; s: any }) { return <div><ST n={4} t="Localização" d="Endereço e raio de atendimento." /><label style={li}><span>Raio (km) *</span><input style={ii} type="number" value={f.rad} onChange={e => s({ rad: e.target.value })} min={1} max={500} /></label><label style={{ ...li, marginTop: 16 }}><span>Endereço *</span><input style={ii} value={f.addr} onChange={e => s({ addr: e.target.value })} /></label><div style={{ display: 'flex', gap: 12, marginTop: 16 }}><label style={{ ...li, flex: 1 }}><span>Cidade *</span><input style={ii} value={f.city} onChange={e => s({ city: e.target.value })} /></label><label style={{ ...li, flex: 1 }}><span>Estado *</span><input style={ii} value={f.state} onChange={e => s({ state: e.target.value })} maxLength={2} /></label></div></div>; }
function S5() { return <div><ST n={5} t="Verificação" d="Opcional no MVP — em breve." /><div style={{ border: '2px dashed #d1d5db', borderRadius: 12, padding: 40, textAlign: 'center', background: '#f9fafb' }}><span style={{ fontSize: 40 }}>📁</span><p style={{ color: '#6b7280', fontSize: 14 }}>Upload de documento disponível em breve.</p></div></div>; }
function S6({ f, w, acceptedTerms, setAcceptedTerms }: { f: F; w: WizardState | null; acceptedTerms: boolean; setAcceptedTerms: (v: boolean) => void }) { const cats = f.sel.map(id => w?.categories.find(c => c.id === id)?.name).filter(Boolean).join(', '); return <div><ST n={6} t="Revisão" d="Revise antes de finalizar." /><div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[['Nome', f.name], ['Telefone', f.phone], ['Categorias', cats], ['Descrição', f.desc], ['Experiência', `${f.exp || '0'} anos`], ['Raio', `${f.rad} km`], ['Endereço', `${f.addr}, ${f.city} - ${f.state}`]].map(([l, v]) => <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}><span style={{ fontSize: 14, color: '#6b7280' }}>{l}</span><span style={{ fontSize: 14, color: '#111827', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v || '—'}</span></div>)}
        <div style={{ marginTop: 16, padding: '16px 0', borderTop: '1px solid #e5e7eb' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 14, color: '#374151' }}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              style={{ marginTop: 2, width: 18, height: 18, cursor: 'pointer' }}
            />
            <span>
              Li e aceito os{' '}
              <a href="/termos" target="_blank" style={{ color: '#2563eb', textDecoration: 'underline' }}>Termos de Uso</a>
              {' '}e a{' '}
              <a href="/privacidade" target="_blank" style={{ color: '#2563eb', textDecoration: 'underline' }}>Política de Privacidade</a>
              {' '}da plataforma.
            </span>
          </label>
        </div>
      </div></div>; }
