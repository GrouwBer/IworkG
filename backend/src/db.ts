import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// ── Row type interfaces ──

export interface UserRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  google_id: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface WizardRow {
  id: string;
  user_id: string;
  current_step: number;
  step_data: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderRow {
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
  experience_years: number;
  service_radius_km: number;
  address: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioPhotoRow {
  id: string;
  provider_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  tag: string;
  sort_order: number;
  created_at: string;
}

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
    deleted_at TEXT,
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

  CREATE TABLE IF NOT EXISTS recovery_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migration: add deleted_at for existing databases
try {
  db.exec(`ALTER TABLE users ADD COLUMN deleted_at TEXT`);
} catch {
  // Column already exists — ignore
}

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
    experience_years INTEGER NOT NULL DEFAULT 0,
    service_radius_km REAL NOT NULL DEFAULT 10,
    address TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );
`);

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

  -- Provider wizard state (temporary, issue #5)
  CREATE TABLE IF NOT EXISTS provider_wizard_state (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    current_step INTEGER NOT NULL DEFAULT 1,
    step_data TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Provider categories (many-to-many, issue #5)
  CREATE TABLE IF NOT EXISTS provider_categories (
    provider_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (provider_id, category_id),
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  -- Portfolio photos (issue #6)
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
`);

// ── Migrations (safe ALTER TABLE for existing databases) ──
try { db.exec("ALTER TABLE users ADD COLUMN deleted_at TEXT"); } catch {}
try { db.exec("ALTER TABLE otp_codes ADD COLUMN identifier_type TEXT DEFAULT 'phone'"); } catch {}
try { db.exec("ALTER TABLE provider_profiles ADD COLUMN experience_years INTEGER NOT NULL DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE provider_profiles ADD COLUMN service_radius_km REAL NOT NULL DEFAULT 10"); } catch {}
try { db.exec("ALTER TABLE provider_profiles ADD COLUMN address TEXT NOT NULL DEFAULT ''"); } catch {}

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



// ═══════════════════════════════════════════
// PROVIDER PROFILES
// ═══════════════════════════════════════════

export function getProviderProfile(userId: string): ProviderRow | undefined {
  return db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(userId) as ProviderRow | undefined;
}

export function createProviderProfile(userId: string, data: {
  category_id: string;
  description: string;
  city: string;
  state: string;
  experience_years?: number;
  service_radius_km?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
}): string {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO provider_profiles (id, user_id, category_id, description, rating, review_count, city, state, experience_years, service_radius_km, address, latitude, longitude, active)
    VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, userId, data.category_id, data.description, data.city, data.state,
    data.experience_years || 0, data.service_radius_km || 10, data.address || '',
    data.latitude || null, data.longitude || null);
  // Promote user to provider role
  db.prepare("UPDATE users SET role = 'provider', updated_at = datetime('now') WHERE id = ?").run(userId);
  return id;
}

// ═══════════════════════════════════════════
// PROVIDER CATEGORIES (many-to-many)
// ═══════════════════════════════════════════

export function setProviderCategories(providerId: string, categoryIds: string[]) {
  const del = db.prepare('DELETE FROM provider_categories WHERE provider_id = ?');
  const ins = db.prepare('INSERT OR IGNORE INTO provider_categories (provider_id, category_id) VALUES (?, ?)');
  const tx = db.transaction(() => {
    del.run(providerId);
    for (const catId of categoryIds) ins.run(providerId, catId);
  });
  tx();
}

export function getProviderCategories(providerId: string) {
  return db.prepare(`
    SELECT c.id, c.name, c.slug, c.icon
    FROM provider_categories pc
    JOIN categories c ON c.id = pc.category_id
    WHERE pc.provider_id = ?
    ORDER BY c.name
  `).all(providerId);
}

// ═══════════════════════════════════════════
// PORTFOLIO PHOTOS (issue #6)
// ═══════════════════════════════════════════

export function addPortfolioPhoto(providerId: string, data: {
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  tag: string;
}): PortfolioPhotoRow | undefined {
  const id = uuidv4();
  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM portfolio_photos WHERE provider_id = ?'
  ).get(providerId) as { next_order: number };
  db.prepare(`
    INSERT INTO portfolio_photos (id, provider_id, filename, original_name, mime_type, size_bytes, tag, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, providerId, data.filename, data.original_name, data.mime_type, data.size_bytes, data.tag, maxOrder.next_order);
  return getPortfolioPhoto(id);
}

export function getPortfolioPhotos(providerId: string): PortfolioPhotoRow[] {
  return db.prepare(
    'SELECT * FROM portfolio_photos WHERE provider_id = ? ORDER BY sort_order ASC, created_at DESC'
  ).all(providerId) as PortfolioPhotoRow[];
}

export function getPortfolioPhoto(photoId: string): PortfolioPhotoRow | undefined {
  return db.prepare('SELECT * FROM portfolio_photos WHERE id = ?').get(photoId) as PortfolioPhotoRow | undefined;
}

export function deletePortfolioPhoto(photoId: string) {
  db.prepare('DELETE FROM portfolio_photos WHERE id = ?').run(photoId);
}

export function countPortfolioPhotos(providerId: string): number {
  const row = db.prepare(
    'SELECT COUNT(*) as total FROM portfolio_photos WHERE provider_id = ?'
  ).get(providerId) as { total: number };
  return row.total;
}

// ═══════════════════════════════════════════
// PROVIDER WIZARD (issue #5)
// ═══════════════════════════════════════════

export function getWizardState(userId: string): WizardRow | undefined {
  return db.prepare('SELECT * FROM provider_wizard_state WHERE user_id = ?').get(userId) as WizardRow | undefined;
}

export function createWizardState(userId: string): WizardRow | undefined {
  const id = uuidv4();
  db.prepare(
    'INSERT INTO provider_wizard_state (id, user_id, current_step, step_data) VALUES (?, ?, 1, ?)'
  ).run(id, userId, JSON.stringify({}));
  return getWizardState(userId);
}

export function updateWizardState(userId: string, step: number, data: Record<string, any>): WizardRow | null {
  const existing = getWizardState(userId);
  if (!existing) return null;
  const merged = { ...JSON.parse(existing.step_data), ...data };
  db.prepare(
    "UPDATE provider_wizard_state SET current_step = ?, step_data = ?, updated_at = datetime('now') WHERE user_id = ?"
  ).run(step, JSON.stringify(merged), userId);
  return getWizardState(userId) ?? null;
}

export function deleteWizardState(userId: string) {
  db.prepare('DELETE FROM provider_wizard_state WHERE user_id = ?').run(userId);
}

export default db;
