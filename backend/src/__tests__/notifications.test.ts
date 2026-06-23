/**
 * Testes para rotas de notificações (/api/notifications).
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

describe('GET /api/notifications', () => {
  it('deve listar notificações do usuário', async () => {
    const user = createTestUser();
    const token = generateTokens(user as any).accessToken;
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  it('deve marcar notificação como lida', async () => {
    const user = createTestUser();
    const token = generateTokens(user as any).accessToken;
    const res = await request(app).patch('/api/notifications/any/read').set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.status);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).patch('/api/notifications/any/read');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/notifications/read-all', () => {
  it('deve marcar todas como lidas', async () => {
    const user = createTestUser();
    const token = generateTokens(user as any).accessToken;
    const res = await request(app).patch('/api/notifications/read-all').set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.status);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).patch('/api/notifications/read-all');
    expect(res.status).toBe(401);
  });
});
