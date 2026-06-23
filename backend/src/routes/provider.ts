import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';
import db, {
  getWizardState, createWizardState, updateWizardState, deleteWizardState,
  getProviderProfile, createProviderProfile, setProviderCategories, getProviderCategories, getAllCategories,
  addPortfolioPhoto, getPortfolioPhotos, getPortfolioPhoto, deletePortfolioPhoto, countPortfolioPhotos,
  getProviderReviews, getClientReviewForContact, createReview, hasClientContactedProvider,
} from '../db';
import { processAndSaveImage, deleteImageFile } from '../services/image';

const router = Router();
router.use(requireAuth);

// Multer: 6MB limit (1MB margin over our 5MB application-level check —
// real enforcement happens in processAndSaveImage via magic byte + size validation)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 1 } });

// ═══════════════════════════════════════════════
// Wizard endpoints (issue #5)
// ═══════════════════════════════════════════════

router.get('/wizard', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = db.prepare('SELECT name, phone, email FROM users WHERE id = ?').get(userId) as any;
  let wizard = getWizardState(userId);
  if (!wizard) wizard = createWizardState(userId);
  res.json({
    currentStep: wizard.current_step,
    stepData: JSON.parse(wizard.step_data || '{}'),
    prefill: { name: user?.name || '', phone: user?.phone || '', email: user?.email || '' },
    categories: getAllCategories(),
  });
});

router.put('/wizard', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { step, data } = req.body;
  if (!step || !data) { res.status(400).json({ error: 'Step e data são obrigatórios.' }); return; }
  let wizard = getWizardState(userId);
  if (!wizard) wizard = createWizardState(userId);
  const updated = updateWizardState(userId, step, data);
  res.json({ currentStep: updated.current_step, stepData: JSON.parse(updated.step_data), message: 'Progresso salvo.' });
});

router.post('/wizard/complete', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { categories, description, experience_years, service_radius_km, address, city, state } = req.body;
  if (!categories || !Array.isArray(categories) || categories.length === 0) { res.status(400).json({ error: 'Selecione pelo menos uma categoria.' }); return; }
  if (!description || description.trim().length < 10) { res.status(400).json({ error: 'Descrição deve ter pelo menos 10 caracteres.' }); return; }
  if (!address || !city || !state) { res.status(400).json({ error: 'Endereço, cidade e estado são obrigatórios.' }); return; }
  if (getProviderProfile(userId)) { res.status(409).json({ error: 'Você já possui um perfil de prestador.' }); return; }

  try {
    const providerId = createProviderProfile(userId, {
      category_id: categories[0], description: description.trim(),
      experience_years: parseInt(experience_years) || 0,
      service_radius_km: parseFloat(service_radius_km) || 10,
      address: address.trim(), city: city.trim(), state: state.trim(),
    });
    setProviderCategories(providerId, categories);
    deleteWizardState(userId);
    const profile = getProviderProfile(userId);
    res.status(201).json({
      message: 'Cadastro concluído! Seu perfil já está visível nas buscas.',
      profile: { id: profile.id, description: profile.description, experienceYears: profile.experience_years || 0, serviceRadiusKm: profile.service_radius_km || 10, address: profile.address || '', city: profile.city, state: profile.state, active: !!profile.active, categories: getProviderCategories(providerId) },
    });
  } catch (err: any) { res.status(500).json({ error: 'Erro ao finalizar cadastro.' }); }
});

router.get('/me', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const profile = getProviderProfile(userId);
  if (!profile) { res.status(404).json({ error: 'Perfil de prestador não encontrado.' }); return; }
  res.json({
    id: profile.id, description: profile.description,
    experienceYears: profile.experience_years || 0,
    serviceRadiusKm: profile.service_radius_km || 10,
    address: profile.address || '', city: profile.city, state: profile.state,
    rating: profile.rating, reviewCount: profile.review_count, active: !!profile.active,
    categories: getProviderCategories(profile.id), createdAt: profile.created_at,
  });
});

// ═══════════════════════════════════════════════
// Portfolio endpoints (issue #6)
// ═══════════════════════════════════════════════

