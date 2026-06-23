import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireRole } from '../middleware/auth';
import db, {
  getProviderReviews, getClientReviewForContact, createReview, hasClientContactedProvider,
  createReport, hasRecentReport, getPendingReports, notifyUser,
} from '../db';

const router = Router();

// ═══════════════════════════════════════════
// Status endpoints
// ═══════════════════════════════════════════

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(req.user!.id) as any;
  if (!profile) {
    res.status(404).json({ error: 'Perfil de prestador não encontrado.' });
    return;
  }
  res.json({
    id: profile.id, userId: profile.user_id, categoryId: profile.category_id,
    description: profile.description, rating: profile.rating, reviewCount: profile.review_count,
    latitude: profile.latitude, longitude: profile.longitude, city: profile.city, state: profile.state,
    active: profile.active === 1, createdAt: profile.created_at, updatedAt: profile.updated_at,
  });
});

router.patch('/me/status', requireAuth, (req: Request, res: Response) => {
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(req.user!.id) as any;
  if (!profile) {
    res.status(404).json({ error: 'Perfil de prestador não encontrado.' });
    return;
  }
  let newActive: number;
  if (req.body && typeof req.body.active === 'boolean') {
    newActive = req.body.active ? 1 : 0;
  } else {
    newActive = profile.active === 1 ? 0 : 1;
  }
  db.prepare("UPDATE provider_profiles SET active = ?, updated_at = datetime('now') WHERE user_id = ?")
    .run(newActive, req.user!.id);
  res.json({ active: newActive === 1, message: newActive === 1 ? 'Disponível para serviços' : 'Ocupado' });
});

// ═══════════════════════════════════════════
// Profile & Portfolio endpoints
// ═══════════════════════════════════════════
router.get('/profile/mine', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;

  const profile = db.prepare(`
    SELECT
      pp.id as profile_id, pp.description, pp.rating, pp.review_count,
      pp.latitude, pp.longitude, pp.city, pp.state, pp.category_id,
      pp.experience_years, pp.service_radius_km, pp.address,
      c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM provider_profiles pp
    LEFT JOIN categories c ON c.id = pp.category_id
    WHERE pp.user_id = ?
  `).get(userId) as any;

  const user = db.prepare(
    'SELECT id, name, email, phone, avatar_url, role FROM users WHERE id = ?'
  ).get(userId) as any;

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  const portfolio = profile
    ? db.prepare(`
        SELECT id, image_url, caption, sort_order
        FROM provider_portfolio
        WHERE provider_id = ?
        ORDER BY sort_order ASC, created_at DESC
      `).all(profile.profile_id)
    : [];

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    role: user.role,
    profile: profile
      ? {
          id: profile.profile_id,
          description: profile.description,
          rating: profile.rating,
          reviewCount: profile.review_count,
          latitude: profile.latitude,
          longitude: profile.longitude,
          city: profile.city,
          state: profile.state,
          categoryId: profile.category_id,
          categoryName: profile.category_name,
          categorySlug: profile.category_slug,
          categoryIcon: profile.category_icon,
          experienceYears: profile.experience_years || 0,
          serviceRadiusKm: profile.service_radius_km || 15,
          address: profile.address || '',
        }
      : null,
    portfolio,
  });
});

