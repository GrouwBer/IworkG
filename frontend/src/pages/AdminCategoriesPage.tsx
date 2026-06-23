import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, type AdminCategory } from '../services/admin';

const AVAILABLE_ICONS = ['🔧', '⚡', '🧱', '🎨', '🪚', '🌿', '🧹', '🔩', '❄️', '🔑', '🪑', '🏠', '💻', '🚗', '🍽️', '💇'];

export default function AdminCategoriesPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formIcon, setFormIcon] = useState('🔧');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = () => {
    setLoading(true);
    adminService.getCategories()
      .then(setCategories)
      .catch(err => setError(err.response?.data?.error || 'Erro ao carregar.'))
      .finally(() => setLoading(false));
  };

  const startCreate = () => {
    setEditingId('__new__');
    setFormName('');
    setFormSlug('');
    setFormIcon('🔧');
  };

  const startEdit = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon);
  };

  const cancelForm = () => {
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formSlug.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (editingId === '__new__') {
        await adminService.createCategory(formName.trim(), formSlug.trim().toLowerCase().replace(/\s+/g, '-'), formIcon);
      } else {
        await adminService.updateCategory(editingId!, { name: formName.trim(), slug: formSlug.trim().toLowerCase(), icon: formIcon });
      }
      cancelForm();
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (!confirm(`Excluir "${cat.name}"?${cat.provider_count > 0 ? ` (${cat.provider_count} prestadores vinculados serão impactados)` : ''}`)) return;
    try {
      const result = await adminService.deleteCategory(cat.id);
      alert(result.message);
      loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir.');
    }
  };

  if (loading) {
    return <div style={styles.center}><p>Carregando categorias...</p></div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>← Dashboard</button>
        <h1 style={styles.logo}>Categorias</h1>
        <button onClick={startCreate} style={styles.addBtn}>+ Nova</button>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* Form */}
        {editingId && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>{editingId === '__new__' ? 'Nova Categoria' : 'Editar Categoria'}</h3>
            <div style={styles.formRow}>
              <label style={styles.label}>Ícone</label>
              <div style={styles.iconPicker}>
                {AVAILABLE_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormIcon(icon)}
                    style={{ ...styles.iconBtn, ...(formIcon === icon ? styles.iconBtnActive : {}) }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Nome</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ex: Carpinteiro"
                style={styles.input}
              />
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Slug</label>
              <input
                value={formSlug}
                onChange={e => setFormSlug(e.target.value)}
                placeholder="Ex: carpinteiro"
                style={styles.input}
              />
            </div>
            <div style={styles.formActions}>
              <button onClick={cancelForm} style={styles.cancelBtn}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || !formName || !formSlug} style={styles.saveBtn}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ícone</th>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Slug</th>
              <th style={styles.th}>Prestadores</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} style={styles.tr}>
                <td style={styles.td}>{cat.icon}</td>
                <td style={styles.td}><strong>{cat.name}</strong></td>
                <td style={styles.tdMono}>{cat.slug}</td>
                <td style={styles.td}>{cat.provider_count}</td>
                <td style={styles.td}>
                  <button onClick={() => startEdit(cat)} style={styles.editBtn}>Editar</button>
                  <button onClick={() => handleDelete(cat)} style={styles.delBtn}>Excluir</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#999', padding: '32px' }}>Nenhuma categoria cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#1a1a2e', color: '#fff' },
  logo: { fontSize: '18px', fontWeight: 700, margin: 0 },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  addBtn: { padding: '8px 18px', fontSize: '14px', fontWeight: 600, backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  center: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui' },
  main: { maxWidth: '900px', margin: '24px auto', padding: '0 24px' },
  errorBanner: { padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  formCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' },
  formTitle: { fontSize: '16px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px 0' },
  formRow: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
  iconPicker: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  iconBtn: { width: '36px', height: '36px', fontSize: '18px', border: '2px solid #eee', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { borderColor: '#1a1a2e', backgroundColor: '#f0f0ff' },
  formActions: { display: 'flex', gap: '12px', marginTop: '20px' },
  cancelBtn: { flex: 1, padding: '12px', fontSize: '14px', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  saveBtn: { flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600, backgroundColor: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  tdMono: { padding: '12px 16px', fontSize: '13px', color: '#888', fontFamily: 'monospace' },
  editBtn: { padding: '6px 14px', fontSize: '12px', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '6px' },
  delBtn: { padding: '6px 14px', fontSize: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};
