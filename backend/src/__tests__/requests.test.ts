/**
 * Testes para rotas de pedidos (/api/requests).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { generateTokens } from '../services/token';

// ── Helpers ──

function createTestUser(role: string = 'client') {
  const id = uuidv4();
  const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
  db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)')
    .run(id, `Teste ${role}`, phone, role);
  return { id, phone, role };
}

function createTestProvider(userId: string) {
  const id = uuidv4();
  db.prepare(
    "INSERT INTO provider_profiles (id, user_id, category_id, description, city, state, active) VALUES (?, ?, 'cat-eletricista', 'Desc', 'Poços de Caldas', 'MG', 1)"
  ).run(id, userId);
  return { id, userId };
}

function createServiceRequest(clientId: string) {
  const id = uuidv4();
  db.prepare(
    'INSERT INTO service_requests (id, client_id, title, description, category_id, city, state, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, clientId, 'Preciso de um eletricista', 'Tomada não funciona', 'cat-eletricista', 'Poços de Caldas', 'MG', 'open');
  return { id, clientId };
}

describe('POST /api/requests/:id/interest', () => {
  let providerToken: string;
  let clientId: string;
  let requestId: string;

  beforeAll(() => {
    const client = createTestUser('client');
    clientId = client.id;
    const provider = createTestUser('provider');
    createTestProvider(provider.id);
    providerToken = generateTokens(provider as any).accessToken;
    requestId = createServiceRequest(clientId).id;
  });

  it('deve registrar interesse como provider', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/interest`)
      .set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('interestId');
    expect(res.body.message).toContain('Interesse');
  });

  it('deve retornar 409 para interesse duplicado', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/interest`)
      .set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(409);
  });

  it('deve retornar 403 para cliente (não provider)', async () => {
    const clientToken = generateTokens({ id: clientId, role: 'client' } as any).accessToken;
    const res = await request(app)
      .post(`/api/requests/${requestId}/interest`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post(`/api/requests/${requestId}/interest`);
    expect(res.status).toBe(401);
  });

  it('deve retornar 404 para request inexistente', async () => {
    const res = await request(app)
      .post('/api/requests/nao-existe/interest')
      .set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/requests/:id/interests', () => {
  let clientToken: string;
  let clientId: string;
  let requestId: string;

  beforeAll(async () => {
    const client = createTestUser('client');
    clientId = client.id;
    clientToken = generateTokens(client as any).accessToken;
    requestId = createServiceRequest(clientId).id;

    // Adiciona um interesse para ter o que listar
    const provider = createTestUser('provider');
    createTestProvider(provider.id);
    const providerToken = generateTokens(provider as any).accessToken;
    await request(app)
      .post(`/api/requests/${requestId}/interest`)
      .set('Authorization', `Bearer ${providerToken}`);
  });

  it('deve listar interessados (dono do pedido)', async () => {
    const res = await request(app)
      .get(`/api/requests/${requestId}/interests`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('interests');
    expect(res.body).toHaveProperty('request');
    expect(Array.isArray(res.body.interests)).toBe(true);
    expect(res.body.interests.length).toBeGreaterThan(0);
    expect(res.body.interests[0]).toHaveProperty('interestId');
    expect(res.body.interests[0].provider).toHaveProperty('id');
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get(`/api/requests/${requestId}/interests`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/requests/open', () => {
  let providerToken: string;

  beforeAll(() => {
    const provider = createTestUser('provider');
    createTestProvider(provider.id);
    providerToken = generateTokens(provider as any).accessToken;
  });

  it('deve listar pedidos abertos (provider)', async () => {
    const res = await request(app)
      .get('/api/requests/open')
      .set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/requests/open');
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para cliente', async () => {
    const client = createTestUser('client');
    const clientToken = generateTokens(client as any).accessToken;
    const res = await request(app)
      .get('/api/requests/open')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });
});
