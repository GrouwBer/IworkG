import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db, { searchOpenRequests } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// ── NEW: Issue #13 — Mural de Pedidos ──
// IMPORTANT: Static routes (/, /mine) must come BEFORE /:id routes to avoid
// Express interpreting "mine" or "" as :id.

/**
 * POST /api/requests — Create a new service request (client only)
 */
router.post('/', requireAuth, (req: Request, res: Response) => {
  const { title, description, category_id, urgency, photo_url, lat, lng, city, state, address } = req.body;

  if (!title || !category_id) {
    res.status(400).json({ error: 'Título e categoria são obrigatórios.' });
    return;
  }
  if (typeof title !== 'string' || title.length > 100) {
    res.status(400).json({ error: 'Título deve ter no máximo 100 caracteres.' });
    return;
  }
  if (description && (typeof description !== 'string' || description.length > 500)) {
    res.status(400).json({ error: 'Descrição deve ter no máximo 500 caracteres.' });
    return;
  }

  const id = uuidv4();
  const clientId = req.user!.id;

  db.prepare(`
    INSERT INTO service_requests (id, client_id, title, description, category_id, urgency, photo_url, latitude, longitude, city, state, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, clientId, title, description || null, category_id,
    urgency || 'medium', photo_url || null,
    lat || null, lng || null, city || null, state || null, address || null
  );

  res.status(201).json({ id, message: 'Pedido publicado com sucesso!' });
});

/**
 * GET /api/requests — List open requests (Mural)
 */
router.get('/', requireAuth, (req: Request, res: Response) => {
  const { category_id, lat, lng, limit: limitStr, offset: offsetStr } = req.query;
  const limit = Math.min(Math.max(parseInt(limitStr as string) || 20, 1), 50);
  const offset = Math.max(parseInt(offsetStr as string) || 0, 0);

  let sql = `
    SELECT sr.id, sr.title, sr.description, sr.category_id, sr.urgency, sr.photo_url,
           sr.latitude, sr.longitude, sr.city, sr.state, sr.address, sr.status,
           sr.created_at,
           u.id as client_id, u.name as client_name, u.avatar_url as client_avatar,
           c.name as category_name, c.icon as category_icon,
           (SELECT COUNT(*) FROM interests i WHERE i.request_id = sr.id) as interest_count
    FROM service_requests sr
    JOIN users u ON u.id = sr.client_id
    LEFT JOIN categories c ON c.id = sr.category_id
    WHERE sr.status = 'open'
  `;
  const params: any[] = [];

  if (category_id) {
    sql += ' AND sr.category_id = ?';
    params.push(category_id);
  }

  if (lat !== undefined && lng !== undefined) {
    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      sql += ` ORDER BY (
        (sr.latitude - ?) * (sr.latitude - ?) + (sr.longitude - ?) * (sr.longitude - ?)
      ) ASC`;
      params.push(latNum, latNum, lngNum, lngNum);
    } else {
      sql += ' ORDER BY sr.created_at DESC';
    }
  } else {
    sql += ' ORDER BY sr.created_at DESC';
  }

  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params) as any[];

  // Count total (without LIMIT/OFFSET)
  const countSql = sql.replace(/SELECT .*? FROM/, 'SELECT COUNT(*) as total FROM')
    .replace(/ LIMIT \? OFFSET \?$/, '');
  const countParams = params.slice(0, params.length - 2);
  const totalRow = db.prepare(countSql).get(...countParams) as any;

  res.json({
    requests: rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      categoryId: r.category_id,
      category: r.category_name ? { name: r.category_name, icon: r.category_icon } : null,
      urgency: r.urgency,
      photoUrl: r.photo_url,
      latitude: r.latitude,
      longitude: r.longitude,
      city: r.city,
      state: r.state,
      address: r.address,
      status: r.status,
      interestCount: r.interest_count,
      createdAt: r.created_at,
      client: {
        id: r.client_id,
        name: r.client_name,
        avatarUrl: r.client_avatar,
      },
    })),
    total: totalRow.total,
    hasMore: offset + limit < totalRow.total,
  });
});

/**
 * GET /api/requests/mine — My requests (logged user)
 */
router.get('/mine', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;

  const rows = db.prepare(`
    SELECT sr.id, sr.title, sr.description, sr.category_id, sr.urgency, sr.photo_url,
           sr.latitude, sr.longitude, sr.city, sr.state, sr.address, sr.status,
           sr.created_at,
           c.name as category_name, c.icon as category_icon,
           (SELECT COUNT(*) FROM interests i WHERE i.request_id = sr.id) as interest_count
    FROM service_requests sr
    LEFT JOIN categories c ON c.id = sr.category_id
    WHERE sr.client_id = ?
    ORDER BY sr.created_at DESC
  `).all(userId) as any[];

  res.json({
    requests: rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      categoryId: r.category_id,
      category: r.category_name ? { name: r.category_name, icon: r.category_icon } : null,
      urgency: r.urgency,
      photoUrl: r.photo_url,
      latitude: r.latitude,
      longitude: r.longitude,
      city: r.city,
      state: r.state,
      address: r.address,
      status: r.status,
      interestCount: r.interest_count,
      createdAt: r.created_at,
    })),
  });
});

/**
 * PATCH /api/requests/:id — Update request status
 */
router.patch('/:id', requireAuth, (req: Request, res: Response) => {
  const requestId = req.params.id;
  const userId = req.user!.id;
  const { status } = req.body;

  const request = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(requestId) as any;
  if (!request) {
    res.status(404).json({ error: 'Pedido não encontrado.' });
    return;
  }

  if (request.client_id !== userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Apenas o dono do pedido pode alterar o status.' });
    return;
  }

  const validTransitions: Record<string, string[]> = {
    open: ['cancelled', 'in_progress'],
    in_progress: ['completed'],
  };

  if (!validTransitions[request.status]?.includes(status)) {
    res.status(400).json({
      error: `Transição inválida de "${request.status}" para "${status}".`,
    });
    return;
  }

  db.prepare("UPDATE service_requests SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, requestId);

  res.json({ message: 'Status atualizado com sucesso.', status });
});

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
  let interestId: string;
  try {
    interestId = uuidv4();
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

  // Non-owners (providers viewing the request): return request info without interests list
  if (request.client_id !== userId && req.user!.role !== 'admin') {
    res.json({
      request: {
        id: request.id,
        title: request.title,
        description: request.description,
        status: request.status,
        createdAt: request.created_at,
      },
      interests: [],
    });
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

/**
 * GET /api/requests/open — Provider view: list open service requests (issue #14)
 * Query: ?lat=X&lng=Y&radius=Z&category=X&page=X&limit=X
 */
router.get('/open', requireAuth, requireRole('provider'), (req: Request, res: Response) => {
  const { lat, lng, radius, category, page, limit } = req.query;

  const filters: any = {};

  if (lat && typeof lat === 'string') filters.lat = parseFloat(lat);
  if (lng && typeof lng === 'string') filters.lng = parseFloat(lng);
  if (radius && typeof radius === 'string') filters.radius_km = parseInt(radius, 10);
  if (category && typeof category === 'string') filters.category_id = category;
  if (limit && typeof limit === 'string') filters.limit = Math.min(parseInt(limit, 10) || 20, 50);
  if (page && typeof page === 'string') {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    filters.offset = (p - 1) * (filters.limit || 20);
  }

  try {
    const results = searchOpenRequests(filters);

    res.json({
      results: results.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        urgency: row.urgency || 'Media',
        status: row.status,
        latitude: row.latitude,
        longitude: row.longitude,
        city: row.city,
        state: row.state,
        createdAt: row.created_at,
        interestCount: row.interest_count,
        client: {
          id: row.client_id,
          name: row.client_name,
          avatarUrl: row.client_avatar,
        },
        category: row.category_name ? {
          name: row.category_name,
          slug: row.category_slug,
          icon: row.category_icon,
        } : null,
      })),
      filters: {
        lat: filters.lat || null,
        lng: filters.lng || null,
        radius_km: filters.radius_km || null,
        category_id: filters.category_id || null,
        page: page ? parseInt(page as string, 10) : 1,
        limit: filters.limit || 20,
      },
    });
  } catch (err) {
    console.error('Open requests error:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos abertos.' });
  }
});

export default router;
