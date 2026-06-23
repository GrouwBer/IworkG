import { Router, Request, Response } from 'express';
import { getAllCategories, searchProviders } from '../db';

const router = Router();

/**
 * GET /api/categories
 */
router.get('/categories', (_req: Request, res: Response) => {
  const categories = getAllCategories();
  res.json(categories);
});

/**
 * GET /api/providers/search
 * Query: ?category_id=X&lat=Y&lng=Z&radius_km=R&query=text&limit=20&offset=0
 */
router.get('/providers/search', async (req: Request, res: Response) => {
  const {
    category_id,
    lat,
    lng,
    radius_km,
    query,
    limit,
    offset,
  } = req.query;

  const filters: any = {};

  if (category_id && typeof category_id === 'string') filters.category_id = category_id;
  if (lat && typeof lat === 'string') filters.lat = parseFloat(lat);
  if (lng && typeof lng === 'string') filters.lng = parseFloat(lng);
  if (radius_km && typeof radius_km === 'string') filters.radius_km = parseFloat(radius_km);
  if (query && typeof query === 'string') filters.query = query;
  if (limit && typeof limit === 'string') filters.limit = Math.min(parseInt(limit, 10) || 20, 100);
  if (offset && typeof offset === 'string') filters.offset = parseInt(offset, 10) || 0;

  try {
    const { results, total } = searchProviders(filters);

    res.json({
      results: results.map((row: any) => ({
        id: row.id,
        name: row.name,
        avatarUrl: row.avatar_url,
        description: row.description,
        rating: row.rating,
        reviewCount: row.review_count,
        experienceYears: row.experience_years,
        serviceRadiusKm: row.service_radius_km,
        latitude: row.latitude,
        longitude: row.longitude,
        city: row.city,
        state: row.state,
        distanceKm: row.distance_km != null ? Math.round(row.distance_km * 10) / 10 : undefined,
        score: row.score != null ? Math.round(row.score * 100) / 100 : undefined,
        category: {
          name: (row.category_names || '').split(',')[0] || '',
          slug: (row.category_slugs || '').split(',')[0] || '',
          icon: (row.category_icons || '').split(',')[0] || '',
        },
      })),
      pagination: {
        total,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
      },
      filters: {
        category_id: filters.category_id || null,
        lat: filters.lat || null,
        lng: filters.lng || null,
        radius_km: filters.radius_km || null,
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Erro ao buscar prestadores.' });
  }
});

export default router;
