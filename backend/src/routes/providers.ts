import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import db, { getProviderProfileByUserId, updateProviderRaioAtuacao, toggleProviderStatus } from '../db';

const router = Router();

/**
 * GET /api/providers/me
 * Retorna o perfil do prestador logado.
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
    raioAtuacaoKm: profile.raio_atuacao_km,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  });
});

/**
 * PATCH /api/providers/me/status
 * Alterna o status de disponibilidade (Disponível ↔ Ocupado).
 * Body opcional: { active: boolean }
 */
router.patch('/providers/me/status', requireAuth, requireRole('provider'), (req: Request, res: Response) => {
  const profile = getProviderProfileByUserId(req.user!.id);

  if (!profile) {
    res.status(404).json({ error: 'Perfil de prestador não encontrado.' });
    return;
  }

  let newActive: number;

  if (req.body && typeof req.body.active === 'boolean') {
    newActive = req.body.active ? 1 : 0;
    db.prepare(
      'UPDATE provider_profiles SET active = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
    ).run(newActive, req.user!.id);
  } else {
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

/**
 * PATCH /api/providers/me/raio-atuacao
 * Atualiza o raio de atuação do prestador (RF021).
 * Body: { raio_km: number } — valores aceitos: 5, 10, 15, 20, 30, 50
 */
router.patch(
  '/providers/me/raio-atuacao',
  requireAuth,
  requireRole('provider'),
  (req: Request, res: Response) => {
    const { raio_km } = req.body;

    if (typeof raio_km !== 'number') {
      res.status(400).json({
        error: 'Campo "raio_km" é obrigatório e deve ser um número.',
        validValues: [5, 10, 15, 20, 30, 50],
      });
      return;
    }

    const validValues = [5, 10, 15, 20, 30, 50];
    if (!validValues.includes(raio_km)) {
      res.status(400).json({
        error: `Raio inválido. Valores aceitos: ${validValues.join(', ')} km.`,
        validValues,
      });
      return;
    }

    const profile = getProviderProfileByUserId(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Perfil de prestador não encontrado.' });
      return;
    }

    const updated = updateProviderRaioAtuacao(req.user!.id, raio_km);
    if (!updated) {
      res.status(500).json({ error: 'Erro ao atualizar raio de atuação.' });
      return;
    }

    res.json({
      raioAtuacaoKm: updated.raio_atuacao_km,
      message: `Raio de atuação alterado para ${updated.raio_atuacao_km} km.`,
    });
  }
);

export default router;
