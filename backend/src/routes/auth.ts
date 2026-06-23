import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import db from '../db';
import { config } from '../config';
import { generateTokens, refreshAccessToken, blacklistToken, revokeAllUserTokens } from '../services/token';
import { generateOTP, verifyOTP } from '../services/otp';
import { requireAuth } from '../middleware/auth';
import type { User } from '../types';
import rateLimit from 'express-rate-limit';

// Rate limiters
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Muitas tentativas. Aguarde um minuto.' },
});

const googleAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Aguarde um minuto.' },
});

const router = Router();

// Google OAuth client
const googleClient = new OAuth2Client(
  config.googleClientId,
  config.googleClientSecret,
  config.googleRedirectUri
);

// ──────────────────────────────────────────────
// POST /api/auth/google — Google OAuth login
// Body: { credential: string } (Google ID token from frontend)
// ──────────────────────────────────────────────
router.post('/google', googleAuthLimiter, async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ error: 'Credencial Google não fornecida.' });
      return;
    }

    if (typeof credential !== 'string' || credential.length > 2048) {
      res.status(400).json({ error: 'Credencial inválida.' });
      return;
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Token Google inválido.' });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const avatarUrl = payload.picture || '';

    // Upsert user
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId) as User | undefined;

    if (!user) {
      // Check if email already exists (link accounts)
      const existingByEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
      if (existingByEmail) {
        db.prepare(`UPDATE users SET google_id = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?`)
          .run(googleId, avatarUrl, existingByEmail.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(existingByEmail.id) as User;
      } else {
        const userId = uuidv4();
        db.prepare(
          'INSERT INTO users (id, name, email, google_id, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(userId, name, email, googleId, avatarUrl, 'client');
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
      }
    }

    const tokens = generateTokens(user!);

    res.json({
      user: {
        id: user!.id,
        name: user!.name,
        email: user!.email,
        phone: user!.phone,
        avatarUrl: user!.avatar_url,
        role: user!.role,
      },
      ...tokens,
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Falha na autenticação Google.' });
  }
});

// ──────────────────────────────────────────────
// GET /api/auth/google/url — Get Google OAuth URL (server-side flow)
// ──────────────────────────────────────────────
router.get('/google/url', (_req: Request, res: Response) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'select_account',
  });
  res.json({ url });
});

// ──────────────────────────────────────────────
// GET /api/auth/google/callback — OAuth callback
// ──────────────────────────────────────────────
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Código de autorização não fornecido.' });
      return;
    }

    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) {
      res.status(400).json({ error: 'Falha ao obter token Google.' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Token Google inválido.' });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const avatarUrl = payload.picture || '';

    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId) as User | undefined;
    if (!user) {
      const existingByEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
      if (existingByEmail) {
        db.prepare(`UPDATE users SET google_id = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?`)
          .run(googleId, avatarUrl, existingByEmail.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(existingByEmail.id) as User;
      } else {
        const userId = uuidv4();
        db.prepare(
          'INSERT INTO users (id, name, email, google_id, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(userId, name, email, googleId, avatarUrl, 'client');
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
      }
    }

    const authTokens = generateTokens(user!);

    // Redirect to frontend with tokens in URL hash
    const redirectUrl = `${config.frontendUrl}/auth/callback#accessToken=${authTokens.accessToken}&refreshToken=${authTokens.refreshToken}`;
    res.redirect(redirectUrl);
  } catch (err: any) {
    console.error('Google callback error:', err);
    res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/otp/send — Send OTP to phone
// ──────────────────────────────────────────────
router.post('/otp/send', otpLimiter, (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({ error: 'Número de telefone não fornecido.' });
    return;
  }

  if (typeof phone !== 'string' || phone.length > 20) {
    res.status(400).json({ error: 'Número de telefone inválido.' });
    return;
  }

  // Basic phone validation (E.164 or Brazilian format)
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 15) {
    res.status(400).json({ error: 'Número de telefone inválido.' });
    return;
  }

  const { expiresAt } = generateOTP(cleaned);

  res.json({
    message: 'Código enviado com sucesso.',
    expiresAt,
    // In production, do NOT return the code
    // For MVP/development, we show it in console only
  });
});

// ──────────────────────────────────────────────
// POST /api/auth/otp/verify — Verify OTP and login
// ──────────────────────────────────────────────
router.post('/otp/verify', otpLimiter, (req: Request, res: Response) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    res.status(400).json({ error: 'Telefone e código são obrigatórios.' });
    return;
  }

  if (typeof phone !== 'string' || phone.length > 20) {
    res.status(400).json({ error: 'Telefone inválido.' });
    return;
  }

  if (typeof code !== 'string' || code.length > 10) {
    res.status(400).json({ error: 'Código inválido.' });
    return;
  }

  const cleaned = phone.replace(/\D/g, '');

  if (!verifyOTP(cleaned, code)) {
    res.status(401).json({ error: 'Código inválido ou expirado.' });
    return;
  }

  // Find or create user by phone
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(cleaned) as User | undefined;

  if (!user) {
    const userId = uuidv4();
    db.prepare(
      'INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)'
    ).run(userId, `Usuário ${cleaned.slice(-4)}`, cleaned, 'client');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
  }

  const tokens = generateTokens(user!);

  res.json({
    user: {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      phone: user!.phone,
      avatarUrl: user!.avatar_url,
      role: user!.role,
    },
    ...tokens,
  });
});

// ──────────────────────────────────────────────
// POST /api/auth/refresh — Refresh access token
// ──────────────────────────────────────────────
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token não fornecido.' });
    return;
  }

  const tokens = refreshAccessToken(refreshToken);
  if (!tokens) {
    res.status(401).json({ error: 'Refresh token inválido ou revogado.' });
    return;
  }

  res.json(tokens);
});

// ──────────────────────────────────────────────
// POST /api/auth/logout — Logout (blacklist token)
// ──────────────────────────────────────────────
router.post('/logout', requireAuth, (req: Request, res: Response) => {
  const { all } = req.body; // if true, logout from all devices

  if (all) {
    revokeAllUserTokens(req.user!.id);
  }

  // Blacklist current access token (30 min = default access token expiry)
  blacklistToken(req.user!.jti, 1800);

  res.json({ message: 'Logout realizado com sucesso.' });
});

// ──────────────────────────────────────────────
// GET /api/auth/me — Get current user info
// ──────────────────────────────────────────────
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = db.prepare(
    'SELECT id, name, email, phone, avatar_url, role, created_at FROM users WHERE id = ?'
  ).get(req.user!.id) as any;

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    role: user.role,
    createdAt: user.created_at,
  });
});

export default router;
