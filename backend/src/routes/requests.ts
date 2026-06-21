import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * POST /api/requests/:id/interest — Provider expresses interest in a request
 */
router.post('/:id/interest', requireAuth, requireRole('provider'), (req: Request, res: Response) => {
  const requestId = req.params.id;
  const providerId = req.user!.id;

  // Check request exists
  const request = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(requestId) as any;
  if (!request) {
    res.status(404).json({ error: 'Pedido não encontrado.' });
    return;
  }

  if (request.status !== 'open') {
    res.status(400).json({ error: 'Este pedido não está mais aberto.' });
    return;
  }

  if (request.client_id === providerId) {
    res.status(400).json({ error: 'Você não pode demonstrar interesse no seu próprio pedido.' });
    return;
  }

  // Check if already expressed interest (UNIQUE constraint handles race conditions)
  try {
    const interestId = uuidv4();
    db.prepare(
      'INSERT INTO interests (id, request_id, provider_id) VALUES (?, ?, ?)'
    ).run(interestId, requestId, providerId);
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Você já demonstrou interesse neste pedido.' });
      return;
    }
    throw err;
  }

  // Get provider info for notification
  const provider = db.prepare('SELECT name FROM users WHERE id = ?').get(providerId) as any;
  const category = request.category_id
    ? (db.prepare('SELECT name FROM categories WHERE id = ?').get(request.category_id) as any)
    : null;

  // Create notification for the client
  const notifId = uuidv4();
  const catLabel = category ? ` (${category.name})` : '';
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, data)
     VALUES (?, ?, 'interest_received', ?, ?, ?)`
  ).run(
    notifId,
    request.client_id,
    'Novo interesse no seu pedido!',
    `${provider.name}${catLabel} tem interesse no seu pedido "${request.title}"`,
    JSON.stringify({ request_id: requestId, provider_id: providerId, interest_id: interestId })
  );

  res.status(201).json({
    message: 'Interesse registrado com sucesso!',
    interestId,
  });
});

/**
 * GET /api/requests/:id/interests — Client views interested providers
 */
router.get('/:id/interests', requireAuth, (req: Request, res: Response) => {
  const requestId = req.params.id;
  const userId = req.user!.id;

  // Verify the user owns this request (client) or is a provider who expressed interest
  const request = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(requestId) as any;
  if (!request) {
    res.status(404).json({ error: 'Pedido não encontrado.' });
    return;
  }

  // Only the client who created the request can see the interests list
  if (request.client_id !== userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Apenas o cliente dono do pedido pode ver os interessados.' });
    return;
  }

  const interests = db.prepare(`
    SELECT 
      i.id as interest_id, i.created_at as interest_date,
      u.id as provider_id, u.name, u.avatar_url, u.phone,
      pp.description, pp.rating, pp.review_count,
      pp.latitude, pp.longitude, pp.city, pp.state,
      c.name as category_name, c.icon as category_icon
    FROM interests i
    JOIN users u ON u.id = i.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id = u.id
    LEFT JOIN categories c ON c.id = pp.category_id
    WHERE i.request_id = ?
    ORDER BY i.created_at DESC
  `).all(requestId);

  res.json({
    request: {
      id: request.id,
      title: request.title,
      description: request.description,
      status: request.status,
      createdAt: request.created_at,
    },
    interests: interests.map((row: any) => ({
      interestId: row.interest_id,
      interestDate: row.interest_date,
      provider: {
        id: row.provider_id,
        name: row.name,
        avatarUrl: row.avatar_url,
        description: row.description,
        rating: row.rating,
        reviewCount: row.review_count,
        latitude: row.latitude,
        longitude: row.longitude,
        city: row.city,
        state: row.state,
        category: row.category_name ? {
          name: row.category_name,
          icon: row.category_icon,
        } : null,
      },
    })),
  });
});

export default router;
