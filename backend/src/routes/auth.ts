import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import db from '../db';
import { config } from '../config';
import { generateTokens, refreshAccessToken, blacklistToken, revokeAllUserTokens } from '../services/token';
import { generateOTP, verifyOTP } from '../services/otp';
import { requireAuth } from '../middleware/auth';
import type { User } from '../types';

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
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ error: 'Credencial Google não fornecida.' });
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
        db.prepare('UPDATE users SET google_id = ?, avatar_url = ?, updated_at = datetime(\'now\') WHERE id = ?')
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
        db.prepare('UPDATE users SET google_id = ?, avatar_url = ?, updated_at = datetime(\'now\') WHERE id = ?')
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
router.post('/otp/send', (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({ error: 'Número de telefone não fornecido.' });
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
router.post('/otp/verify', (req: Request, res: Response) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    res.status(400).json({ error: 'Telefone e código são obrigatórios.' });
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

// ──────────────────────────────────────────────
// POST /api/auth/recover/send — Send recovery code (RF002)
// Body: { phone: string } or { email: string }
// ──────────────────────────────────────────────
router.post('/recover/send', (req: Request, res: Response) => {
  const { phone, email } = req.body;

  if (!phone && !email) {
    res.status(400).json({ error: 'Informe telefone ou e-mail para recuperação.' });
    return;
  }

  if (phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      res.status(400).json({ error: 'Número de telefone inválido.' });
      return;
    }

    // Check if user exists with this phone
    const user = db.prepare('SELECT id FROM users WHERE phone = ? AND deleted_at IS NULL').get(cleaned);
    if (!user) {
      // Don't reveal whether the account exists — security best practice
      res.json({ message: 'Se o telefone estiver cadastrado, você receberá um código de recuperação.', method: 'phone' });
      return;
    }

    const { expiresAt } = generateOTP(cleaned);
    res.json({ message: 'Código de recuperação enviado.', expiresAt, method: 'phone' });
    return;
  }

  if (email) {
    // Check if user exists with this email
    const user = db.prepare('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL').get(email);
    if (!user) {
      res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.', method: 'email' });
      return;
    }

    // For MVP: generate OTP tied to the email
    const { expiresAt } = generateOTP(email);
    res.json({ message: 'Código de recuperação enviado para o e-mail.', expiresAt, method: 'email' });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/recover/verify — Verify recovery code (RF002)
// Body: { phone: string } or { email: string }, code: string
// ──────────────────────────────────────────────
router.post('/recover/verify', (req: Request, res: Response) => {
  const { phone, email, code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'Código de recuperação é obrigatório.' });
    return;
  }

  const identifier = phone ? phone.replace(/\D/g, '') : email;

  if (!identifier) {
    res.status(400).json({ error: 'Informe telefone ou e-mail.' });
    return;
  }

  if (!verifyOTP(identifier, code)) {
    res.status(401).json({ error: 'Código inválido ou expirado.' });
    return;
  }

  // Generate a one-time recovery token (valid for 10 minutes)
  const recoveryToken = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO otp_codes (id, phone, code, expires_at, used) VALUES (?, ?, ?, ?, 1)'
  ).run(uuidv4(), identifier, recoveryToken, expiresAt);

  res.json({
    message: 'Código verificado com sucesso.',
    recoveryToken,
    expiresAt,
  });
});

// ──────────────────────────────────────────────
// POST /api/auth/recover/reset — Reset login method (RF002)
// Body: recoveryToken, newPhone?: string, newEmail?: string
// ──────────────────────────────────────────────
router.post('/recover/reset', (req: Request, res: Response) => {
  const { recoveryToken, newPhone, newEmail } = req.body;

  if (!recoveryToken) {
    res.status(400).json({ error: 'Token de recuperação é obrigatório.' });
    return;
  }

  // Validate recovery token
  const stored = db.prepare(
    'SELECT phone, expires_at FROM otp_codes WHERE code = ? AND used = 1 AND expires_at > datetime(\'now\')'
  ).get(recoveryToken) as any;

  if (!stored) {
    res.status(401).json({ error: 'Token de recuperação inválido ou expirado.' });
    return;
  }

  const identifier = stored.phone;

  if (!newPhone && !newEmail) {
    res.status(400).json({ error: 'Informe o novo telefone ou e-mail.' });
    return;
  }

  // Find user by original identifier
  let user = db.prepare(
    'SELECT * FROM users WHERE (phone = ? OR email = ?) AND deleted_at IS NULL'
  ).get(identifier, identifier) as any;

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  // Update login method
  if (newPhone) {
    const cleaned = newPhone.replace(/\D/g, '');
    db.prepare('UPDATE users SET phone = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(cleaned, user.id);
  }
  if (newEmail) {
    db.prepare('UPDATE users SET email = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(newEmail, user.id);
  }

  // Revoke old tokens
  revokeAllUserTokens(user.id);

  res.json({ message: 'Método de acesso atualizado com sucesso. Faça login novamente.' });
});

// ──────────────────────────────────────────────
// DELETE /api/auth/account — Delete/Anonymize account (RF004 / LGPD)
// Body: { confirm: true }
// ──────────────────────────────────────────────
router.delete('/account', requireAuth, (req: Request, res: Response) => {
  const { confirm } = req.body;

  if (!confirm) {
    res.status(400).json({ error: 'Confirmação explícita é necessária para excluir a conta.' });
    return;
  }

  const userId = req.user!.id;

  // Anonymize user data (LGPD compliance)
  db.prepare(`
    UPDATE users SET
      name = 'Usuário removido',
      email = NULL,
      phone = NULL,
      avatar_url = NULL,
      google_id = NULL,
      deleted_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(userId);

  // Revoke all active tokens
  revokeAllUserTokens(userId);

  res.json({ message: 'Conta excluída com sucesso. Seus dados pessoais foram removidos, mantendo apenas avaliações anônimas.' });
});

export default router;