router.post('/portfolio/upload', upload.single('photo'), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const tag = (req.query.tag as string) || 'Geral';
  if (!['Antes', 'Depois', 'Geral'].includes(tag)) { res.status(400).json({ error: 'Tag inválida. Use: Antes, Depois ou Geral.' }); return; }
  if (!req.file) { res.status(400).json({ error: 'Nenhuma foto enviada.' }); return; }
  const profile = getProviderProfile(userId);
  if (!profile) { res.status(404).json({ error: 'Perfil de prestador não encontrado.' }); return; }
  if (countPortfolioPhotos(profile.id) >= 10) { res.status(400).json({ error: 'Limite de 10 fotos atingido.' }); return; }

  try {
    const result = await processAndSaveImage(req.file.buffer, req.file.originalname, profile.id);
    const photo = addPortfolioPhoto(profile.id, { filename: result.filename, original_name: result.originalName, mime_type: result.mimeType, size_bytes: result.sizeBytes, tag });
    res.status(201).json({ id: photo.id, tag: photo.tag, mimeType: photo.mime_type, sizeBytes: photo.size_bytes, originalName: photo.original_name, url: `/uploads/portfolio/${photo.filename}`, createdAt: photo.created_at, sortOrder: photo.sort_order });
  } catch (err: any) { res.status(400).json({ error: err.message || 'Erro ao processar imagem.' }); }
});

router.get('/:id/portfolio', (req: Request, res: Response) => {
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE id = ?').get(req.params.id) as any;
  if (!profile) { res.status(404).json({ error: 'Perfil não encontrado.' }); return; }
  const photos = getPortfolioPhotos(req.params.id as string);
  res.json({ providerId: req.params.id, photos: photos.map((p: any) => ({ id: p.id, tag: p.tag, mimeType: p.mime_type, sizeBytes: p.size_bytes, originalName: p.original_name, url: `/uploads/portfolio/${p.filename}`, createdAt: p.created_at, sortOrder: p.sort_order })) });
});

router.delete('/portfolio/:photoId', (req: Request, res: Response) => {
  const photo = getPortfolioPhoto(req.params.photoId as string);
  if (!photo) { res.status(404).json({ error: 'Foto não encontrada.' }); return; }
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE id = ? AND user_id = ?').get(photo.provider_id, req.user!.id) as any;
  if (!profile) { res.status(403).json({ error: 'Você não tem permissão para excluir esta foto.' }); return; }
  deleteImageFile(photo.filename);
  deletePortfolioPhoto(req.params.photoId as string);
  res.json({ message: 'Foto excluída com sucesso.' });
});

router.get('/me/portfolio', (req: Request, res: Response) => {
  const profile = getProviderProfile(req.user!.id);
  if (!profile) { res.status(404).json({ error: 'Perfil de prestador não encontrado.' }); return; }
  const photos = getPortfolioPhotos(profile.id);
  res.json({ providerId: profile.id, photos: photos.map((p: any) => ({ id: p.id, tag: p.tag, mimeType: p.mime_type, sizeBytes: p.size_bytes, originalName: p.original_name, url: `/uploads/portfolio/${p.filename}`, createdAt: p.created_at, sortOrder: p.sort_order })) });
});

// ═══════════════════════════════════════════════
// Review endpoints (issue #17)
// ═══════════════════════════════════════════════

/** POST /api/providers/:userId/reviews — Create a review */
router.post('/:userId/reviews', (req: Request, res: Response) => {
  const clientId = req.user!.id;
  const { rating, comment, contactId } = req.body;

  // Resolve userId → provider_profile
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(req.params.userId as string) as any;
  if (!profile) { res.status(404).json({ error: 'Prestador não encontrado.' }); return; }
  const providerId = profile.id;

  // Validate
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Nota deve ser entre 1 e 5.' }); return;
  }
  if (comment && comment.length > 300) {
    res.status(400).json({ error: 'Comentário deve ter no máximo 300 caracteres.' }); return;
  }

  // Rule: must have contacted the provider (contact_history uses user IDs)
  if (!hasClientContactedProvider(clientId, profile.user_id)) {
    res.status(403).json({ error: 'Você precisa ter contatado este prestador antes de avaliar.' }); return;
  }

  // Rule: one review per contact
  if (contactId) {
    const existing = getClientReviewForContact(clientId, contactId);
    if (existing) { res.status(409).json({ error: 'Você já avaliou este contato.' }); return; }
  }

  // Rule: can't review yourself
  if (profile.user_id === clientId) {
    res.status(403).json({ error: 'Você não pode avaliar a si mesmo.' }); return;
  }

  try {
    const review = createReview({ clientId, providerId, contactId, rating, comment });
    res.status(201).json({
      id: (review as any).id,
      rating: (review as any).rating,
      comment: (review as any).comment,
      createdAt: (review as any).created_at,
    });
  } catch (err: any) { res.status(500).json({ error: 'Erro ao salvar avaliação.' }); }
});

/** GET /api/providers/:userId/reviews — List reviews for a provider */
router.get('/:userId/reviews', (req: Request, res: Response) => {
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(req.params.userId as string) as any;
  if (!profile) { res.status(404).json({ error: 'Prestador não encontrado.' }); return; }

  const reviews = getProviderReviews(profile.id);
  res.json((reviews as any[]).map((r: any) => ({
    id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at,
    client: { id: r.client_id, name: r.client_name, avatarUrl: r.client_avatar },
  })));
});

export default router;
