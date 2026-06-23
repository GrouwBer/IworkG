import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'data', 'iworkg.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db: Database.Database = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ═══════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════

db.exec(`
  -- Users & Auth
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    avatar_url TEXT,
    google_id TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'client',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_jti TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id TEXT PRIMARY KEY,
    token_jti TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Categories
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT '🔧',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Provider profiles
  CREATE TABLE IF NOT EXISTS provider_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    description TEXT,
    experience_years INTEGER DEFAULT 0,
    service_radius_km REAL DEFAULT 10,
    address TEXT,
    city TEXT,
    state TEXT,
    latitude REAL,
    longitude REAL,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Provider Categories (N:M)
  CREATE TABLE IF NOT EXISTS provider_categories (
    provider_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (provider_id, category_id),
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  -- Reviews
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    reviewer_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    response TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
  );

  -- Service requests
  CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    urgency TEXT NOT NULL DEFAULT 'media',
    status TEXT NOT NULL DEFAULT 'aberto',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  -- Interests
  CREATE TABLE IF NOT EXISTS interests (
    id TEXT PRIMARY KEY,
    service_request_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
    UNIQUE(service_request_id, provider_id)
  );

  -- Reports
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reported_provider_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
  );

  -- Portfolio photos
  CREATE TABLE IF NOT EXISTS portfolio_photos (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    tag TEXT NOT NULL DEFAULT 'Geral',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
  );

  -- Favorites (N:M)
  CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    PRIMARY KEY (user_id, provider_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
  );

  -- Contact history
  CREATE TABLE IF NOT EXISTS contact_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(token_jti);
  CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
  CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_jti ON blacklisted_tokens(token_jti);
  CREATE INDEX IF NOT EXISTS idx_provider_profiles_active ON provider_profiles(active);
  CREATE INDEX IF NOT EXISTS idx_provider_profiles_location ON provider_profiles(latitude, longitude);
  CREATE INDEX IF NOT EXISTS idx_provider_categories_category ON provider_categories(category_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
  CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
  CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
  CREATE INDEX IF NOT EXISTS idx_interests_service ON interests(service_request_id);
  CREATE INDEX IF NOT EXISTS idx_interests_provider ON interests(provider_id);
  CREATE INDEX IF NOT EXISTS idx_portfolio_photos_provider ON portfolio_photos(provider_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_contact_history_user ON contact_history(user_id);
`);

// ═══════════════════════════════════════════
// SEED
// ═══════════════════════════════════════════

const seedCategories = [
  { id: 'cat-eletricista', name: 'Eletricista', slug: 'eletricista', icon: '⚡' },
  { id: 'cat-pedreiro', name: 'Pedreiro', slug: 'pedreiro', icon: '🧱' },
  { id: 'cat-encanador', name: 'Encanador', slug: 'encanador', icon: '🔧' },
  { id: 'cat-pintor', name: 'Pintor', slug: 'pintor', icon: '🎨' },
  { id: 'cat-marceneiro', name: 'Marceneiro', slug: 'marceneiro', icon: '🪚' },
  { id: 'cat-jardineiro', name: 'Jardineiro', slug: 'jardineiro', icon: '🌿' },
  { id: 'cat-faxineiro', name: 'Faxineiro(a)', slug: 'faxineiro', icon: '🧹' },
  { id: 'cat-mecanico', name: 'Mecânico', slug: 'mecanico', icon: '🔩' },
  { id: 'cat-tecnico-refrigeracao', name: 'Téc. Refrigeração', slug: 'tecnico-refrigeracao', icon: '❄️' },
  { id: 'cat-chaveiro', name: 'Chaveiro', slug: 'chaveiro', icon: '🔑' },
  { id: 'cat-montador', name: 'Montador de Móveis', slug: 'montador', icon: '🪑' },
  { id: 'cat-diarista', name: 'Diarista', slug: 'diarista', icon: '🏠' },
];

const insertCat = db.prepare(
  'INSERT OR IGNORE INTO categories (id, name, slug, icon) VALUES (?, ?, ?, ?)'
);
for (const cat of seedCategories) {
  insertCat.run(cat.id, cat.name, cat.slug, cat.icon);
}

// ═══════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════

export function getAllCategories() {
  return db.prepare('SELECT id, name, slug, icon FROM categories ORDER BY name').all();
}

// ═══════════════════════════════════════════
// PROVIDER PROFILES
// ═══════════════════════════════════════════

export function getProviderProfile(userId: string) {
  return db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(userId) as any;
}

export function getProviderProfileById(providerId: string) {
  return db.prepare('SELECT * FROM provider_profiles WHERE id = ?').get(providerId) as any;
}

