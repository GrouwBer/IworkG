/**
 * Testes para rotas de autenticação (/api/auth).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';

// ── Helpers ──

function createUser(overrides: Record<string, any> = {}) {
  const id = uuidv4();
  const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
  db.prepare(
    'INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)'
  ).run(id, overrides.name || `Teste ${phone.slice(-4)}`, phone, overrides.role || 'client');
  return { id, phone, role: overrides.role || 'client' };
}

function getOTPCode(phone: string): string {
  // OTP is stored in DB; extract the latest code for this phone
  const row = db.prepare(
    'SELECT code FROM otp_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1'
  ).get(phone) as any;
  if (!row) throw new Error('No OTP code found for ' + phone);
  return row.code;
}

async function loginViaOTP(phone: string): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  await request(app).post('/api/auth/otp/send').send({ phone });
  const code = getOTPCode(phone);
  const res = await request(app).post('/api/auth/otp/verify').send({ phone, code });
  return {
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    userId: res.body.user.id,
  };
}

// ── Test Suite ──

describe('POST /api/auth/otp/send', () => {
  it('deve enviar OTP para telefone válido', async () => {
    const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const res = await request(app).post('/api/auth/otp/send').send({ phone });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('expiresAt');
  });

  it('deve retornar 400 se telefone ausente', async () => {
    const res = await request(app).post('/api/auth/otp/send').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('telefone');
  });

  it('deve retornar 400 se telefone muito curto', async () => {
    const res = await request(app).post('/api/auth/otp/send').send({ phone: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/otp/verify', () => {
  it('deve autenticar com código OTP válido e criar novo usuário', async () => {
    const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
    await request(app).post('/api/auth/otp/send').send({ phone });
    const code = getOTPCode(phone);

    const res = await request(app).post('/api/auth/otp/verify').send({ phone, code });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.phone).toBe(phone);
    expect(res.body.user.role).toBe('client');
  });

  it('deve retornar 401 com código inválido', async () => {
    const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
    await request(app).post('/api/auth/otp/send').send({ phone });

    const res = await request(app).post('/api/auth/otp/verify').send({ phone, code: '000000' });
    expect(res.status).toBe(401);
  });

  it('deve retornar 400 sem phone', async () => {
    const res = await request(app).post('/api/auth/otp/verify').send({ code: '123456' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/refresh', () => {
  let refreshToken: string;

  beforeAll(async () => {
    const tokens = await loginViaOTP(`55${Math.floor(Math.random() * 900000000 + 100000000)}`);
    refreshToken = tokens.refreshToken;
  });

  it('deve renovar tokens com refresh token válido', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    // Old refresh token should be revoked
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it('deve retornar 401 com refresh token revogado (reuso)', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it('deve retornar 400 sem refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('deve retornar 401 com refresh token inexistente', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid-token' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('deve fazer logout com token válido', async () => {
    const { accessToken } = await loginViaOTP(`55${Math.floor(Math.random() * 900000000 + 100000000)}`);
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Logout');
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('deve retornar dados do usuário logado', async () => {
    const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const { accessToken } = await loginViaOTP(phone);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    expect(res.body.phone).toBe(phone);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/recover (fluxo completo)', () => {
  let phone: string;

  beforeAll(() => {
    phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
    createUser({ phone, name: 'Usuário Teste' });
  });

  it('send: deve enviar código de recuperação', async () => {
    const res = await request(app).post('/api/auth/recover/send').send({ phone });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('enviado');
  });

  it('send: deve retornar 400 sem phone', async () => {
    const res = await request(app).post('/api/auth/recover/send').send({});
    expect(res.status).toBe(400);
  });

  it('verify: deve validar código', async () => {
    await request(app).post('/api/auth/recover/send').send({ phone });
    const row = db.prepare(
      'SELECT token FROM recovery_tokens WHERE identifier = ? ORDER BY created_at DESC LIMIT 1'
    ).get(phone) as any;
    expect(row).toBeTruthy();
    const res = await request(app).post('/api/auth/recover/verify').send({ phone, token: row.token });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('verify: deve retornar 401 com token inválido', async () => {
    const res = await request(app).post('/api/auth/recover/verify').send({ phone, token: 'wrong' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/auth/account', () => {
  it('deve excluir conta do usuário logado', async () => {
    const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const { accessToken } = await loginViaOTP(phone);

    const res = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${accessToken}`);
    // Account deletion may return 200 or 204
    expect([200, 204]).toContain(res.status);

    // Token should be blacklisted after deletion
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(401);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).delete('/api/auth/account');
    expect(res.status).toBe(401);
  });
});
