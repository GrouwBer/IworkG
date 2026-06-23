import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireRole } from '../middleware/auth';
import db, {
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
    const updated = updateCategory(id, { name, slug, icon });
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
    const result = softDeleteCategory(id);
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

// ═══════════════════════════════════════════
// Reports & Moderation (issue #19)
// ═══════════════════════════════════════════

/** GET /api/admin/reports — List all reports (pending first) */
router.get('/reports', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT r.id, r.target_type, r.target_id, r.reason, r.description, r.status,
             r.created_at, r.resolved_at, r.resolution,
             reporter.id as reporter_id, reporter.name as reporter_name,
             resolver.id as resolver_id, resolver.name as resolver_name
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporter_id
      LEFT JOIN users resolver ON resolver.id = r.resolved_by
      ORDER BY r.status = 'pending' DESC, r.created_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ error: 'Erro ao listar denúncias.' });
  }
});

/** GET /api/admin/reports/:id — Report details */
router.get('/reports/:id', (req: Request, res: Response) => {
  try {
    const report = db.prepare(`
      SELECT r.*, reporter.name as reporter_name,
             resolver.name as resolver_name
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporter_id
      LEFT JOIN users resolver ON resolver.id = r.resolved_by
      WHERE r.id = ?
    `).get(req.params.id) as any;

    if (!report) {
      res.status(404).json({ error: 'Denúncia não encontrada.' });
      return;
    }

    // Fetch target data based on type
    let target: any = null;
    if (report.target_type === 'user') {
      target = db.prepare('SELECT id, name, email, phone, avatar_url, role, banned FROM users WHERE id = ?')
        .get(report.target_id);
    } else if (report.target_type === 'review') {
      target = db.prepare(`
        SELECT rv.*, u.name as reviewer_name
        FROM reviews rv
        JOIN users u ON u.id = rv.reviewer_id
        WHERE rv.id = ?
      `).get(report.target_id);
    } else if (report.target_type === 'portfolio_photo') {
      target = db.prepare('SELECT * FROM portfolio_photos WHERE id = ?').get(report.target_id);
    }

    res.json({ ...report, target });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Erro ao carregar denúncia.' });
  }
});

/** POST /api/admin/reports/:id/resolve — Resolve a report */
router.post('/reports/:id/resolve', (req: Request, res: Response) => {
  const { action, justification } = req.body;
  const adminId = req.user!.id;

  if (!action || !['remove_photo', 'remove_review', 'ban_user', 'dismiss'].includes(action)) {
    res.status(400).json({ error: 'Ação inválida.' });
    return;
  }

  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id) as any;
    if (!report) {
      res.status(404).json({ error: 'Denúncia não encontrada.' });
      return;
    }

    if (report.status !== 'pending') {
      res.status(400).json({ error: 'Denúncia já foi resolvida.' });
      return;
    }

    // Execute the action
    if (action === 'remove_photo' && report.target_type === 'portfolio_photo') {
      db.prepare('DELETE FROM portfolio_photos WHERE id = ?').run(report.target_id);
    } else if (action === 'remove_review' && report.target_type === 'review') {
      db.prepare('DELETE FROM reviews WHERE id = ?').run(report.target_id);
    } else if (action === 'ban_user' && report.target_type === 'user') {
      db.prepare("UPDATE users SET banned = 1, updated_at = datetime('now') WHERE id = ?").run(report.target_id);
      const banId = uuidv4();
      db.prepare(
        'INSERT INTO bans (id, user_id, admin_id, reason) VALUES (?, ?, ?, ?)'
      ).run(banId, report.target_id, adminId, report.reason);
    } else if (action === 'dismiss') {
      // No action needed
    }

    // Mark report as resolved
    db.prepare(
      "UPDATE reports SET status = 'resolved', resolved_by = ?, resolution = ?, resolved_at = datetime('now') WHERE id = ?"
    ).run(adminId, action, report.id);

    // Log admin action
    const actionId = uuidv4();
    db.prepare(
      'INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id, justification) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(actionId, adminId, action, report.target_type, report.target_id, justification || null);

    res.json({ message: 'Denúncia resolvida com sucesso.' });
  } catch (err) {
    console.error('Resolve report error:', err);
    res.status(500).json({ error: 'Erro ao resolver denúncia.' });
  }
});

// ═══════════════════════════════════════════
// User Bans (issue #19)
// ═══════════════════════════════════════════

/** POST /api/admin/users/:id/ban — Ban a user */
router.post('/users/:id/ban', (req: Request, res: Response) => {
  const { reason } = req.body;
  const adminId = req.user!.id;

  if (!reason) {
    res.status(400).json({ error: 'Motivo do banimento é obrigatório.' });
    return;
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    if (user.banned) {
      res.status(400).json({ error: 'Usuário já está banido.' });
      return;
    }

    db.prepare("UPDATE users SET banned = 1, updated_at = datetime('now') WHERE id = ?").run(user.id);

    const banId = uuidv4();
    db.prepare(
      'INSERT INTO bans (id, user_id, admin_id, reason) VALUES (?, ?, ?, ?)'
    ).run(banId, user.id, adminId, reason);

    const actionId = uuidv4();
    db.prepare(
      'INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id, justification) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(actionId, adminId, 'ban_user', 'user', user.id, reason);

    res.json({ message: 'Usuário banido com sucesso.', banId });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ error: 'Erro ao banir usuário.' });
  }
});

/** POST /api/admin/users/:id/unban — Unban a user */
router.post('/users/:id/unban', (req: Request, res: Response) => {
  const adminId = req.user!.id;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    if (!user.banned) {
      res.status(400).json({ error: 'Usuário não está banido.' });
      return;
    }

    db.prepare("UPDATE users SET banned = 0, updated_at = datetime('now') WHERE id = ?").run(user.id);

    // Revoke active bans
    db.prepare(
      "UPDATE bans SET revoked = 1, revoked_at = datetime('now'), revoked_by = ? WHERE user_id = ? AND revoked = 0"
    ).run(adminId, user.id);

    const actionId = uuidv4();
    db.prepare(
      'INSERT INTO admin_actions (id, admin_id, action_type, target_type, target_id) VALUES (?, ?, ?, ?, ?)'
    ).run(actionId, adminId, 'unban_user', 'user', user.id);

    res.json({ message: 'Usuário desbanido com sucesso.' });
  } catch (err) {
    console.error('Unban user error:', err);
    res.status(500).json({ error: 'Erro ao desbanir usuário.' });
  }
});

/** GET /api/admin/bans — List all bans */
router.get('/bans', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT b.id, b.user_id, b.admin_id, b.reason, b.revoked, b.created_at, b.revoked_at,
             u.name as user_name, u.email as user_email,
             a.name as admin_name
      FROM bans b
      JOIN users u ON u.id = b.user_id
      JOIN users a ON a.id = b.admin_id
      ORDER BY b.revoked ASC, b.created_at DESC
    `).all();
    res.json(rows);
  } catch (err) {
    console.error('List bans error:', err);
    res.status(500).json({ error: 'Erro ao listar banimentos.' });
  }
});

export default router;