export function createProviderProfile(userId: string, data: {
  description: string;
  experience_years: number;
  service_radius_km: number;
  address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}) {
  const id = uuidv4();

  db.prepare(`
    INSERT INTO provider_profiles (id, user_id, description, experience_years, service_radius_km, address, city, state, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, data.description, data.experience_years, data.service_radius_km,
    data.address, data.city, data.state, data.latitude || null, data.longitude || null);

  db.prepare("UPDATE users SET role = 'provider', updated_at = datetime('now') WHERE id = ?").run(userId);

  return id;
}

export function getProviderCategories(providerId: string) {
  return db.prepare(`
    SELECT c.id, c.name, c.slug, c.icon
    FROM provider_categories pc
    JOIN categories c ON c.id = pc.category_id
    WHERE pc.provider_id = ?
  `).all(providerId);
}

export function setProviderCategories(providerId: string, categoryIds: string[]) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO provider_categories (provider_id, category_id) VALUES (?, ?)'
  );
  for (const catId of categoryIds) {
    insert.run(providerId, catId);
  }
}

// ═══════════════════════════════════════════
// SEARCH (Haversine + paginated)
// ═══════════════════════════════════════════

export interface SearchFilters {
  category_id?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  query?: string;
  limit?: number;
  offset?: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function searchProviders(filters: SearchFilters = {}) {
  const {
    category_id,
    lat,
    lng,
    radius_km,
    query,
    limit = 20,
    offset = 0,
  } = filters;

  let sql = `
    SELECT DISTINCT
      pp.id, u.name, u.avatar_url,
      pp.description, pp.rating, pp.review_count,
      pp.latitude, pp.longitude, pp.city, pp.state,
      pp.experience_years, pp.service_radius_km
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
    LEFT JOIN provider_categories pc ON pc.provider_id = pp.id
    WHERE pp.active = 1
  `;

  const params: any[] = [];

  if (category_id) {
    sql += ' AND pc.category_id = ?';
    params.push(category_id);
  }

  if (query) {
    sql += ' AND (u.name LIKE ? OR pp.description LIKE ?)';
    const like = '%' + query + '%';
    params.push(like, like);
  }

  sql += ' ORDER BY pp.rating DESC, pp.review_count DESC';

  const rows = db.prepare(sql).all(...params) as any[];

  // Post-process: Haversine + radius filter + Bayesian score
  let results = rows.map((row: any) => {
    let distance_km: number | undefined;
    if (lat !== undefined && lng !== undefined && row.latitude != null && row.longitude != null) {
      distance_km = haversineKm(lat, lng, row.latitude, row.longitude);
    }

    const avgRating = row.rating || 0;
    const reviewCount = row.review_count || 0;
    const C = 10;
    const bayesianRating = (avgRating * reviewCount + 3.5 * C) / (reviewCount + C);

    let score: number;
    if (distance_km !== undefined) {
      const distanceScore = Math.max(0, 1 - distance_km / (filters.radius_km || 50));
      score = bayesianRating * 0.6 + distanceScore * 5 * 0.4;
    } else {
      score = bayesianRating;
    }

    return { ...row, distance_km, score };
  });

  if (radius_km !== undefined) {
    results = results.filter((r: any) => r.distance_km === undefined || r.distance_km <= radius_km);
  }

  if (lat !== undefined && lng !== undefined) {
    results.sort((a: any, b: any) => b.score - a.score);
  }

  const total = results.length;
  results = results.slice(offset, offset + limit);

  return { results, total };
}

export function countProviders(filters: SearchFilters = {}): number {
  const { total } = searchProviders({ ...filters, limit: 100000, offset: 0 });
  return total;
}

// ═══════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════

export function getProviderReviews(providerId: string) {
  return db.prepare(`
    SELECT r.*, u.name as reviewer_name
    FROM reviews r
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.provider_id = ?
    ORDER BY r.created_at DESC
  `).all(providerId);
}

export function createReview(reviewerId: string, providerId: string, rating: number, comment: string | null) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO reviews (id, reviewer_id, provider_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, reviewerId, providerId, rating, comment || null);

  const stats = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as count
    FROM reviews WHERE provider_id = ?
  `).get(providerId) as any;

  db.prepare(`
    UPDATE provider_profiles SET rating = ?, review_count = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(stats.avg_rating || 0, stats.count, providerId);

  return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
}

// ═══════════════════════════════════════════
// SERVICE REQUESTS
// ═══════════════════════════════════════════

export function createServiceRequest(clientId: string, data: {
  category_id: string;
  description: string;
  photo_url?: string;
  urgency?: string;
  latitude: number;
  longitude: number;
}) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO service_requests (id, client_id, category_id, description, photo_url, urgency, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, clientId, data.category_id, data.description, data.photo_url || null,
    data.urgency || 'media', data.latitude, data.longitude);

  return db.prepare('SELECT * FROM service_requests WHERE id = ?').get(id);
}

export function getServiceRequests(filters: { category_id?: string; status?: string; limit?: number; offset?: number } = {}) {
  const { category_id, status, limit = 20, offset = 0 } = filters;
  let sql = `
    SELECT sr.*, c.name as category_name, c.icon as category_icon, u.name as client_name,
      (SELECT COUNT(*) FROM interests WHERE service_request_id = sr.id) as interest_count
    FROM service_requests sr
    JOIN categories c ON c.id = sr.category_id
    JOIN users u ON u.id = sr.client_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (category_id) { sql += ' AND sr.category_id = ?'; params.push(category_id); }
  if (status) { sql += ' AND sr.status = ?'; params.push(status); }

  sql += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
}

// ═══════════════════════════════════════════
// INTERESTS
// ═══════════════════════════════════════════

export function expressInterest(providerId: string, serviceRequestId: string) {
  const id = uuidv4();
  db.prepare(`
    INSERT OR IGNORE INTO interests (id, service_request_id, provider_id)
    VALUES (?, ?, ?)
  `).run(id, serviceRequestId, providerId);
  return db.prepare('SELECT * FROM interests WHERE id = ?').get(id);
}

export function getServiceInterests(serviceRequestId: string) {
  return db.prepare(`
    SELECT i.*, u.name as provider_name
    FROM interests i
    JOIN provider_profiles pp ON pp.id = i.provider_id
    JOIN users u ON u.id = pp.user_id
    WHERE i.service_request_id = ?
  `).all(serviceRequestId);
}

// ═══════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════

export function createReport(reporterId: string, data: {
  reported_provider_id: string;
  reason: string;
  description?: string;
}) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO reports (id, reporter_id, reported_provider_id, reason, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, reporterId, data.reported_provider_id, data.reason, data.description || null);
  return db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
}

