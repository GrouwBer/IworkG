import { Router, Request, Response } from 'express';
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

export default router;
