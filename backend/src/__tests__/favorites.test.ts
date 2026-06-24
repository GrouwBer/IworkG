/**
 * Testes para rotas de favoritos (/api/favorites).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { generateTokens } from '../services/token';

function createTestUser(role: string = 'client') {
  const id = uuidv4();
  const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
  db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)').run(id, `Teste ${role}`, phone, role);
  return { id, phone, role };
}

function createTestProvider(userId: string) {
  const id = uuidv4();
  db.prepare("INSERT INTO provider_profiles (id, user_id, category_id, active) VALUES (?, ?, 'cat-eletricista', 1)").run(id, userId);
  return { id, userId };
}

describe('POST /api/favorites/:providerId', () => {
  let clientToken: string;
  let providerId: string;

  beforeAll(() => {
    const client = createTestUser('client');
    const provider = createTestUser('provider');
    createTestProvider(provider.id);
    clientToken = generateTokens(client as any).accessToken;
    providerId = provider.id;
  });

  it('deve favoritar um prestador', async () => {
    const res = await request(app).post(`/api/favorites/${providerId}`).set('Authorization', `Bearer ${clientToken}`);
    expect([200, 201]).toContain(res.status);
  });

  it('deve desfavoritar (toggle) um prestador', async () => {
    const res = await request(app).post(`/api/favorites/${providerId}`).set('Authorization', `Bearer ${clientToken}`);
    expect([200, 201]).toContain(res.status);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post(`/api/favorites/${providerId}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/favorites', () => {
  let clientToken: string;
  let providerId: string;

  beforeAll(async () => {
    const client = createTestUser('client');
    const provider = createTestUser('provider');
    createTestProvider(provider.id);
    clientToken = generateTokens(client as any).accessToken;
    providerId = provider.id;
    await request(app).post(`/api/favorites/${providerId}`).set('Authorization', `Bearer ${clientToken}`);
  });

  it('deve listar favoritos do usuário', async () => {
    const res = await request(app).get('/api/favorites').set('Authorization', `Bearer ${clientToken}`);
    expect([200, 201]).toContain(res.status);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/favorites/check/:providerId', () => {
  let clientToken: string;
  let providerId: string;

  beforeAll(async () => {
    const client = createTestUser('client');
    const provider = createTestUser('provider');
    createTestProvider(provider.id);
    clientToken = generateTokens(client as any).accessToken;
    providerId = provider.id;
    await request(app).post(`/api/favorites/${providerId}`).set('Authorization', `Bearer ${clientToken}`);
  });

  it('deve retornar status do favorito', async () => {
    const res = await request(app).get(`/api/favorites/check/${providerId}`).set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('favorited');
  });

  it('deve retornar false para não favoritado', async () => {
    const res = await request(app).get('/api/favorites/check/nao-existe').set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.favorited).toBe(false);
  });
});
