import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/favorites — List client's favorites
 */
router.get('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;

  const favorites = db.prepare(`
    SELECT 
      f.id as favorite_id, f.created_at,
      u.id as provider_id, u.name, u.avatar_url,
      pp.description, pp.rating, pp.review_count,
      pp.city, pp.state,
      c.name as category_name, c.icon as category_icon
    FROM favorites f
    JOIN users u ON u.id = f.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id = u.id
    LEFT JOIN categories c ON c.id = pp.category_id
    WHERE f.client_id = ?
    ORDER BY f.created_at DESC
  `).all(userId);

  res.json(favorites.map((row: any) => ({
    favoriteId: row.favorite_id,
    createdAt: row.created_at,
    provider: {
      id: row.provider_id,
      name: row.name,
      avatarUrl: row.avatar_url,
      description: row.description,
      rating: row.rating,
      reviewCount: row.review_count,
      city: row.city,
      state: row.state,
      category: row.category_name ? { name: row.category_name, icon: row.category_icon } : null,
    },
  })));
});

/**
 * POST /api/favorites/:providerId — Toggle favorite (add if not exists, remove if exists)
 */
router.post('/:providerId', requireAuth, (req: Request, res: Response) => {
  const clientId = req.user!.id;
  const providerId = req.params.providerId;

  if (clientId === providerId) {
    res.status(400).json({ error: 'Você não pode favoritar a si mesmo.' });
    return;
  }

  // Check if already favorited
  const existing = db.prepare(
    'SELECT id FROM favorites WHERE client_id = ? AND provider_id = ?'
  ).get(clientId, providerId) as any;

  if (existing) {
    // Remove from favorites
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    res.json({ favorited: false, message: 'Removido dos favoritos.' });
  } else {
    // Add to favorites
    const id = uuidv4();
    db.prepare(
      'INSERT INTO favorites (id, client_id, provider_id) VALUES (?, ?, ?)'
    ).run(id, clientId, providerId);
    res.status(201).json({ favorited: true, message: 'Adicionado aos favoritos!' });
  }
});

/**
 * GET /api/favorites/check/:providerId — Check if provider is favorited
 */
router.get('/check/:providerId', requireAuth, (req: Request, res: Response) => {
  const existing = db.prepare(
    'SELECT id FROM favorites WHERE client_id = ? AND provider_id = ?'
  ).get(req.user!.id, req.params.providerId);

  res.json({ favorited: !!existing });
});

export default router;
