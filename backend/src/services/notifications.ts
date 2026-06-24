import db, { NotificationPreferences } from '../db';
import { v4 as uuidv4 } from 'uuid';

// ═══════════════════════════════════════════
// NOTIFICATION PREFERENCES — business logic (issue #23)
// ═══════════════════════════════════════════

const ALLOWED_PREF_KEYS: (keyof NotificationPreferences)[] = [
  'new_requests',
  'interests',
  'reviews',
  'promotions',
];

export function getNotificationPreferences(userId: string): NotificationPreferences {
  const row = db.prepare(
    'SELECT new_requests, interests, reviews, promotions FROM notification_preferences WHERE user_id = ?'
  ).get(userId) as NotificationPreferences | undefined;
  return row || { new_requests: 1, interests: 1, reviews: 1, promotions: 0 };
}

export function updateNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>) {
  // W2 — Validate against whitelist to prevent SQL injection
  for (const key of Object.keys(prefs)) {
    if (!ALLOWED_PREF_KEYS.includes(key as keyof NotificationPreferences)) {
      throw new Error(`Chave de preferência inválida: ${key}`);
    }
  }

  const existing = db.prepare('SELECT user_id FROM notification_preferences WHERE user_id = ?').get(userId);
  if (existing) {
    const sets: string[] = [];
    const vals: any[] = [];
    for (const [k, v] of Object.entries(prefs)) {
      // W3 — Ensure v is a number (0/1) to avoid truthy coercion of strings like "true"
      if (v !== undefined) { sets.push(`${k} = ?`); vals.push(typeof v === 'number' ? (v ? 1 : 0) : (Number(v) ? 1 : 0)); }
    }
    if (sets.length > 0) {
      vals.push(userId);
      db.prepare(`UPDATE notification_preferences SET ${sets.join(', ')} WHERE user_id = ?`).run(...vals);
    }
  } else {
    db.prepare(`INSERT INTO notification_preferences (user_id, new_requests, interests, reviews, promotions) VALUES (?, ?, ?, ?, ?)`)
      .run(userId, prefs.new_requests ?? 1, prefs.interests ?? 1, prefs.reviews ?? 1, prefs.promotions ?? 0);
  }
}

type NotificationType = 'new_request' | 'interest' | 'review' | 'promotion';

/** Create a notification only if the user hasn't disabled this type */
export function notifyUser(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, any>) {
  const prefs = getNotificationPreferences(userId);
  const prefMap: Record<string, keyof NotificationPreferences> = {
    new_request: 'new_requests',
    interest: 'interests',
    review: 'reviews',
    promotion: 'promotions',
  };
  const prefKey = prefMap[type];
  if (prefKey && !prefs[prefKey]) return null; // disabled

  const id = uuidv4();
  db.prepare(`INSERT INTO notifications (id, user_id, type, title, body, data) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, userId, type, title, body, data ? JSON.stringify(data) : null);
  return { id, userId, type, title, body, data };
}
