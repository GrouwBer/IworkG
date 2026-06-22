import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', 'data', 'iworkg.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db: Database.Database = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Users & Auth tables (from issue #3) ──
db.exec(`
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

  -- Indexes for fast lookups
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(token_jti);
  CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
  CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_jti ON blacklisted_tokens(token_jti);
  CREATE INDEX IF NOT EXISTS idx_provider_profiles_category ON provider_profiles(category_id);
  CREATE INDEX IF NOT EXISTS idx_provider_profiles_active ON provider_profiles(active);
`);

// ── Categories (issue #9) ──
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT '🔧',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Provider profiles (issue #9) ──
db.exec(`
  CREATE TABLE IF NOT EXISTS provider_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    category_id TEXT NOT NULL,
    description TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    latitude REAL,
    longitude REAL,
    city TEXT,
    state TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );
`);

// ── Seed categories ──
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

// ── Helper: get all categories ──
export function getAllCategories() {
  return db.prepare('SELECT id, name, slug, icon FROM categories ORDER BY name').all();
}

// ── Helper: search providers ──
export interface SearchFilters {
  category_id?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  query?: string;
  limit?: number;
  offset?: number;
}

export function searchProviders(filters: SearchFilters = {}) {
  const {
    category_id,
    lat,
    lng,
    query,
    limit = 20,
    offset = 0,
  } = filters;

  const { whereClause, params: whereParams } = buildSearchWhere(filters);

  const sql = `
    SELECT 
      u.id, u.name, u.avatar_url,
      pp.description, pp.rating, pp.review_count,
      pp.latitude, pp.longitude, pp.city, pp.state,
      c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
    JOIN categories c ON c.id = pp.category_id
    WHERE pp.active = 1${whereClause}`;

  let orderBy: string;
  const orderParams: any[] = [];

  if (lat !== undefined && lng !== undefined) {
    // Simplified proximity: squared Euclidean (good enough for < 100km)
    orderBy = ` ORDER BY (
      (pp.latitude - ?) * (pp.latitude - ?) + (pp.longitude - ?) * (pp.longitude - ?)
    ) ASC`;
    orderParams.push(lat, lat, lng, lng);
  } else {
    orderBy = ' ORDER BY pp.rating DESC, pp.review_count DESC';
  }

  const finalSql = sql + orderBy + ' LIMIT ? OFFSET ?';
  const allParams = [...whereParams, ...orderParams, limit, offset];

  return db.prepare(finalSql).all(...allParams);
}

/**
 * Count total providers matching search filters (for pagination).
 */
export function countProviders(filters: SearchFilters = {}): number {
  const { whereClause, params } = buildSearchWhere(filters);

  const sql = `
    SELECT COUNT(*) as total
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
    WHERE pp.active = 1${whereClause}`;

  const row = db.prepare(sql).get(...params) as any;
  return row.total;
}

function buildSearchWhere(filters: SearchFilters): { whereClause: string; params: any[] } {
  const { category_id, query } = filters;
  const params: any[] = [];
  let whereClause = '';

  if (category_id) {
    whereClause += ' AND pp.category_id = ?';
    params.push(category_id);
  }

  if (query) {
    whereClause += ' AND (u.name LIKE ? OR pp.description LIKE ?)';
    const like = `%${query}%`;
    params.push(like, like);
  }

  return { whereClause, params };
}

export default db;
