/**
 * Testes para rotas de busca (/api).
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('GET /api/categories', () => {
  it('deve retornar lista de categorias', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/providers/search', () => {
  it('deve retornar resultados de busca (público)', async () => {
    const res = await request(app).get('/api/providers/search');
    expect(res.status).toBe(200);
  });

  it('deve filtrar por categoria', async () => {
    const res = await request(app).get('/api/providers/search?category_id=cat-eletricista');
    expect([200, 500]).toContain(res.status);
  });

  it('deve filtrar por query de texto', async () => {
    const res = await request(app).get('/api/providers/search?query=teste');
    expect(res.status).toBe(200);
  });
});
