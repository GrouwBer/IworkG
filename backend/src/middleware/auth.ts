import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlacklisted } from '../services/token';
import db from '../db';

/**
 * Middleware: require valid access token.
 * Attaches user info to `req.user`.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de acesso não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      res.status(401).json({ error: 'Tipo de token inválido.' });
      return;
    }

    if (isTokenBlacklisted(payload.jti)) {
      res.status(401).json({ error: 'Token foi invalidado (logout).' });
      return;
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      jti: payload.jti,
    };

    // Check if user is banned (issue #19)
    const userRow = db.prepare('SELECT banned FROM users WHERE id = ?').get(req.user.id) as any;
    if (userRow?.banned) {
      res.status(403).json({ error: 'Conta suspensa. Entre em contato com o suporte.' });
      return;
    }

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expirado. Use o refresh token.', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Token inválido.' });
  }
}

/**
 * Middleware: require specific role.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado para este perfil.' });
      return;
    }
    next();
  };
}