// ═══════════════════════════════════════════
// PORTFOLIO
// ═══════════════════════════════════════════

export function addPortfolioPhoto(providerId: string, data: {
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  tag: string;
}) {
  const id = uuidv4();
  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM portfolio_photos WHERE provider_id = ?'
  ).get(providerId) as any;

  db.prepare(`
    INSERT INTO portfolio_photos (id, provider_id, filename, original_name, mime_type, size_bytes, tag, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, providerId, data.filename, data.original_name, data.mime_type, data.size_bytes, data.tag, maxOrder.max_order + 1);

  return db.prepare('SELECT * FROM portfolio_photos WHERE id = ?').get(id);
}

export function getPortfolioPhotos(providerId: string) {
  return db.prepare(
    'SELECT * FROM portfolio_photos WHERE provider_id = ? ORDER BY sort_order ASC, created_at DESC'
  ).all(providerId);
}

export function getPortfolioPhoto(photoId: string) {
  return db.prepare('SELECT * FROM portfolio_photos WHERE id = ?').get(photoId) as any;
}

export function deletePortfolioPhoto(photoId: string) {
  const photo = getPortfolioPhoto(photoId);
  if (!photo) return null;
  db.prepare('DELETE FROM portfolio_photos WHERE id = ?').run(photoId);
  return photo;
}

export function countPortfolioPhotos(providerId: string): number {
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM portfolio_photos WHERE provider_id = ?'
  ).get(providerId) as any;
  return row.count;
}

// ═══════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════

export function toggleFavorite(userId: string, providerId: string): boolean {
  const existing = db.prepare(
    'SELECT * FROM favorites WHERE user_id = ? AND provider_id = ?'
  ).get(userId, providerId);

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND provider_id = ?').run(userId, providerId);
    return false;
  } else {
    db.prepare('INSERT INTO favorites (user_id, provider_id) VALUES (?, ?)').run(userId, providerId);
    return true;
  }
}

export function isFavorited(userId: string, providerId: string): boolean {
  const row = db.prepare(
    'SELECT 1 FROM favorites WHERE user_id = ? AND provider_id = ?'
  ).get(userId, providerId);
  return !!row;
}

export function getUserFavorites(userId: string) {
  return db.prepare(`
    SELECT pp.*, u.name, u.avatar_url, c.name as category_name, c.icon as category_icon
    FROM favorites f
    JOIN provider_profiles pp ON pp.id = f.provider_id
    JOIN users u ON u.id = pp.user_id
    LEFT JOIN provider_categories pc ON pc.provider_id = pp.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE f.user_id = ?
    ORDER BY pp.rating DESC
  `).all(userId);
}

// ═══════════════════════════════════════════
// CONTACT HISTORY
// ═══════════════════════════════════════════

export function recordContact(userId: string, providerId: string) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO contact_history (id, user_id, provider_id) VALUES (?, ?, ?)
  `).run(id, userId, providerId);
  return db.prepare('SELECT * FROM contact_history WHERE id = ?').get(id);
}

export function getContactHistory(userId: string) {
  return db.prepare(`
    SELECT ch.*, u.name as provider_name, c.name as provider_category
    FROM contact_history ch
    JOIN provider_profiles pp ON pp.id = ch.provider_id
    JOIN users u ON u.id = pp.user_id
    LEFT JOIN provider_categories pc ON pc.provider_id = pp.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE ch.user_id = ?
    ORDER BY ch.created_at DESC
  `).all(userId);
}

export default db;
