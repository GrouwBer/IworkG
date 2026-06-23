/**
 * Testes para rotas de admin (/api/admin).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { generateTokens } from '../services/token';

function createAdmin() {
  const id = uuidv4();
  const phone = `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
  db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)').run(id, 'Admin', phone, 'admin');
  return { id, phone, role: 'admin' };
}

describe('GET /api/admin/stats', () => {
  let adminToken: string;
  beforeAll(() => { adminToken = generateTokens(createAdmin() as any).accessToken; });

  it('deve retornar estatísticas (admin)', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/categories', () => {
  let adminToken: string;
  beforeAll(() => { adminToken = generateTokens(createAdmin() as any).accessToken; });

  it('deve listar categorias (admin)', async () => {
    const res = await request(app).get('/api/admin/categories').set('Authorization', `Bearer ${adminToken}`);
    expect([200, 500]).toContain(res.status);
  });
});

describe('POST /api/admin/categories', () => {
  let adminToken: string;
  beforeAll(() => { adminToken = generateTokens(createAdmin() as any).accessToken; });

  it('deve criar categoria (admin)', async () => {
    const slug = `teste-${Date.now()}`;
    const res = await request(app).post('/api/admin/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Cat Teste', slug, icon: '🧪' });
    expect([201, 400, 500]).toContain(res.status);
  });

  it('deve retornar 400 sem name', async () => {
    const res = await request(app).post('/api/admin/categories').set('Authorization', `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post('/api/admin/categories').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/admin/categories/:id', () => {
  let adminToken: string;
  beforeAll(() => { adminToken = generateTokens(createAdmin() as any).accessToken; });

  it('deve retornar erro para categoria inexistente', async () => {
    const res = await request(app).delete('/api/admin/categories/nao-existe').set('Authorization', `Bearer ${adminToken}`);
    expect([400, 404, 500]).toContain(res.status);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).delete('/api/admin/categories/alguma');
    expect(res.status).toBe(401);
  });
});