// ──────────────────────────────────────────────
// GET /api/providers/:id — Public profile view (by profile_id)
// ──────────────────────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const provider = db.prepare(`
    SELECT
      u.id as user_id, u.name, u.avatar_url, u.phone,
      pp.id as profile_id, pp.description, pp.rating, pp.review_count,
      pp.latitude, pp.longitude, pp.city, pp.state,
      pp.active,
      c.id as category_id, c.name as category_name,
      c.slug as category_slug, c.icon as category_icon
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
    JOIN categories c ON c.id = pp.category_id
    WHERE pp.id = ? AND pp.active = 1
  `).get(id) as any;

  if (!provider) {
    res.status(404).json({ error: 'Prestador não encontrado.' });
    return;
  }

  // Get portfolio images
  const portfolio = db.prepare(`
    SELECT id, image_url, caption, sort_order
    FROM provider_portfolio
    WHERE provider_id = ?
    ORDER BY sort_order ASC, created_at DESC
  `).all(provider.profile_id);

  res.json({
    id: provider.user_id,
    profileId: provider.profile_id,
    name: provider.name,
    phone: provider.phone,
    avatarUrl: provider.avatar_url,
    description: provider.description,
    rating: provider.rating,
    reviewCount: provider.review_count,
    latitude: provider.latitude,
    longitude: provider.longitude,
    city: provider.city,
    state: provider.state,
    category: {
      id: provider.category_id,
      name: provider.category_name,
      slug: provider.category_slug,
      icon: provider.category_icon,
    },
    portfolio,
  });
});

// ──────────────────────────────────────────────
// PUT /api/providers/profile — Update own profile
// ──────────────────────────────────────────────
router.put('/profile', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, phone, description, city, state, latitude, longitude } = req.body;

  // Update user table
  const userUpdates: string[] = [];
  const userParams: any[] = [];

  if (name !== undefined) {
    userUpdates.push('name = ?');
    userParams.push(name);
  }
  if (phone !== undefined) {
    // Validate phone format (W1)
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      res.status(400).json({ error: 'Número de telefone inválido.' });
      return;
    }
    userUpdates.push('phone = ?');
    userParams.push(cleaned);
  }

  if (userUpdates.length > 0) {
    userParams.push(userId);
    db.prepare(
      `UPDATE users SET ${userUpdates.join(', ')}, updated_at = datetime('now') WHERE id = ?`
    ).run(...userParams);
  }

  // Update provider profile
  const profile = db.prepare(
    'SELECT id FROM provider_profiles WHERE user_id = ?'
  ).get(userId) as any;

  if (profile) {
    const profileUpdates: string[] = [];
    const profileParams: any[] = [];

    if (description !== undefined) {
      profileUpdates.push('description = ?');
      profileParams.push(description);
    }
    if (city !== undefined) {
      profileUpdates.push('city = ?');
      profileParams.push(city);
    }
    if (state !== undefined) {
      profileUpdates.push('state = ?');
      profileParams.push(state);
    }
    if (latitude !== undefined) {
      profileUpdates.push('latitude = ?');
      profileParams.push(latitude);
    }
    if (longitude !== undefined) {
      profileUpdates.push('longitude = ?');
      profileParams.push(longitude);
    }

    if (profileUpdates.length > 0) {
      profileParams.push(profile.id);
      db.prepare(
        `UPDATE provider_profiles SET ${profileUpdates.join(', ')}, updated_at = datetime('now') WHERE id = ?`
      ).run(...profileParams);
    }
  }

  // Also update avatar if provided as data URL
  const { avatarUrl } = req.body;
  if (avatarUrl !== undefined) {
    db.prepare(
      `UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(avatarUrl, userId);
  }

  // Fetch updated user
  const updatedUser = db.prepare(
    'SELECT id, name, email, phone, avatar_url, role FROM users WHERE id = ?'
  ).get(userId) as any;

  res.json({
    message: 'Perfil atualizado com sucesso.',
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatar_url,
      role: updatedUser.role,
    },
  });
});

// ──────────────────────────────────────────────
// POST /api/providers/portfolio — Add portfolio image
// ──────────────────────────────────────────────
router.post('/portfolio', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { imageUrl, caption } = req.body;

  if (!imageUrl) {
    res.status(400).json({ error: 'URL da imagem é obrigatória.' });
    return;
  }

  // Validate URL format (W2)
  try {
    new URL(imageUrl);
  } catch {
    res.status(400).json({ error: 'URL da imagem inválida.' });
    return;
  }

  const profile = db.prepare(
    'SELECT id FROM provider_profiles WHERE user_id = ?'
  ).get(userId) as any;

  if (!profile) {
    res.status(400).json({ error: 'Você precisa ter um perfil de prestador para adicionar portfólio.' });
    return;
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO provider_portfolio (id, provider_id, image_url, caption) VALUES (?, ?, ?, ?)'
  ).run(id, profile.id, imageUrl, caption || null);

  res.status(201).json({
    message: 'Imagem adicionada ao portfólio.',
    portfolioItem: { id, imageUrl, caption: caption || null },
  });
});

// ──────────────────────────────────────────────
// DELETE /api/providers/portfolio/:id — Remove portfolio image
// ──────────────────────────────────────────────
router.delete('/portfolio/:id', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const profile = db.prepare(
    'SELECT id FROM provider_profiles WHERE user_id = ?'
  ).get(userId) as any;

  if (!profile) {
    res.status(403).json({ error: 'Acesso negado.' });
    return;
  }

  const item = db.prepare(
    'SELECT id FROM provider_portfolio WHERE id = ? AND provider_id = ?'
  ).get(id, profile.id);

  if (!item) {
    res.status(404).json({ error: 'Imagem não encontrada.' });
    return;
  }

  db.prepare('DELETE FROM provider_portfolio WHERE id = ?').run(id);
  res.json({ message: 'Imagem removida do portfólio.' });
});

