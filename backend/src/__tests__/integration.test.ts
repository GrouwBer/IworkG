/**
 * Testes de integração — Fluxo completo: cliente busca → contato → avaliação.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { generateTokens } from '../services/token';

function createUser(role: string = 'client', name?: string, phone?: string) {
  const id = uuidv4();
  const p = phone || `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
  db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)').run(id, name || `Teste ${role}`, p, role);
  return { id, phone: p, role, name: name || `Teste ${role}` };
}

function authHeader(user: any) {
  return { Authorization: `Bearer ${generateTokens(user).accessToken}` };
}

// ─── Helpers: seed categories + provider ───

function ensureCategories() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as any).c;
  if (count === 0) {
    db.prepare("INSERT INTO categories (id, name, slug, icon) VALUES ('cat-eletricista', 'Eletricista', 'eletricista', '⚡')").run();
    db.prepare("INSERT INTO categories (id, name, slug, icon) VALUES ('cat-pedreiro', 'Pedreiro', 'pedreiro', '🧱')").run();
  }
}

function createProviderProfile(userId: string) {
  ensureCategories();
  const profileId = uuidv4();
  db.prepare(`INSERT INTO provider_profiles (id, user_id, category_id, description, city, state) VALUES (?, ?, 'cat-eletricista', 'Serviços elétricos', 'São Paulo', 'SP')`)
    .run(profileId, userId);
  db.prepare("UPDATE users SET role = 'provider' WHERE id = ?").run(userId);
  return profileId;
}

// ═══════════════════════════════════════════════
// Fluxo 1: Cliente busca prestador → contato → avalia
// ═══════════════════════════════════════════════

describe('Fluxo integrado: cliente → busca → contato → avaliação', () => {
  let client: any;
  let provider: any;
  let providerProfileId: string;
  let contactId: string;

  beforeAll(() => {
    client = createUser('client', 'Maria Cliente');
    provider = createUser('provider', 'João Eletricista');
    providerProfileId = createProviderProfile(provider.id);
  });

  it('1. Cliente busca prestadores por categoria', async () => {
    const res = await request(app)
      .get('/api/providers/search?category_id=cat-eletricista&lat=-23.55&lng=-46.63')
      .set(authHeader(client));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((p: any) => p.name === 'João Eletricista');
    expect(found).toBeDefined();
    expect(found.category_name).toBe('Eletricista');
  });

  it('2. Cliente vê perfil público do prestador', async () => {
    const res = await request(app)
      .get(`/api/providers/${provider.id}`)
      .set(authHeader(client));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('João Eletricista');
    expect(res.body.category).toBeDefined();
  });

  it('3. Cliente publica um pedido', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set(authHeader(client))
      .send({
        title: 'Troca de disjuntor',
        description: 'Disjuntor desarmando constantemente',
        category_id: 'cat-eletricista',
        urgency: 'Alta',
        city: 'São Paulo',
        state: 'SP',
        latitude: -23.55,
        longitude: -46.63,
      });

    expect(res.status).toBe(201);
    expect(res.body.request.title).toBe('Troca de disjuntor');
  });

  it('4. Prestador vê pedido no mural', async () => {
    const res = await request(app)
      .get('/api/requests/open?lat=-23.55&lng=-46.63&radius_km=50')
      .set(authHeader(provider));

    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0].title).toBe('Troca de disjuntor');
  });

  it('5. Registra contato entre cliente e prestador', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set(authHeader(client))
      .send({ provider_id: provider.id, contact_type: 'direct' });

    expect(res.status).toBe(201);
    contactId = res.body.contact?.id || res.body.id;
  });

  it('6. Cliente avalia o prestador', async () => {
    const res = await request(app)
      .post(`/api/providers/${provider.id}/reviews`)
      .set(authHeader(client))
      .send({ rating: 5, comment: 'Excelente serviço!', contactId });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
  });

  it('7. Verifica que a avaliação aparece no perfil', async () => {
    const res = await request(app)
      .get(`/api/providers/${provider.id}/reviews`)
      .set(authHeader(client));

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].rating).toBe(5);
    expect(res.body[0].client.name).toBe('Maria Cliente');
  });
});

// ═══════════════════════════════════════════════
// Fluxo 2: Prestador — wizard → portfólio → status
// ═══════════════════════════════════════════════

describe('Fluxo integrado: prestador → cadastro → status', () => {
  let providerUser: any;

  beforeAll(() => {
    providerUser = createUser('client', 'Carlos Prestador');
    ensureCategories();
  });

  it('1. Wizard — consulta estado inicial', async () => {
    const res = await request(app)
      .get('/api/providers/wizard')
      .set(authHeader(providerUser));

    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe(1);
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  it('2. Wizard — salva progresso', async () => {
    const res = await request(app)
      .put('/api/providers/wizard')
      .set(authHeader(providerUser))
      .send({ step: 2, data: { categories: ['cat-eletricista'] } });

    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe(2);
  });

  it('3. Wizard — completa cadastro', async () => {
    const res = await request(app)
      .post('/api/providers/wizard/complete')
      .set(authHeader(providerUser))
      .send({
        categories: ['cat-eletricista'],
        description: 'Eletricista com 10 anos de experiência',
        experience_years: 10,
        service_radius_km: 20,
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
      });

    expect(res.status).toBe(201);
    expect(res.body.profile.serviceRadiusKm).toBe(20);
  });

  it('4. Perfil próprio retorna dados corretos', async () => {
    const res = await request(app)
      .get('/api/providers/me')
      .set(authHeader(providerUser));

    expect(res.status).toBe(200);
    expect(res.body.serviceRadiusKm).toBe(20);
    expect(res.body.description).toBe('Eletricista com 10 anos de experiência');
  });
});

// ═══════════════════════════════════════════════
// Fluxo 3: Notificações
// ═══════════════════════════════════════════════

describe('Fluxo integrado: notificações', () => {
  let user: any;

  beforeAll(() => {
    user = createUser('client', 'Ana Notificada');
  });

  it('1. Lista notificações vazia', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(0);
  });

  it('2. Preferências padrão', async () => {
    const res = await request(app)
      .get('/api/notifications/preferences')
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.new_requests).toBe(1);
    expect(res.body.promotions).toBe(0);
  });

  it('3. Atualiza preferências', async () => {
    const res = await request(app)
      .put('/api/notifications/preferences')
      .set(authHeader(user))
      .send({ promotions: 1, interests: 0 });

    expect(res.status).toBe(200);

    const check = await request(app)
      .get('/api/notifications/preferences')
      .set(authHeader(user));

    expect(check.body.promotions).toBe(1);
    expect(check.body.interests).toBe(0);
  });
});
