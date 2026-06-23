import { Router, Request, Response } from 'express';
import { getAllCategories, searchProviders } from '../db';

const router = Router();

/**
 * GET /api/categories
 * Returns all service categories.
 */
router.get('/categories', (_req: Request, res: Response) => {
  const categories = getAllCategories();
  res.json(categories);
});

/**
 * GET /api/providers/search
 * Query params: ?category_id=X&lat=Y&lng=Z&query=text&limit=20&offset=0
 */
router.get('/providers/search', (req: Request, res: Response) => {
  const {
    category_id,
    lat,
    lng,
    query,
    limit,
    offset,
  } = req.query;

  const filters: any = {};

  if (category_id && typeof category_id === 'string') {
    filters.category_id = category_id;
  }
  if (lat && typeof lat === 'string') {
    filters.lat = parseFloat(lat);
  }
  if (lng && typeof lng === 'string') {
    filters.lng = parseFloat(lng);
  }
  if (query && typeof query === 'string') {
    filters.query = query;
  }
  if (limit && typeof limit === 'string') {
    filters.limit = Math.min(parseInt(limit, 10) || 20, 100);
  }
  if (offset && typeof offset === 'string') {
    filters.offset = parseInt(offset, 10) || 0;
  }

  try {
    const results = searchProviders(filters);

    res.json({
      results: results.map((row: any) => ({
        id: row.id,
        name: row.name,
        avatarUrl: row.avatar_url,
        description: row.description,
        rating: row.rating,
        reviewCount: row.review_count,
        latitude: row.latitude,
        longitude: row.longitude,
        city: row.city,
        state: row.state,
        active: row.active === 1,
        category: {
          name: row.category_name,
          slug: row.category_slug,
          icon: row.category_icon,
        },
      })),
      filters: {
        category_id: filters.category_id || null,
        lat: filters.lat || null,
        lng: filters.lng || null,
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Erro ao buscar prestadores.' });
  }
});

export default router;
