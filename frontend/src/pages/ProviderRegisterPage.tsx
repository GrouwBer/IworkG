import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { providerService, type WizardState, type Category } from '../services/provider';
import ProgressBar from '../components/ProgressBar';

const TOTAL = 5;
const LABELS = ['Dados', 'Categoria', 'Descrição', 'Localização', 'Revisão'];

interface Form {
  name: string; phone: string; selectedCategory: string;
  description: string; city: string; state: string;
}

export default function ProviderRegisterPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<Form>({
    name: '', phone: '', selectedCategory: '',
    description: '', city: '', state: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    (async () => {
      try {
        const s = await providerService.getWizard();
        setWizard(s);
        setForm(prev => ({ ...prev,
          name: s.stepData.name || s.prefill.name || '',
          phone: s.stepData.phone || s.prefill.phone || '',
          selectedCategory: s.stepData.selectedCategory || '',
          description: s.stepData.description || '',
          city: s.stepData.city || '',
          state: s.stepData.state || '',
        }));
        setStep(s.currentStep || 1);
      } catch (err: any) {
        if (err.response?.status === 401) navigate('/login');
        else setError('Erro ao carregar wizard.');
      } finally { setLoading(false); }
    })();
  }, [isAuthenticated, authLoading]);

  const saveProgress = async (s: number, d: Partial<Form>) => {
    setSaving(true); setError('');
    try { await providerService.saveWizard(s, d); } catch { setError('Erro ao salvar.'); throw new Error(); }
    finally { setSaving(false); }
  };

  const validate = (s: number): string | null => {
    if (s === 1) {
      if (!form.name.trim()) return 'Nome é obrigatório.';
      if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) return 'Telefone inválido.';
    }
    if (s === 2 && !form.selectedCategory) return 'Selecione uma categoria.';
    if (s === 3 && form.description.trim().length < 10) return 'Descrição: mínimo 10 caracteres.';
    if (s === 4) {
      if (!form.city.trim() || !form.state.trim()) return 'Cidade e estado são obrigatórios.';
    }
    return null;
  };

  const handleNext = async () => {
    const v = validate(step);
    if (v) { setError(v); return; }
    const data: any = { name: form.name, phone: form.phone };
    if (step === 2) data.selectedCategory = form.selectedCategory;
    if (step === 3) data.description = form.description;
    if (step === 4) { data.city = form.city; data.state = form.state; }
    await saveProgress(step, data);
    if (step === TOTAL) {
      try {
        setSaving(true);
        await providerService.completeWizard({
          category_id: form.selectedCategory,
          description: form.description,
          city: form.city,
          state: form.state,
        });
        setDone(true);
      } catch (err: any) { setError(err.response?.data?.error || 'Erro ao finalizar.'); }
      finally { setSaving(false); }
    } else { setStep(s => s + 1); setError(''); }
  };

  const handleBack = async () => {
    if (step === 1) return;
    try { await saveProgress(step, {}); } catch {}
    setStep(s => s - 1); setError('');
  };

  if (authLoading || loading) return <Centered msg="Carregando..." />;
  if (done) return <Centered msg={<>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
    <h2>Cadastro Concluído!</h2>
    <p style={{ color: '#16a34a' }}>Seu perfil já está ativo e visível nas buscas.</p>
    <button onClick={() => navigate('/dashboard')} style={s.primaryBtn}>Ir para Dashboard</button>
  </>} />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', backgroundColor: '#1a1a2e', color: '#fff' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>IworkG</h1>
        <span style={{ fontSize: '14px', opacity: 0.8 }}>Cadastro de Prestador</span>
      </header>
      <main style={{ maxWidth: '700px', margin: '24px auto', padding: '0 16px' }}>
        <ProgressBar currentStep={step} totalSteps={TOTAL} labels={LABELS} />
        {error && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}><span>{error}</span><button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '18px', cursor: 'pointer' }}>×</button></div>}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {step === 1 && <Step1 form={form} setForm={setForm} />}
          {step === 2 && <Step2 form={form} wizard={wizard} setForm={setForm} />}
          {step === 3 && <Step3 form={form} setForm={setForm} />}
          {step === 4 && <Step4 form={form} setForm={setForm} />}
          {step === 5 && <Step5 form={form} wizard={wizard} />}
          <div style={{ display: 'flex', marginTop: '32px', gap: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '24px' }}>
            {step > 1 && <button onClick={handleBack} disabled={saving} style={s.secondaryBtn}>← Voltar</button>}
            <div style={{ flex: 1 }} />
            <button onClick={handleNext} disabled={saving} style={s.primaryBtn}>
              {saving ? 'Salvando...' : step === TOTAL ? 'Finalizar' : 'Próximo →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Centered({ msg }: { msg: any }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
    <div style={{ backgroundColor: '#fff', padding: '48px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>{msg}</div>
  </div>;
}

function StepTitle({ n, title, desc }: { n: number; title: string; desc: string }) {
  return <><h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Etapa {n}: {title}</h3><p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px' }}>{desc}</p></>;
}

function Step1({ form, setForm }: { form: Form; setForm: (f: Partial<Form>) => void }) {
  return <div>
    <StepTitle n={1} title="Dados Básicos" desc="Confirme seus dados de contato." />
    <label style={l}><span>Nome *</span><input style={i} value={form.name} onChange={e => setForm({ name: e.target.value })} placeholder="Seu nome completo" /></label>
    <label style={{ ...l, marginTop: '16px' }}><span>Telefone *</span><input style={i} type="tel" value={form.phone} onChange={e => setForm({ phone: e.target.value })} placeholder="(11) 99999-9999" /></label>
  </div>;
}

function Step2({ form, wizard, setForm }: { form: Form; wizard: WizardState | null; setForm: (f: Partial<Form>) => void }) {
  return <div>
    <StepTitle n={2} title="Categoria" desc="Selecione a categoria principal em que você atua." />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
      {(wizard?.categories || []).map((cat: Category) => {
        const sel = form.selectedCategory === cat.id;
        return <button key={cat.id} onClick={() => setForm({ selectedCategory: sel ? '' : cat.id })} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: `2px solid ${sel ? '#2563eb' : '#e5e7eb'}`, borderRadius: '12px', backgroundColor: sel ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', boxShadow: sel ? '0 0 0 1px #2563eb' : undefined }}><span style={{ fontSize: '20px' }}>{cat.icon}</span>{cat.name}</button>;
      })}
    </div>
  </div>;
}

function Step3({ form, setForm }: { form: Form; setForm: (f: Partial<Form>) => void }) {
  return <div>
    <StepTitle n={3} title="Descrição" desc="Conte sobre sua experiência e serviços." />
    <label style={l}><span>Descrição *</span><textarea style={{ ...i, resize: 'vertical', minHeight: '100px' }} rows={5} value={form.description} onChange={e => setForm({ description: e.target.value })} placeholder="Ex: Eletricista com 10 anos de experiência..." maxLength={500} /></label>
    <span style={{ fontSize: '12px', color: form.description.length >= 500 ? '#dc2626' : form.description.length > 450 ? '#f59e0b' : '#9ca3af', textAlign: 'right', display: 'block' }}>{form.description.length}/500</span>
  </div>;
}

function Step4({ form, setForm }: { form: Form; setForm: (f: Partial<Form>) => void }) {
  return <div>
    <StepTitle n={4} title="Localização" desc="Sua cidade e estado de atuação." />
    <div style={{ display: 'flex', gap: '12px' }}>
      <label style={{ ...l, flex: 1 }}><span>Cidade *</span><input style={i} value={form.city} onChange={e => setForm({ city: e.target.value })} placeholder="Sua cidade" /></label>
      <label style={{ ...l, flex: 1 }}><span>Estado *</span><input style={i} value={form.state} onChange={e => setForm({ state: e.target.value })} maxLength={2} placeholder="UF" /></label>
    </div>
  </div>;
}

function Step5({ form, wizard }: { form: Form; wizard: WizardState | null }) {
  const cat = wizard?.categories.find(c => c.id === form.selectedCategory);
  return <div><StepTitle n={5} title="Revisão" desc="Revise antes de finalizar." />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[
        ['Nome', form.name],
        ['Telefone', form.phone],
        ['Categoria', cat ? `${cat.icon} ${cat.name}` : '—'],
        ['Descrição', form.description],
        ['Localização', `${form.city || '—'}, ${form.state || '—'}`],
      ].map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>{label}</span>
          <span style={{ fontSize: '14px', color: '#111827', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
        </div>
      ))}
    </div>
  </div>;
}

const l: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' };
const i: React.CSSProperties = { padding: '10px 14px', fontSize: '15px', border: '1px solid #d1d5db', borderRadius: '8px', fontFamily: 'inherit' };
const s: Record<string, React.CSSProperties> = {
  primaryBtn: { padding: '12px 28px', fontSize: '15px', fontWeight: 600, backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' },
  secondaryBtn: { padding: '12px 20px', fontSize: '15px', fontWeight: 500, backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' },
};
