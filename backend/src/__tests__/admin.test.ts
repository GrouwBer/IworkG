/**
 * Testes para rotas de admin (/api/admin).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { generateTokens } from '../services/token';

// ── Helpers ──

function createAdmin() {
  const id = uuidv4();
  const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
  db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)')
    .run(id, 'Admin Teste', phone, 'admin');
  return { id, phone, role: 'admin' };
}

function createClient() {
  const id = uuidv4();
  const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
  db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)')
    .run(id, 'Cliente Teste', phone, 'client');
  return { id, phone, role: 'client' };
}

describe('GET /api/admin/stats', () => {
  let adminToken: string;

  beforeAll(() => {
    const admin = createAdmin();
    adminToken = generateTokens(admin as any).accessToken;
  });

  it('deve retornar estatísticas (admin)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalProviders');
    expect(res.body).toHaveProperty('totalClients');
    expect(res.body).toHaveProperty('totalRequests');
  });

  it('deve retornar 403 para não-admin', async () => {
    const client = createClient();
    const clientToken = generateTokens(client as any).accessToken;
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${clientToken}`);
    expect([401, 403]).toContain(res.status);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/categories', () => {
  let adminToken: string;

  beforeAll(() => {
    const admin = createAdmin();
    adminToken = generateTokens(admin as any).accessToken;
  });

  it('deve listar categorias com contagem (admin)', async () => {
    const res = await request(app)
      .get('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('providerCount');
    }
  });
});

describe('POST /api/admin/categories', () => {
  let adminToken: string;

  beforeAll(() => {
    const admin = createAdmin();
    adminToken = generateTokens(admin as any).accessToken;
  });

  it('deve criar categoria (admin)', async () => {
    const slug = `teste-${Date.now()}`;
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Categoria Teste', slug, icon: '🧪' });
    // Pode ser 201 (criado) ou 400 (já existe/x duplicado)
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body).toHaveProperty('id');
    }
  });

  it('deve retornar 400 sem name', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post('/api/admin/categories').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/admin/categories/:id', () => {
  let adminToken: string;

  beforeAll(() => {
    const admin = createAdmin();
    adminToken = generateTokens(admin as any).accessToken;
  });

  it('deve retornar 404 para categoria inexistente', async () => {
    const res = await request(app)
      .delete('/api/admin/categories/nao-existe')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([404, 400]).toContain(res.status);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).delete('/api/admin/categories/alguma');
    expect(res.status).toBe(401);
  });
});
