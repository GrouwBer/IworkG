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
    token TEXT UNIQUE NOT NULL,
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
    raio_atuacao_km INTEGER NOT NULL DEFAULT 15,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );
`);

// ── Migration: add raio_atuacao_km if column doesn't exist ──
const hasRaioColumn = db.prepare(
  "SELECT COUNT(*) as cnt FROM pragma_table_info('provider_profiles') WHERE name = 'raio_atuacao_km'"
).get() as { cnt: number };

if (!hasRaioColumn.cnt) {
  db.exec(`ALTER TABLE provider_profiles ADD COLUMN raio_atuacao_km INTEGER DEFAULT 15`);
  db.exec(`UPDATE provider_profiles SET raio_atuacao_km = 15 WHERE raio_atuacao_km IS NULL`);
}

// ── Service Requests (issue #15) ──
db.exec(`
  CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT,
    city TEXT,
    state TEXT,
    latitude REAL,
    longitude REAL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS interests (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(request_id, provider_id),
    FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS contact_history (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    contact_type TEXT NOT NULL DEFAULT 'direct',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(client_id, provider_id),
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
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

  let sql = `
    SELECT 
      u.id, u.name, u.avatar_url, u.phone,
      pp.description, pp.rating, pp.review_count,
      pp.latitude, pp.longitude, pp.city, pp.state,
      c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
    JOIN categories c ON c.id = pp.category_id
    WHERE pp.active = 1
  `;

  const params: any[] = [];

  if (category_id) {
    sql += ' AND pp.category_id = ?';
    params.push(category_id);
  }

  if (query) {
    sql += ' AND (u.name LIKE ? OR pp.description LIKE ?)';
    const like = `%${query}%`;
    params.push(like, like);
  }

  if (lat !== undefined && lng !== undefined) {
    // Simplified proximity: squared Euclidean (good enough for < 100km)
    sql += ` ORDER BY (
      (pp.latitude - ?) * (pp.latitude - ?) + (pp.longitude - ?) * (pp.longitude - ?)
    ) ASC`;
    params.push(lat, lat, lng, lng);
  } else {
    sql += ' ORDER BY pp.rating DESC, pp.review_count DESC';
  }

  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
}

// ── Helper: get provider profile by user ID ──
export interface ProviderProfile {
  id: string;
  user_id: string;
  category_id: string;
  description: string | null;
  rating: number;
  review_count: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  active: number;
  raio_atuacao_km: number;
  created_at: string;
  updated_at: string;
}

export function getProviderProfileByUserId(userId: string): ProviderProfile | undefined {
  return db.prepare(
    'SELECT * FROM provider_profiles WHERE user_id = ?'
  ).get(userId) as ProviderProfile | undefined;
}

// ── Helper: update provider raio de atuação ──
export function updateProviderRaioAtuacao(userId: string, raioKm: number): ProviderProfile | null {
  const validValues = [5, 10, 15, 20, 30, 50];
  if (!validValues.includes(raioKm)) return null;

  db.prepare(
    'UPDATE provider_profiles SET raio_atuacao_km = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
  ).run(raioKm, userId);

  return getProviderProfileByUserId(userId) || null;
}

// ── Helper: toggle provider active status ──
export function toggleProviderStatus(userId: string): { active: boolean } | null {
  const profile = getProviderProfileByUserId(userId);
  if (!profile) return null;

  const newActive = profile.active === 1 ? 0 : 1;
  db.prepare(
    'UPDATE provider_profiles SET active = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
  ).run(newActive, userId);

  return { active: newActive === 1 };
}

export default db;
