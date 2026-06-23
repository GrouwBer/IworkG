import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import db from '../db';
import type { TokenPayload, AuthTokens, User } from '../types';

/**
 * Generate access + refresh token pair for a user.
 */
export function generateTokens(user: User): AuthTokens {
  const accessJti = uuidv4();
  const refreshJti = uuidv4();

  const accessPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: user.id,
    role: user.role,
    jti: accessJti,
    type: 'access',
  };

  const refreshPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: user.id,
    role: user.role,
    jti: refreshJti,
    type: 'refresh',
  };

  const accessToken = jwt.sign(accessPayload, config.jwtSecret, {
    expiresIn: '30m',
  });

  const refreshToken = jwt.sign(refreshPayload, config.jwtSecret, {
    expiresIn: '7d',
  });

  // Store refresh token JTI in DB (not the token itself)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_jti, expires_at) VALUES (?, ?, ?, ?)'
  ).run(refreshJti, user.id, refreshJti, expiresAt);

  return { accessToken, refreshToken };
}

/**
 * Verify and decode an access token.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

/**
 * Refresh an access token using a valid refresh token.
 */
export function refreshAccessToken(refreshToken: string): AuthTokens | null {
  try {
    const payload = jwt.verify(refreshToken, config.jwtSecret) as TokenPayload;
    if (payload.type !== 'refresh') return null;

    // Check if refresh token JTI is still valid in DB
    const stored = db.prepare(
      'SELECT * FROM refresh_tokens WHERE token_jti = ? AND revoked = 0'
    ).get(payload.jti) as any;

    if (!stored) return null;

    // Revoke old refresh token
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_jti = ?').run(payload.jti);

    // Get user and generate new tokens
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as User;
    if (!user) return null;

    return generateTokens(user);
  } catch {
    return null;
  }
}

/**
 * Blacklist a token (for logout).
 */
export function blacklistToken(jti: string, expiresInSeconds: number = 1800): void {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  db.prepare(
    'INSERT OR IGNORE INTO blacklisted_tokens (id, token_jti, expires_at) VALUES (?, ?, ?)'
  ).run(uuidv4(), jti, expiresAt);

  // Cleanup expired tokens
  db.prepare(
    "DELETE FROM blacklisted_tokens WHERE expires_at < datetime('now')"
  ).run();
}

/**
 * Check if a token is blacklisted.
 */
export function isTokenBlacklisted(jti: string): boolean {
  const row = db.prepare(
    "SELECT 1 FROM blacklisted_tokens WHERE token_jti = ? AND expires_at > datetime('now')"
  ).get(jti);
  return !!row;
}

/**
 * Revoke all refresh tokens for a user (full logout from all devices).
 */
export function revokeAllUserTokens(userId: string): void {
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(userId);
}
