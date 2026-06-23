import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
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
        <h2 style={styles.pageTitle}>🔒 Política de Privacidade</h2>
        <p style={styles.lastUpdate}>Última atualização: Março de 2025</p>

        <div style={styles.introBox}>
          <p style={styles.introText}>
            A IworkG leva a sua privacidade a sério. Esta Política descreve como coletamos, usamos,
            armazenamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção
            de Dados Pessoais (LGPD — Lei nº 13.709/2018).
          </p>
        </div>

        <div style={styles.contentCard}>
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>1. Dados Coletados</h3>
            <p style={styles.text}>
              Coletamos os seguintes dados pessoais quando você utiliza nossa plataforma:
            </p>
            <ul style={styles.list}>
              <li><strong>Identificação:</strong> Nome, e-mail, telefone, foto do perfil (avatar).</li>
              <li><strong>Localização:</strong> Endereço, cidade, estado, coordenadas geográficas (para busca por proximidade).</li>
              <li><strong>Profissionais:</strong> Categorias de serviço, descrição profissional, anos de experiência, portfólio (fotos).</li>
              <li><strong>Uso:</strong> Avaliações, favoritos, histórico de buscas e interações.</li>
              <li><strong>Navegação:</strong> Endereço IP, tipo de navegador, páginas acessadas.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>2. Finalidade do Tratamento</h3>
            <p style={styles.text}>
              Seus dados são utilizados para:
            </p>
            <ul style={styles.list}>
              <li>Criar e gerenciar sua conta na plataforma.</li>
              <li>Permitir a conexão entre clientes e prestadores de serviços.</li>
              <li>Exibir perfis de prestadores com base na proximidade geográfica.</li>
              <li>Melhorar a experiência do usuário e recomendar serviços relevantes.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
              <li>Enviar comunicações relacionadas ao serviço (não utilizamos para marketing sem consentimento).</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>3. Compartilhamento de Dados</h3>
            <p style={styles.text}>
              Seus dados pessoais não são vendidos a terceiros. Podemos compartilhar dados nas seguintes situações:
            </p>
            <ul style={styles.list}>
              <li><strong>Prestadores:</strong> Seu nome e contato são visíveis para prestadores quando você entra em contato.</li>
              <li><strong>Clientes:</strong> Seu perfil profissional (nome, descrição, portfólio) é público para clientes.</li>
              <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial.</li>
              <li><strong>Google:</strong> Se você optar por login com Google, compartilhamos dados mínimos necessários para autenticação.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>4. Armazenamento e Segurança</h3>
            <p style={styles.text}>
              Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso.
              Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não
              autorizado, perda ou violação.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>5. Retenção de Dados</h3>
            <p style={styles.text}>
              Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, os dados
              pessoais são removidos em até 30 dias. Avaliações realizadas são anonimizadas para preservar
              a reputação dos prestadores. Dados necessários para cumprimento de obrigações legais podem
              ser retidos por prazos maiores conforme exigido por lei.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>6. Seus Direitos (LGPD)</h3>
            <p style={styles.text}>
              Conforme a LGPD, você tem direito a:
            </p>
            <ul style={styles.list}>
              <li><strong>Confirmação e acesso:</strong> Saber quais dados tratamos e solicitar cópia.</li>
              <li><strong>Correção:</strong> Solicitar a correção de dados incompletos ou desatualizados.</li>
              <li><strong>Anonimização:</strong> Solicitar a anonimização de dados desnecessários.</li>
              <li><strong>Portabilidade:</strong> Solicitar a portabilidade dos dados a outro fornecedor.</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão dos dados, exceto quando a lei exigir retenção.</li>
              <li><strong>Revogação:</strong> Revogar o consentimento a qualquer momento.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>7. Cookies</h3>
            <p style={styles.text}>
              Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação, sessão).
              Não utilizamos cookies de rastreamento ou publicidade sem seu consentimento explícito.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>8. Direitos do Titular — Como Exercer</h3>
            <p style={styles.text}>
              Para exercer seus direitos, entre em contato pelo e-mail: <strong>privacidade@iwork.app</strong>
              . Responderemos em até 15 dias úteis, conforme previsto na LGPD.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>9. Encarregado (DPO)</h3>
            <p style={styles.text}>
              Nosso Encarregado de Proteção de Dados (DPO) pode ser contatado pelo e-mail:
              dpo@iwork.app
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>10. Alterações nesta Política</h3>
            <p style={styles.text}>
              Reservamo-nos o direito de modificar esta Política de Privacidade. Alterações significativas
              serão comunicadas por e-mail ou notificação na plataforma. Recomendamos revisar esta página
              periodicamente.
            </p>
          </section>

          <section>
            <h3 style={styles.sectionTitle}>11. Contato</h3>
            <p style={styles.text}>
              Para questões sobre privacidade e proteção de dados:<br />
              E-mail: privacidade@iwork.app<br />
              Endereço: Poços de Caldas, MG — Brasil
            </p>
          </section>
        </div>

        <div style={styles.navRow}>
          <button onClick={() => navigate('/termos')} style={styles.navLink}>
            📜 Ver Termos de Uso
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
  introBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  introText: {
    fontSize: '14px',
    color: '#1e40af',
    lineHeight: 1.6,
    margin: 0,
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
  list: {
    margin: '8px 0 0',
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1.6,
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
