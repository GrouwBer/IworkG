import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>IworkG</h1>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Voltar
        </button>
      </header>

      <main style={styles.main}>
        <h2 style={styles.pageTitle}>📜 Termos de Uso</h2>
        <p style={styles.lastUpdate}>Última atualização: Março de 2025</p>

        <div style={styles.contentCard}>
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>1. Aceitação dos Termos</h3>
            <p style={styles.text}>
              Ao acessar ou utilizar a plataforma IworkG, você concorda com os presentes Termos de Uso.
              Se você não concorda com qualquer parte destes termos, não utilize nossos serviços.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>2. Definições</h3>
            <p style={styles.text}>
              <strong>Plataforma:</strong> IworkG — aplicação web que conecta clientes a prestadores de serviços.<br />
              <strong>Cliente:</strong> Usuário que busca contratar serviços.<br />
              <strong>Prestador:</strong> Profissional ou empresa que oferece serviços através da plataforma.<br />
              <strong>Serviço:</strong> Atividade profissional anunciada pelo Prestador.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>3. Cadastro e Conta</h3>
            <p style={styles.text}>
              Para utilizar a plataforma, é necessário criar uma conta. Você é responsável por manter a
              confidencialidade de suas credenciais de acesso. Informações fornecidas devem ser verdadeiras
              e atualizadas. É proibido criar contas falsas ou usar a identidade de terceiros.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>4. Responsabilidades do Prestador</h3>
            <p style={styles.text}>
              O Prestador é responsável pela veracidade das informações do seu perfil, pela qualidade dos
              serviços prestados e pelo cumprimento de todas as obrigações legais e fiscais relacionadas
              à sua atividade profissional. A IworkG atua apenas como plataforma de conexão, não se
              responsabilizando pela execução dos serviços contratados.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>5. Responsabilidades do Cliente</h3>
            <p style={styles.text}>
              O Cliente deve utilizar a plataforma de boa-fé, fornecer informações verdadeiras ao contratar
              um serviço e respeitar os profissionais. Avaliações devem ser honestas e baseadas na experiência real.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>6. Conduta Proibida</h3>
            <p style={styles.text}>
              É proibido utilizar a plataforma para: (a) atividades ilegais; (b) assédio ou discriminação;
              (c) spam ou propaganda não autorizada; (d) manipulação de avaliações; (e) tentativas de
              burlar a segurança da plataforma.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>7. Propriedade Intelectual</h3>
            <p style={styles.text}>
              Todo o conteúdo da plataforma (logotipos, design, código) é propriedade da IworkG.
              Os conteúdos publicados por Prestadores (fotos, descrições) são de sua responsabilidade.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>8. Limitação de Responsabilidade</h3>
            <p style={styles.text}>
              A IworkG não se responsabiliza por danos decorrentes de serviços contratados através da
              plataforma, incluindo mas não se limitando a: serviços mal executados, atrasos, danos
              materiais ou quaisquer disputas entre Clientes e Prestadores.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>9. Cancelamento e Exclusão de Conta</h3>
            <p style={styles.text}>
              O usuário pode excluir sua conta a qualquer momento através do Dashboard. Ao excluir a conta,
              seus dados pessoais serão removidos conforme nossa Política de Privacidade. Avaliações
              realizadas serão mantidas de forma anônima.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>10. Alterações nos Termos</h3>
            <p style={styles.text}>
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas
              serão comunicadas aos usuários por e-mail ou notificação na plataforma.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>11. Lei Aplicável</h3>
            <p style={styles.text}>
              Estes Termos são regidos pela legislação brasileira. Qualquer disputa será resolvida no foro
              da comarca de Poços de Caldas, MG.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>12. Contato</h3>
            <p style={styles.text}>
              Para dúvidas sobre estes Termos, entre em contato pelo e-mail: suporte@iwork.app
            </p>
          </section>
        </div>

        <div style={styles.navRow}>
          <button onClick={() => navigate('/privacidade')} style={styles.navLink}>
            🔒 Ver Política de Privacidade
          </button>
          <button onClick={() => navigate('/ajuda')} style={styles.navLink}>
            🆘 Central de Ajuda
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
    margin: '0 0 4px',
  },
  lastUpdate: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '0 0 24px',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  section: {
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #f3f4f6',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 12px',
  },
  text: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1.7,
    margin: 0,
  },
  navRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px',
    flexWrap: 'wrap' as const,
  },
  navLink: {
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