// ═══════════════════════════════════════════════
// Review endpoints (issue #17)
// ═══════════════════════════════════════════════

/** POST /api/providers/:userId/reviews — Create a review */
router.post('/:userId/reviews', requireAuth, (req: Request, res: Response) => {
  const clientId = req.user!.id;
  const { rating, comment, contactId } = req.body;
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(req.params.userId as string) as any;
  if (!profile) { res.status(404).json({ error: 'Prestador não encontrado.' }); return; }
  if (!rating || rating < 1 || rating > 5) { res.status(400).json({ error: 'Nota deve ser entre 1 e 5.' }); return; }
  if (comment && comment.length > 300) { res.status(400).json({ error: 'Comentário máximo 300 caracteres.' }); return; }
  if (!hasClientContactedProvider(clientId, profile.user_id)) { res.status(403).json({ error: 'Você precisa ter contatado este prestador antes de avaliar.' }); return; }
  if (contactId && getClientReviewForContact(clientId, contactId)) { res.status(409).json({ error: 'Você já avaliou este contato.' }); return; }
  if (profile.user_id === clientId) { res.status(403).json({ error: 'Você não pode avaliar a si mesmo.' }); return; }
  try {
    const review = createReview({ clientId, providerId: profile.id, contactId, rating, comment });
    const client = db.prepare('SELECT name FROM users WHERE id = ?').get(clientId) as any;
    // Notify the provider about the new review
    notifyUser(
      profile.user_id,
      'review',
      'Nova avaliação recebida!',
      `${client.name} avaliou você com ${rating} ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
      { provider_id: profile.id, review_id: (review as any).id, rating }
    );
    res.status(201).json({ id: (review as any).id, rating: (review as any).rating, comment: (review as any).comment, createdAt: (review as any).created_at });
  } catch (err: any) { res.status(500).json({ error: 'Erro ao salvar avaliação.' }); }
});

/** GET /api/providers/:userId/reviews — List reviews (public) */
router.get('/:userId/reviews', (req: Request, res: Response) => {
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(req.params.userId as string) as any;
  if (!profile) { res.status(404).json({ error: 'Prestador não encontrado.' }); return; }
  const reviews = getProviderReviews(profile.id);
  res.json((reviews as any[]).map((r: any) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at, client: { id: r.client_id, name: r.client_name, avatarUrl: r.client_avatar } })));
});

// ═══════════════════════════════════════════════
// Report endpoint (issue #18)
// ═══════════════════════════════════════════════

/** POST /api/providers/:userId/report — Report a provider */
router.post('/:userId/report', requireAuth, (req: Request, res: Response) => {
  const reporterId = req.user!.id;
  const { reason, description } = req.body;
  const validReasons = ['Perfil falso', 'Comportamento inadequado', 'Golpe', 'Outro'];
  if (!reason || !validReasons.includes(reason)) { res.status(400).json({ error: 'Motivo inválido.' }); return; }
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(req.params.userId as string) as any;
  if (!profile) { res.status(404).json({ error: 'Prestador não encontrado.' }); return; }
  if (profile.user_id === reporterId) { res.status(403).json({ error: 'Você não pode denunciar a si mesmo.' }); return; }
  if (hasRecentReport(reporterId, profile.id)) { res.status(429).json({ error: 'Você já denunciou este prestador nas últimas 24h.' }); return; }
  try {
    createReport({ reporterId, reportedProviderId: profile.id, reason, description });
    res.status(201).json({ message: 'Denúncia registrada. Nossa equipe irá analisar.' });
  } catch (err: any) { res.status(500).json({ error: 'Erro ao registrar denúncia.' }); }
});

/** GET /api/admin/reports — List pending reports (admin only) */
router.get('/admin/reports', requireAuth, requireRole('admin'), (_req: Request, res: Response) => {
  const reports = getPendingReports();
  res.json((reports as any[]).map((r: any) => ({
    id: r.id, reason: r.reason, description: r.description,
    status: r.status, createdAt: r.created_at,
    reporter: { id: r.reporter_id, name: r.reporter_name },
    provider: { id: r.provider_id, name: r.provider_name },
  })));
});

export default router;
