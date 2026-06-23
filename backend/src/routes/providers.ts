import { Router, Request, Response } from 'express';
<<<<<<< HEAD
import { requireAuth, requireRole } from '../middleware/auth';
import db, { getProviderProfileByUserId, toggleProviderStatus } from '../db';

const router = Router();

/**
 * GET /api/providers/me
 * Retorna o perfil do prestador logado, incluindo status de disponibilidade.
 */
router.get('/providers/me', requireAuth, requireRole('provider'), (req: Request, res: Response) => {
  const profile = getProviderProfileByUserId(req.user!.id);

  if (!profile) {
    res.status(404).json({ error: 'Perfil de prestador não encontrado.' });
    return;
  }

  res.json({
    id: profile.id,
    userId: profile.user_id,
    categoryId: profile.category_id,
    description: profile.description,
    rating: profile.rating,
    reviewCount: profile.review_count,
    latitude: profile.latitude,
    longitude: profile.longitude,
    city: profile.city,
    state: profile.state,
    active: profile.active === 1,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  });
});

/**
 * PATCH /api/providers/me/status
 * Alterna o status de disponibilidade do prestador (Disponível ↔ Ocupado).
 * Body opcional: { active: boolean } — se enviado, define o status diretamente.
 * Sem body, alterna o status atual (toggle).
 */
router.patch('/providers/me/status', requireAuth, requireRole('provider'), (req: Request, res: Response) => {
  const profile = getProviderProfileByUserId(req.user!.id);

  if (!profile) {
    res.status(404).json({ error: 'Perfil de prestador não encontrado.' });
    return;
  }

  let newActive: number;

  if (req.body && typeof req.body.active === 'boolean') {
    // Define diretamente o status informado no body
    newActive = req.body.active ? 1 : 0;
    db.prepare(
      'UPDATE provider_profiles SET active = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
    ).run(newActive, req.user!.id);
  } else {
    // Toggle: alterna o status atual
    const result = toggleProviderStatus(req.user!.id);
    if (!result) {
      res.status(500).json({ error: 'Erro ao alternar status.' });
      return;
    }
    newActive = result.active ? 1 : 0;
  }

  res.json({
    active: newActive === 1,
    message: newActive === 1 ? 'Disponível para serviços' : 'Ocupado',
  });
});

=======
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ──────────────────────────────────────────────
// GET /api/providers/profile/mine — Own profile (for editing)
// MUST be defined BEFORE /:id to prevent Express route collision
// ──────────────────────────────────────────────
router.get('/profile/mine', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;

  const profile = db.prepare(`
    SELECT
      pp.id as profile_id, pp.description, pp.rating, pp.review_count,
      pp.latitude, pp.longitude, pp.city, pp.state, pp.category_id,
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
        }
      : null,
    portfolio,
  });
});

// ──────────────────────────────────────────────
// GET /api/providers/:id — Public profile view
// ──────────────────────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const provider = db.prepare(`
    SELECT
      u.id, u.name, u.avatar_url, u.phone, u.email,
      pp.description, pp.rating, pp.review_count,
      pp.latitude, pp.longitude, pp.city, pp.state,
      pp.active,
      c.id as category_id, c.name as category_name,
      c.slug as category_slug, c.icon as category_icon
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
    JOIN categories c ON c.id = pp.category_id
    WHERE pp.user_id = ? AND pp.active = 1
  `).get(id) as any;

  if (!provider) {
    res.status(404).json({ error: 'Prestador não encontrado.' });
    return;
  }

  // Get portfolio images
  const portfolio = db.prepare(`
    SELECT id, image_url, caption, sort_order
    FROM provider_portfolio
    WHERE provider_id = (
      SELECT id FROM provider_profiles WHERE user_id = ?
    )
    ORDER BY sort_order ASC, created_at DESC
  `).all(id);

  res.json({
    id: provider.id,
    name: provider.name,
    avatarUrl: provider.avatar_url,
    phone: provider.phone,
    email: provider.email,
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
    userUpdates.push('phone = ?');
    userParams.push(phone);
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

>>>>>>> 113e62c (feat: implementa tela de perfil do prestador - visualização e edição (closes #10))
export default router;
