import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getCategoriesWithProviderCount,
  createCategory,
  updateCategory,
  softDeleteCategory,
  getAdminStats,
} from '../db';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth);
router.use(requireRole('admin'));

// ═══════════════════════════════════════════
// Category CRUD (RF029)
// ═══════════════════════════════════════════

/** GET /api/admin/categories — List all with provider count */
router.get('/categories', (_req: Request, res: Response) => {
  try {
    const categories = getCategoriesWithProviderCount();
    res.json(categories);
  } catch (err) {
    console.error('Admin categories error:', err);
    res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
});

/** POST /api/admin/categories — Create new category */
router.post('/categories', (req: Request, res: Response) => {
  const { name, slug, icon } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: 'Nome e slug são obrigatórios.' });
    return;
  }

  try {
    const cat = createCategory(name, slug, icon || '🔧');
    res.status(201).json(cat);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(409).json({ error: 'Já existe uma categoria com este nome ou slug.' });
      return;
    }
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
});

/** PUT /api/admin/categories/:id — Update category */
router.put('/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, icon } = req.body;

  try {
    const updated = updateCategory(id as string, { name, slug, icon });
    if (!updated) {
      res.status(404).json({ error: 'Categoria não encontrada.' });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
});

/** DELETE /api/admin/categories/:id — Soft delete category */
router.delete('/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = softDeleteCategory(id as string);
    if (!result.success) {
      res.status(400).json({ error: result.reason || 'Erro ao excluir categoria.' });
      return;
    }
    res.json({ message: result.reason || 'Categoria excluída com sucesso.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Erro ao excluir categoria.' });
  }
});

// ═══════════════════════════════════════════
// Dashboard Stats (RF030)
// ═══════════════════════════════════════════

/** GET /api/admin/stats?period=30 — Dashboard metrics */
router.get('/stats', (req: Request, res: Response) => {
  const period = req.query.period;
  const periodDays = typeof period === 'string' ? parseInt(period, 10) || 30 : 30;

  try {
    const stats = getAdminStats(Math.min(periodDays, 90)); // cap at 90 days
    res.json(stats);
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
  }
});

export default router;
