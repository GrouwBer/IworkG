import { Router, Request, Response } from 'express';
import db from '../db';
import { getNotificationPreferences, updateNotificationPreferences } from '../services/notifications';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/notifications — Get current user's notifications
 */
router.get('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;

  const notifications = db.prepare(`
    SELECT id, type, title, body, data, read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(userId);

  const unreadCount = db.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0'
  ).get(userId) as any;

  res.json({
    notifications: notifications.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data ? JSON.parse(n.data) : null,
      read: !!n.read,
      createdAt: n.created_at,
    })),
    unreadCount: unreadCount.count,
  });
});

/**
 * PATCH /api/notifications/:id/read — Mark a notification as read
 */
router.patch('/:id/read', requireAuth, (req: Request, res: Response) => {
  const notif = db.prepare(
    'SELECT * FROM notifications WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.id) as any;

  if (!notif) {
    res.status(404).json({ error: 'Notificação não encontrada.' });
    return;
  }

  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Notificação marcada como lida.' });
});

/**
 * PATCH /api/notifications/read-all — Mark all notifications as read
 */
router.patch('/read-all', requireAuth, (req: Request, res: Response) => {
  db.prepare(
    'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0'
  ).run(req.user!.id);
  res.json({ message: 'Todas notificações marcadas como lidas.' });
});

/**
 * GET /api/notifications/preferences — Get user notification preferences
 */
router.get('/preferences', requireAuth, (req: Request, res: Response) => {
  const prefs = getNotificationPreferences(req.user!.id);
  res.json(prefs);
});

/**
 * PUT /api/notifications/preferences — Update user notification preferences
 * Body: { new_requests?, interests?, reviews?, promotions? }
 */
router.put('/preferences', requireAuth, (req: Request, res: Response) => {
  try {
    const { new_requests, interests, reviews, promotions } = req.body;

    // Validate body — all values must be numbers (0 or 1) if provided
    const allowedKeys = ['new_requests', 'interests', 'reviews', 'promotions'];
    const unknownKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (unknownKeys.length > 0) {
      res.status(400).json({ error: `Chaves inválidas: ${unknownKeys.join(', ')}` });
      return;
    }
    for (const k of allowedKeys) {
      const v = req.body[k];
      if (v !== undefined && typeof v !== 'number') {
        res.status(400).json({ error: `${k} deve ser 0 ou 1.` });
        return;
      }
    }

    updateNotificationPreferences(req.user!.id, { new_requests, interests, reviews, promotions });
    res.json({ message: 'Preferências atualizadas.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar preferências.' });
  }
});

export default router;
