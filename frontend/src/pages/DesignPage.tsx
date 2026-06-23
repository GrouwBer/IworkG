import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { StarRating } from '../components/StarRating';
import { RaioSlider } from '../components/RaioSlider';
import { Modal } from '../components/Modal';
import { showToast } from '../components/Toast';

function ColorSwatch({ name, color }: { name: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: color,
        border: '1px solid var(--color-border)',
      }} />
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{color}</div>
      </div>
    </div>
  );
}

export default function DesignPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [raioDemo, setRaioDemo] = useState(15);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🎨 IworkG Design System</h1>
        <p style={styles.subtitle}>NF001 — Alto contraste, touch-friendly, WCAG AA</p>
      </header>

      <main style={styles.main}>

        {/* ── Cores ── */}
        <section style={styles.section}>
          <h2>🎨 Paleta de Cores</h2>
          <Card>
            <div style={styles.grid3}>
              <ColorSwatch name="Primary" color="#1a56db" />
              <ColorSwatch name="Success" color="#16a34a" />
              <ColorSwatch name="Danger" color="#dc2626" />
              <ColorSwatch name="Warning" color="#d97706" />
              <ColorSwatch name="Text" color="#1e293b" />
              <ColorSwatch name="Text Secondary" color="#475569" />
              <ColorSwatch name="Background" color="#ffffff" />
              <ColorSwatch name="Bg Secondary" color="#f8fafc" />
              <ColorSwatch name="Border" color="#e2e8f0" />
            </div>
          </Card>
        </section>

        {/* ── Tipografia ── */}
        <section style={styles.section}>
          <h2>🔤 Tipografia</h2>
          <Card>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>text-xs — 12px</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>text-sm — 14px</p>
            <p style={{ fontSize: 'var(--text-base)', marginBottom: 4 }}>text-base — 16px (mínimo NF001)</p>
            <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 4 }}>text-lg — 18px</p>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 4 }}>text-xl — 20px</p>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>text-2xl — 24px</p>
          </Card>
        </section>

        {/* ── Botões ── */}
        <section style={styles.section}>
          <h2>🔘 Botões (min 48px altura)</h2>
          <Card>
            <div style={styles.row}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div style={{ ...styles.row, marginTop: 'var(--space-4)' }}>
              <Button size="sm">Small (36px)</Button>
              <Button size="md">Medium (48px)</Button>
              <Button size="lg">Large (56px)</Button>
            </div>
            <div style={{ ...styles.row, marginTop: 'var(--space-4)' }}>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button fullWidth>Full Width</Button>
            </div>
          </Card>
        </section>

        {/* ── Cards ── */}
        <section style={styles.section}>
          <h2>🃏 Cards</h2>
          <Card hover onClick={() => showToast('Card clicado!', 'info')}>
            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Card com hover</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Clique neste card para ver um toast. Cards têm borda arredondada e sombra sutil.
            </p>
          </Card>
        </section>

        {/* ── Chips ── */}
        <section style={styles.section}>
          <h2>🏷️ Chips</h2>
          <Card>
            <div style={styles.row}>
              <Chip label="Eletricista" icon="⚡" />
              <Chip label="Encanador" icon="🔧" active />
              <Chip label="Pintor" icon="🎨" />
              <Chip label="Jardineiro" icon="🌿" />
            </div>
          </Card>
        </section>

        {/* ── StarRating ── */}
        <section style={styles.section}>
          <h2>⭐ StarRating</h2>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <StarRating rating={5.0} reviewCount={42} />
              <StarRating rating={4.3} reviewCount={128} />
              <StarRating rating={3.7} reviewCount={15} />
              <StarRating rating={2.1} reviewCount={3} size="sm" />
              <StarRating rating={0.0} reviewCount={0} />
            </div>
          </Card>
        </section>

        {/* ── Raio de Atuação (RF021) ── */}
        <section style={styles.section}>
          <h2>📏 Raio de Atuação (RF021)</h2>
          <Card>
            <RaioSlider value={raioDemo} onChange={setRaioDemo} />
          </Card>
        </section>

        {/* ── Modal ── */}
        <section style={styles.section}>
          <h2>🪟 Modal</h2>
          <Card>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Abrir Modal
            </Button>
          </Card>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal de exemplo">
            <p style={{ marginBottom: 'var(--space-4)' }}>
              Este é um modal do Design System. Fecha no ESC ou clique fora.
            </p>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Fechar
            </Button>
          </Modal>
        </section>

        {/* ── Toast ── */}
        <section style={styles.section}>
          <h2>🔔 Toast</h2>
          <Card>
            <div style={styles.row}>
              <Button variant="primary" onClick={() => showToast('Operação concluída!', 'success')}>
                Success
              </Button>
              <Button variant="danger" onClick={() => showToast('Algo deu errado.', 'error')}>
                Error
              </Button>
              <Button variant="secondary" onClick={() => showToast('Atenção necessária.', 'warning')}>
                Warning
              </Button>
              <Button variant="ghost" onClick={() => showToast('Informação útil.', 'info')}>
                Info
              </Button>
            </div>
          </Card>
        </section>

        {/* ── Acessibilidade ── */}
        <section style={styles.section}>
          <h2>♿ Acessibilidade (NF001)</h2>
          <Card>
            <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              <li>✅ Contraste de texto ≥ 4.5:1 (WCAG AA)</li>
              <li>✅ Fonte mínima 16px no body</li>
              <li>✅ Botões com altura mínima 48px (touch-friendly)</li>
              <li>✅ Focus visible em todos elementos interativos</li>
              <li>✅ Labels e hints em todos inputs</li>
              <li>✅ Chips/seletores preferidos a campos de texto livre</li>
            </ul>
          </Card>
        </section>

      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-secondary)',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    padding: 'var(--space-8) var(--space-8) var(--space-6)',
    textAlign: 'center',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
  },
  subtitle: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--space-2)',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: 'var(--space-6) var(--space-4) var(--space-12)',
  },
  section: {
    marginBottom: 'var(--space-8)',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 'var(--space-4)',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-3)',
    alignItems: 'center',
  },
};
