import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import db, {
  getWizardState,
  createWizardState,
  updateWizardState,
  deleteWizardState,
  getProviderProfile,
  createProviderProfile,
  getAllCategories,
  type UserRow,
} from '../db';

const router = Router();

// All provider routes require authentication
router.use(requireAuth);

/**
 * GET /api/providers/wizard
 * Returns current wizard state for the authenticated user.
 * Does NOT auto-create — wizard is only created on first PUT.
 */
router.get('/wizard', (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = db.prepare('SELECT name, phone, email FROM users WHERE id = ?').get(userId) as Pick<UserRow, 'name' | 'phone' | 'email'> | undefined;
  const wizard = getWizardState(userId);

  if (!wizard) {
    res.json({
      currentStep: 0,
      stepData: {},
      prefill: {
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
      },
      categories: getAllCategories(),
    });
    return;
  }

  const stepData = JSON.parse(wizard.step_data || '{}');

  res.json({
    currentStep: wizard.current_step,
    stepData,
    prefill: {
      name: user?.name || stepData.name || '',
      phone: user?.phone || stepData.phone || '',
      email: user?.email || '',
    },
    categories: getAllCategories(),
  });
});

/**
 * PUT /api/providers/wizard
 * Saves wizard progress. Body: { step: number, data: object }
 */
router.put('/wizard', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { step, data } = req.body;

  if (!step || !data) {
    res.status(400).json({ error: 'Step e data são obrigatórios.' });
    return;
  }

  let wizard = getWizardState(userId);
  if (!wizard) wizard = createWizardState(userId);

  const updated = updateWizardState(userId, step, data);

  res.json({
    currentStep: updated.current_step,
    stepData: JSON.parse(updated.step_data),
    message: 'Progresso salvo.',
  });
});

/**
 * POST /api/providers/wizard/complete
 * Finalises provider registration. Body: { category_id, description, city, state }
 */
router.post('/wizard/complete', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    category_id,
    description,
    city,
    state,
  } = req.body;

  if (!category_id) {
    res.status(400).json({ error: 'Selecione uma categoria.' });
    return;
  }
  if (!description || description.trim().length < 10) {
    res.status(400).json({ error: 'Descrição deve ter pelo menos 10 caracteres.' });
    return;
  }
  if (!city || !state) {
    res.status(400).json({ error: 'Cidade e estado são obrigatórios.' });
    return;
  }

  const existing = getProviderProfile(userId);
  if (existing) {
    res.status(409).json({ error: 'Você já possui um perfil de prestador.' });
    return;
  }

  try {
    const providerId = createProviderProfile(userId, {
      category_id: category_id.trim(),
      description: description.trim(),
      city: city.trim(),
      state: state.trim(),
    });

    deleteWizardState(userId);

    const profile = getProviderProfile(userId);

    res.status(201).json({
      message: 'Cadastro concluído com sucesso! Seu perfil já está visível nas buscas.',
      profile: {
        id: profile.id,
        description: profile.description,
        categoryId: profile.category_id,
        city: profile.city,
        state: profile.state,
        rating: profile.rating,
        reviewCount: profile.review_count,
        active: !!profile.active,
      },
    });
  } catch (err: any) {
    console.error('Erro ao criar perfil:', err);
    res.status(500).json({ error: 'Erro ao finalizar cadastro.' });
  }
});

/**
 * GET /api/providers/me
 * Returns the authenticated provider's profile.
 */
router.get('/me', (req: Request, res: Response) => {
  const userId = req.user!.id;

  const profile = getProviderProfile(userId);
  if (!profile) {
    res.status(404).json({ error: 'Perfil de prestador não encontrado.' });
    return;
  }

  res.json({
    id: profile.id,
    categoryId: profile.category_id,
    description: profile.description,
    city: profile.city,
    state: profile.state,
    rating: profile.rating,
    reviewCount: profile.review_count,
    latitude: profile.latitude,
    longitude: profile.longitude,
    active: !!profile.active,
    createdAt: profile.created_at,
  });
});

export default router;
