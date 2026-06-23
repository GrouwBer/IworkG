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
  active: number;
  created_at: string;
  updated_at: string;
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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );
`);

// ── Migrations: columns added post-initial-schema (safe ALTER TABLE)
try { db.exec("ALTER TABLE provider_profiles ADD COLUMN experience_years INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE provider_profiles ADD COLUMN service_radius_km INTEGER DEFAULT 15"); } catch {}
try { db.exec("ALTER TABLE provider_profiles ADD COLUMN address TEXT"); } catch {}

// ── Reviews (issue #17) ──
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    contact_id TEXT,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(client_id, contact_id),
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contact_history(id) ON DELETE SET NULL
  );
`);

// ── Reports (issue #18) ──
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reported_provider_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at TEXT,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
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
`);

// ── Migrations (safe ALTER TABLE for existing databases) ──
try { db.exec("ALTER TABLE users ADD COLUMN deleted_at TEXT"); } catch {}
try { db.exec("ALTER TABLE otp_codes ADD COLUMN identifier_type TEXT DEFAULT 'phone'"); } catch {}
try { db.exec("ALTER TABLE service_requests ADD COLUMN urgency TEXT DEFAULT 'Media'"); } catch {}

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

/** Count total providers matching search filters (for pagination). */
export function countProviders(filters: SearchFilters = {}): number {
  const { category_id, query } = filters;
  const params: any[] = [];
  let where = '';

  if (category_id) {
    where += ' AND pp.category_id = ?';
    params.push(category_id);
  }
  if (query) {
    where += ' AND (u.name LIKE ? OR pp.description LIKE ?)';
    const like = `%${query}%`;
    params.push(like, like);
  }

  const row = db.prepare(`
    SELECT COUNT(*) as total
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
    WHERE pp.active = 1${where}
  `).get(...params) as { total: number };
  return row.total;
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
  latitude?: number;
  longitude?: number;
}): string {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO provider_profiles (id, user_id, category_id, description, rating, review_count, city, state, latitude, longitude, active)
    VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, 1)
  `).run(id, userId, data.category_id, data.description, data.city, data.state,
    data.latitude || null, data.longitude || null);
  // Promote user to provider role
  db.prepare("UPDATE users SET role = 'provider', updated_at = datetime('now') WHERE id = ?").run(userId);
  return id;
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

// ═══════════════════════════════════════════
// SERVICE REQUESTS — Open search (issue #14)
// ═══════════════════════════════════════════

export interface OpenRequestFilters {
  lat?: number;
  lng?: number;
  radius_km?: number;
  category_id?: string;
  limit?: number;
  offset?: number;
}

export function searchOpenRequests(filters: OpenRequestFilters = {}) {
  const { lat, lng, radius_km, category_id, limit = 20, offset = 0 } = filters;
  const params: any[] = [];
  let where = " WHERE sr.status = 'open'";

  if (category_id) {
    where += ' AND sr.category_id = ?';
    params.push(category_id);
  }

  let orderBy: string;
  const orderParams: any[] = [];

  if (lat !== undefined && lng !== undefined) {
    orderBy = ` ORDER BY
      CASE sr.urgency WHEN 'Alta' THEN 0 WHEN 'Media' THEN 1 WHEN 'Baixa' THEN 2 END ASC,
      ((sr.latitude - ?) * (sr.latitude - ?) + (sr.longitude - ?) * (sr.longitude - ?)) ASC`;
    orderParams.push(lat, lat, lng, lng);

    // Apply radius filter (W2): squared Euclidean distance <= radius_km^2
    if (radius_km !== undefined && radius_km > 0) {
      const maxDegSq = (radius_km / 111) * (radius_km / 111);
      where += ` AND ((sr.latitude - ?) * (sr.latitude - ?) + (sr.longitude - ?) * (sr.longitude - ?)) <= ?`;
      params.push(lat, lat, lng, lng, maxDegSq);
    }
  } else {
    orderBy = ` ORDER BY
      CASE sr.urgency WHEN 'Alta' THEN 0 WHEN 'Media' THEN 1 WHEN 'Baixa' THEN 2 END ASC,
      sr.created_at DESC`;
  }

  const sql = `
    SELECT
      sr.id, sr.title, sr.description, sr.urgency, sr.status,
      sr.latitude, sr.longitude, sr.city, sr.state, sr.created_at,
      u.id as client_id, u.name as client_name, u.avatar_url as client_avatar,
      c.name as category_name, c.slug as category_slug, c.icon as category_icon,
      (SELECT COUNT(*) FROM interests i WHERE i.request_id = sr.id) as interest_count
    FROM service_requests sr
    JOIN users u ON u.id = sr.client_id
    LEFT JOIN categories c ON c.id = sr.category_id
    ${where}
    ${orderBy}
    LIMIT ? OFFSET ?`;

  params.push(...orderParams, limit, offset);
  return db.prepare(sql).all(...params);
}

