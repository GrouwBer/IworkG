import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/contacts — List client's contact history (RF013)
 */
router.get('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;

  const contacts = db.prepare(`
    SELECT 
      ch.id as contact_id, ch.contact_type, ch.created_at as contact_date,
      u.id as provider_id, u.name, u.avatar_url,
      pp.description, pp.rating, pp.review_count,
      pp.city, pp.state,
      c.name as category_name, c.icon as category_icon
    FROM contact_history ch
    JOIN users u ON u.id = ch.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id = u.id
    LEFT JOIN categories c ON c.id = pp.category_id
    WHERE ch.client_id = ?
    ORDER BY ch.created_at DESC
  `).all(userId);

  res.json(contacts.map((row: any) => ({
    contactId: row.contact_id,
    contactType: row.contact_type,
    contactDate: row.contact_date,
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
 * POST /api/contacts — Record a contact (client contacted provider)
 * Body: { provider_id: string, contact_type?: 'whatsapp' | 'phone' | 'direct' }
 */
router.post('/', requireAuth, (req: Request, res: Response) => {
  const clientId = req.user!.id;
  const { provider_id, contact_type = 'whatsapp' } = req.body;

  if (!provider_id) {
    res.status(400).json({ error: 'provider_id é obrigatório.' });
    return;
  }

  // Validate contact_type
  const validTypes = ['whatsapp', 'phone', 'direct', 'chat'];
  const type = validTypes.includes(contact_type) ? contact_type : 'whatsapp';

  // Check that provider exists and has phone
  const provider = db.prepare(
    'SELECT id, phone FROM users WHERE id = ? AND role IN (\'provider\', \'admin\')'
  ).get(provider_id) as any;

  if (!provider) {
    res.status(404).json({ error: 'Prestador não encontrado.' });
    return;
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO contact_history (id, client_id, provider_id, contact_type) VALUES (?, ?, ?, ?)'
  ).run(id, clientId, provider_id, type);

  // Increment contact counter on provider profile
  db.prepare(
    "UPDATE provider_profiles SET contact_count = COALESCE(contact_count, 0) + 1 WHERE user_id = ?"
  ).run(provider_id);

  res.status(201).json({
    contactId: id,
    contactType: type,
    providerPhone: provider.phone || null,
    message: 'Contato registrado no histórico.',
  });
});

export default router;
