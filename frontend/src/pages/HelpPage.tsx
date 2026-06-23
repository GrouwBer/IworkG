import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface FAQ {
  question: string;
  answer: string;
}

interface TutorialItem {
  title: string;
  summary: string;
  steps: string[];
}

const FAQ_DATA: FAQ[] = [
  {
    question: 'Como faço para encontrar um prestador de serviços?',
    answer: 'Use a busca na página inicial para filtrar por categoria, localização ou nome do profissional. Você pode visualizar o perfil completo, avaliações e portfólio antes de entrar em contato.',
  },
  {
    question: 'Preciso criar uma conta para contratar?',
    answer: 'Sim, é necessário criar uma conta gratuita para entrar em contato com prestadores. O cadastro pode ser feito com Google ou via SMS.',
  },
  {
    question: 'Como avaliar um prestador após o serviço?',
    answer: 'Após a conclusão do serviço, você receberá uma notificação para avaliar o prestador com estrelas e um comentário. Sua avaliação ajuda outros clientes na escolha.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Sim. Seguimos a Lei Geral de Proteção de Dados (LGPD). Seus dados pessoais são criptografados e nunca compartilhados sem seu consentimento. Consulte nossa Política de Privacidade para mais detalhes.',
  },
  {
    question: 'Posso cancelar um pedido?',
    answer: 'Sim, você pode cancelar um pedido a qualquer momento antes do prestador aceitá-lo. Após a aceitação, entre em contato diretamente com o prestador.',
  },
  {
    question: 'Como me tornar um prestador na plataforma?',
    answer: 'Acesse o Dashboard e clique em "Tornar-se Prestador". Preencha o cadastro em etapas: dados básicos, categorias de serviço, descrição, localização e verificação.',
  },
  {
    question: 'O serviço é gratuito?',
    answer: 'O cadastro e a busca por prestadores são gratuitos. Taxas sobre serviços contratados podem ser aplicadas no futuro, conforme os Termos de Uso.',
  },
  {
    question: 'Como excluir minha conta?',
    answer: 'Acesse o Dashboard, vá em Configurações da Conta e clique em "Excluir Conta". Digite EXCLUIR para confirmar. Seus dados serão removidos conforme a LGPD.',
  },
];

const HOW_IT_WORKS_STEPS = [
  { icon: '🔍', title: 'Busque', desc: 'Encontre prestadores perto de você usando filtros de categoria, localização e avaliação.' },
  { icon: '💬', title: 'Contate', desc: 'Entre em contato diretamente com o prestador para combinar detalhes do serviço.' },
  { icon: '⭐', title: 'Avalie', desc: 'Após o serviço, avalie o prestador para ajudar a comunidade a fazer melhores escolhas.' },
];

