/**
 * Testes para rotas de contatos (/api/contacts).
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
    'INSERT INTO provider_profiles (id, user_id, category_id, active) VALUES (?, ?, ?, 1)'
  ).run(id, userId, 'cat-eletricista');
  return { id, userId };
}

describe('POST /api/contacts', () => {
  let clientToken: string;
  let providerId: string;

  beforeAll(() => {
    const client = createTestUser('client');
    const provider = createTestUser('provider');
    createTestProvider(provider.id);
    clientToken = generateTokens(client as any).accessToken;
    providerId = provider.id;
  });

  it('deve registrar contato com provider_id válido', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ provider_id: providerId, contact_type: 'whatsapp' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('contactId');
    expect(res.body.contactType).toBe('whatsapp');
  });

  it('deve usar default whatsapp para tipo inválido', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ provider_id: providerId, contact_type: 'email' });
    expect(res.status).toBe(201);
    expect(res.body.contactType).toBe('whatsapp');
  });

  it('deve retornar 404 para provider inexistente', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ provider_id: 'nao-existe' });
    expect(res.status).toBe(404);
  });

  it('deve retornar 400 sem provider_id', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ provider_id: providerId });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/contacts', () => {
  let clientToken: string;
  let providerId: string;

  beforeAll(async () => {
    const client = createTestUser('client');
    const provider = createTestUser('provider');
    createTestProvider(provider.id);
    clientToken = generateTokens(client as any).accessToken;
    providerId = provider.id;

    // Cria um contato pra ter histórico
    await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ provider_id: providerId });
  });

  it('deve retornar histórico de contatos', async () => {
    const res = await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/contacts');
    expect(res.status).toBe(401);
  });
});