// ADMIN — Category CRUD + Dashboard (issue #20)
// ═══════════════════════════════════════════

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  deleted_at: string | null;
  provider_count?: number;
}

export function getCategoriesWithProviderCount(): CategoryRow[] {
  return db.prepare(`
    SELECT c.id, c.name, c.slug, c.icon, c.deleted_at,
      (SELECT COUNT(*) FROM provider_profiles pp WHERE pp.category_id = c.id) as provider_count
    FROM categories c
    WHERE c.deleted_at IS NULL
    ORDER BY c.name
  `).all() as CategoryRow[];
}

export function createCategory(name: string, slug: string, icon: string): CategoryRow {
  const id = `cat-${slug}`;
  db.prepare(
    'INSERT INTO categories (id, name, slug, icon) VALUES (?, ?, ?, ?)'
  ).run(id, name, slug, icon);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow;
}

export function updateCategory(id: string, data: { name?: string; slug?: string; icon?: string }): CategoryRow | null {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL').get(id) as CategoryRow | undefined;
  if (!existing) return null;

  const name = data.name || existing.name;
  const slug = data.slug || existing.slug;
  const icon = data.icon || existing.icon;

  db.prepare('UPDATE categories SET name = ?, slug = ?, icon = ? WHERE id = ?')
    .run(name, slug, icon, id);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow;
}

export function softDeleteCategory(id: string): { success: boolean; reason?: string } {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL').get(id) as CategoryRow | undefined;
  if (!existing) return { success: false, reason: 'Categoria não encontrada.' };

  const linkedProviders = (db.prepare(
    'SELECT COUNT(*) as cnt FROM provider_profiles WHERE category_id = ?'
  ).get(id) as any).cnt;

  if (linkedProviders > 0) {
    // Soft delete: mark as deleted
    db.prepare("UPDATE categories SET deleted_at = datetime('now') WHERE id = ?").run(id);
    return { success: true, reason: `Categoria inativada (${linkedProviders} prestadores vinculados).` };
  }

  // No linked providers — hard delete
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return { success: true };
}

export interface AdminStats {
  totalClients: number;
  totalProviders: number;
  totalRequests: number;
  totalContacts: number;
  contactsByDay: { date: string; count: number }[];
  topCategories: { name: string; icon: string; count: number }[];
  conversionRate: { total: number; withInterest: number; rate: number };
}

