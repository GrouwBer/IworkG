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
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('slug');
    expect(res.body[0]).toHaveProperty('icon');
  });
});

describe('GET /api/providers/search', () => {
  it('deve retornar resultados de busca (público)', async () => {
    const res = await request(app).get('/api/providers/search');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('deve filtrar por categoria', async () => {
    const res = await request(app).get('/api/providers/search?category_id=cat-eletricista');
    expect(res.status).toBe(200);
    // Todos os resultados devem ser da categoria (se houver)
    if (res.body.results.length > 0) {
      expect(res.body.results[0]).toHaveProperty('category_name');
    }
  });

  it('deve filtrar por query de texto', async () => {
    const res = await request(app).get('/api/providers/search?query=teste');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
  });
});