const TUTORIALS: TutorialItem[] = [
  {
    title: 'Como criar uma conta',
    summary: 'Aprenda a se cadastrar na plataforma em poucos passos.',
    steps: [
      'Acesse a página de login.',
      'Escolha "Entrar com Google" ou "Entrar com telefone".',
      'Se optar por telefone, digite seu número e aguarde o código SMS.',
      'Insira o código recebido para finalizar o cadastro.',
      'Pronto! Você já pode buscar prestadores.',
    ],
  },
  {
    title: 'Como se tornar um prestador',
    summary: 'Guia completo para cadastrar seu perfil profissional.',
    steps: [
      'Faça login na plataforma.',
      'Acesse o Dashboard e clique em "Tornar-se Prestador".',
      'Preencha seus dados básicos (nome e telefone).',
      'Selecione as categorias de serviço que você oferece.',
      'Escreva uma descrição profissional e seus anos de experiência.',
      'Defina seu endereço e raio de atendimento.',
      'Revise as informações e finalize o cadastro.',
      'Seu perfil estará visível para clientes na busca!',
    ],
  },
  {
    title: 'Como editar seu perfil de prestador',
    summary: 'Saiba como manter seu perfil atualizado.',
    steps: [
      'Acesse o Dashboard e vá em "Meu Perfil".',
      'Clique em "Editar Perfil".',
      'Atualize suas informações: descrição, categorias, localização.',
      'Adicione fotos ao seu portfólio.',
      'Salve as alterações para que fiquem visíveis imediatamente.',
    ],
  },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'faq' | 'how-it-works' | 'tutorials'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredFAQ = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;
    const q = searchQuery.toLowerCase();
    return FAQ_DATA.filter(
      (faq) =>
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredTutorials = useMemo(() => {
    if (!searchQuery.trim()) return TUTORIALS;
    const q = searchQuery.toLowerCase();
    return TUTORIALS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.steps.some((s) => s.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const showSearch = activeTab === 'faq' || activeTab === 'tutorials';

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG</h1>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Voltar
        </button>
      </header>

      <main style={styles.main}>
        <h2 style={styles.pageTitle}>🆘 Central de Ajuda</h2>

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { key: 'faq' as const, label: 'FAQ', icon: '❓' },
            { key: 'how-it-works' as const, label: 'Como Funciona', icon: '📖' },
            { key: 'tutorials' as const, label: 'Tutoriais', icon: '🎓' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setOpenFaqIndex(null); }}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.activeTab : {}),
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {showSearch && (
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Pesquisar na ajuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <span style={styles.searchClear} onClick={() => setSearchQuery('')}>
                ✕
              </span>
            )}
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div style={styles.contentCard}>
            {filteredFAQ.length === 0 ? (
              <p style={styles.noResults}>Nenhum resultado encontrado para "{searchQuery}".</p>
            ) : (
              filteredFAQ.map((faq, i) => (
                <div key={i} style={styles.faqItem}>
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                    style={styles.faqQuestion}
                  >
                    <span>{faq.question}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {openFaqIndex === i ? '▲' : '▼'}
                    </span>
                  </button>
                  {openFaqIndex === i && (
                    <div style={styles.faqAnswer}>
                      <p style={{ margin: 0 }}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Como Funciona Tab */}
        {activeTab === 'how-it-works' && (
          <div style={styles.contentCard}>
            <p style={styles.sectionSubtitle}>
              A plataforma conecta clientes a prestadores de serviços de forma simples e segura.
            </p>
            <div style={styles.stepsGrid}>
              {HOW_IT_WORKS_STEPS.map((step, i) => (
                <div key={i} style={styles.stepCard}>
                  <span style={{ fontSize: 40 }}>{step.icon}</span>
                  <h3 style={styles.stepTitle}>{step.title}</h3>
                  <p style={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tutoriais Tab */}
        {activeTab === 'tutorials' && (
          <div style={styles.contentCard}>
            {filteredTutorials.length === 0 ? (
              <p style={styles.noResults}>Nenhum tutorial encontrado para "{searchQuery}".</p>
            ) : (
              filteredTutorials.map((tutorial, i) => (
                <details key={i} style={styles.tutorialItem}>
                  <summary style={styles.tutorialSummary}>
                    <span style={{ fontSize: 18, marginRight: 8 }}>📘</span>
                    <div>
                      <strong>{tutorial.title}</strong>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280', fontWeight: 400 }}>
                        {tutorial.summary}
                      </p>
                    </div>
                  </summary>
                  <ol style={styles.tutorialSteps}>
                    {tutorial.steps.map((step, j) => (
                      <li key={j} style={styles.tutorialStep}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </details>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footerLinks}>
          <button onClick={() => navigate('/termos')} style={styles.footerLink}>
            📜 Termos de Uso
          </button>
          <button onClick={() => navigate('/privacidade')} style={styles.footerLink}>
            🔒 Política de Privacidade
          </button>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
  },
  logo: { fontSize: '20px', fontWeight: 700, margin: 0 },
  backBtn: {
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: 500,
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '800px',
    margin: '32px auto',
    padding: '0 16px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 24px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#fff',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  activeTab: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    borderColor: '#1a1a2e',
  },
  searchContainer: {
    position: 'relative' as const,
    marginBottom: '24px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  searchClear: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: '16px',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  noResults: {
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '14px',
    padding: '24px 0',
  },
  faqItem: {
    borderBottom: '1px solid #f3f4f6',
  },
  faqQuestion: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: '#1f2937',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
    lineHeight: 1.4,
  },
  faqAnswer: {
    padding: '0 0 16px',
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1.6,
  },
  sectionSubtitle: {
    fontSize: '15px',
    color: '#4b5563',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  stepCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center' as const,
    padding: '24px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  stepTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1f2937',
    margin: '12px 0 8px',
  },
  stepDesc: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: 1.5,
    margin: 0,
  },
  tutorialItem: {
    borderBottom: '1px solid #f3f4f6',
    padding: '12px 0',
  },
  tutorialSummary: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    color: '#1f2937',
    padding: '4px 0',
  },
  tutorialSteps: {
    margin: '16px 0 8px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tutorialStep: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1.5,
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '32px',
    padding: '16px',
  },
  footerLink: {
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 500,
    backgroundColor: 'transparent',
    color: '#6366f1',
    border: '1px solid #c7d2fe',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'none',
  },
};