export function getAdminStats(periodDays: number = 30): AdminStats {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const sinceISO = since.toISOString();

  const totalClients = (db.prepare(
    "SELECT COUNT(*) as cnt FROM users WHERE role = 'client' AND deleted_at IS NULL AND created_at >= ?"
  ).get(sinceISO) as any).cnt;

  const totalProviders = (db.prepare(
    "SELECT COUNT(*) as cnt FROM users WHERE role = 'provider' AND deleted_at IS NULL AND created_at >= ?"
  ).get(sinceISO) as any).cnt;

  const totalRequests = (db.prepare(
    'SELECT COUNT(*) as cnt FROM service_requests WHERE created_at >= ?'
  ).get(sinceISO) as any).cnt;

  const totalContacts = (db.prepare(
    'SELECT COUNT(*) as cnt FROM contact_history WHERE created_at >= ?'
  ).get(sinceISO) as any).cnt;

  const contactsByDay = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM contact_history
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(sinceISO) as { date: string; count: number }[];

  const topCategories = db.prepare(`
    SELECT c.name, c.icon, COUNT(sr.id) as count
    FROM service_requests sr
    JOIN categories c ON c.id = sr.category_id
    WHERE sr.created_at >= ?
    GROUP BY c.name
    ORDER BY count DESC
    LIMIT 5
  `).all(sinceISO) as { name: string; icon: string; count: number }[];

  const requestsWithInterest = (db.prepare(`
    SELECT COUNT(DISTINCT sr.id) as cnt
    FROM service_requests sr
    JOIN interests i ON i.request_id = sr.id
    WHERE sr.created_at >= ?
  `).get(sinceISO) as any).cnt;

  const conversionRate = {
    total: totalRequests,
    withInterest: requestsWithInterest,
    rate: totalRequests > 0 ? Math.round((requestsWithInterest / totalRequests) * 100) : 0,
  };

  return {
    totalClients,
    totalProviders,
    totalRequests,
    totalContacts,
    contactsByDay,
    topCategories,
    conversionRate,
  };
}

// ═══════════════════════════════════════════
// REVIEWS (issue #17)
// ═══════════════════════════════════════════

export function getProviderReviews(providerId: string) {
  return db.prepare(`
    SELECT r.id, r.rating, r.comment, r.created_at,
           u.id as client_id, u.name as client_name, u.avatar_url as client_avatar
    FROM reviews r JOIN users u ON u.id = r.client_id
    WHERE r.provider_id = ? ORDER BY r.created_at DESC
  `).all(providerId);
}

export function getClientReviewForContact(clientId: string, contactId: string) {
  return db.prepare('SELECT * FROM reviews WHERE client_id = ? AND contact_id = ?').get(clientId, contactId);
}

export function createReview(data: { clientId: string; providerId: string; contactId?: string; rating: number; comment?: string }) {
  const id = uuidv4();
  db.prepare(`INSERT INTO reviews (id, client_id, provider_id, contact_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, data.clientId, data.providerId, data.contactId || null, data.rating, data.comment || null);
  const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE provider_id = ?').get(data.providerId) as any;
  db.prepare("UPDATE provider_profiles SET rating = ?, review_count = ?, updated_at = datetime('now') WHERE id = ?")
    .run(Math.round(stats.avg_rating * 10) / 10, stats.count, data.providerId);
  return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
}

export function hasClientContactedProvider(clientId: string, providerUserId: string): boolean {
  const row = db.prepare('SELECT COUNT(*) as count FROM contact_history WHERE client_id = ? AND provider_id = ?').get(clientId, providerUserId) as any;
  return row.count > 0;
}

// ═══════════════════════════════════════════
// REPORTS (issue #18)
// ═══════════════════════════════════════════

export function createReport(data: { reporterId: string; reportedProviderId: string; reason: string; description?: string }) {
  const id = uuidv4();
  db.prepare(`INSERT INTO reports (id, reporter_id, reported_provider_id, reason, description) VALUES (?, ?, ?, ?, ?)`)
    .run(id, data.reporterId, data.reportedProviderId, data.reason, data.description || null);
  return db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
}

export function hasRecentReport(reporterId: string, providerId: string, hours: number = 24): boolean {
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM reports
    WHERE reporter_id = ? AND reported_provider_id = ?
    AND created_at > datetime('now', ? || ' hours')
  `).get(reporterId, providerId, `-${hours}`) as any;
  return row.count > 0;
}

export function getPendingReports() {
  return db.prepare(`
    SELECT rp.id, rp.reason, rp.description, rp.status, rp.created_at,
           u.id as reporter_id, u.name as reporter_name,
           pp.id as provider_id, pu.name as provider_name
    FROM reports rp
    JOIN users u ON u.id = rp.reporter_id
    JOIN provider_profiles pp ON pp.id = rp.reported_provider_id
    JOIN users pu ON pu.id = pp.user_id
    WHERE rp.status = 'pending'
    ORDER BY rp.created_at DESC
  `).all();
}

export default db;

