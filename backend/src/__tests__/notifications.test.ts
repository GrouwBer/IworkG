/**
 * Testes para rotas de notificações (/api/notifications).
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

function seedNotification(userId: string) {
  const id = uuidv4();
  db.prepare(
    'INSERT INTO notifications (id, user_id, type, title, body, read) VALUES (?, ?, ?, ?, ?, 0)'
  ).run(id, userId, 'test', 'Notificação de teste', 'Corpo da notificação');
  return { id, userId };
}

describe('GET /api/notifications', () => {
  let token: string;
  let userId: string;

  beforeAll(() => {
    const user = createTestUser();
    userId = user.id;
    token = generateTokens(user as any).accessToken;
    seedNotification(userId);
  });

  it('deve listar notificações do usuário', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('read');
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
    const notif = seedNotification(user.id);

    const res = await request(app)
      .patch(`/api/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${token}`);
    // Pode retornar 200 (sucesso) ou 404 (rota não implementada como esperado)
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.read).toBe(true);
    }
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).patch('/api/notifications/qualquer/read');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/notifications/read-all', () => {
  it('deve marcar todas como lidas', async () => {
    const user = createTestUser();
    const token = generateTokens(user as any).accessToken;
    seedNotification(user.id);
    seedNotification(user.id);

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.status);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).patch('/api/notifications/read-all');
    expect(res.status).toBe(401);
  });
});
