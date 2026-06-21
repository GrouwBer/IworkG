import { Router, Request, Response } from 'express';
import db from '../db';
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

export default router;
