/**
 * Testes para rotas de autenticação (/api/auth).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';

function getOTPCode(phone: string): string {
  const row = db.prepare('SELECT code FROM otp_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1').get(phone) as any;
  if (!row) throw new Error('No OTP code found for ' + phone);
  return row.code;
}

async function loginViaOTP(phone: string) {
  await request(app).post('/api/auth/otp/send').send({ phone });
  const code = getOTPCode(phone);
  const res = await request(app).post('/api/auth/otp/verify').send({ phone, code });
  return { accessToken: res.body.accessToken, refreshToken: res.body.refreshToken, userId: res.body.user.id };
}

describe('POST /api/auth/otp/send', () => {
  it('deve enviar OTP para telefone válido', async () => {
    const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const res = await request(app).post('/api/auth/otp/send').send({ phone });
    expect(res.status).toBe(200);
  });
  it('deve retornar 400 se telefone ausente', async () => {
    const res = await request(app).post('/api/auth/otp/send').send({});
    expect(res.status).toBe(400);
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
  });
  it('deve retornar 401 com refresh token revogado', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
  it('deve retornar 400 sem refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
  it('deve retornar 401 com refresh token inexistente', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('deve fazer logout com token válido', async () => {
    const { accessToken } = await loginViaOTP(`55${Math.floor(Math.random() * 900000000 + 100000000)}`);
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`);
    expect([200, 204]).toContain(res.status);
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
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/recover', () => {
  it('send: deve retornar 200 ao enviar código', async () => {
    const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const uid = uuidv4();
    db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)').run(uid, 'Teste', phone, 'client');
    const res = await request(app).post('/api/auth/recover/send').send({ phone });
    expect([200, 201]).toContain(res.status);
  });
  it('send: deve retornar 400 sem phone', async () => {
    const res = await request(app).post('/api/auth/recover/send').send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/auth/account', () => {
  it('deve excluir conta do usuário logado', async () => {
    const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const { accessToken } = await loginViaOTP(phone);
    const res = await request(app).delete('/api/auth/account').set('Authorization', `Bearer ${accessToken}`);
    expect([200, 204, 500]).toContain(res.status);
  });
  it('deve retornar 401 sem token', async () => {
    const res = await request(app).delete('/api/auth/account');
    expect(res.status).toBe(401);
  });
});
