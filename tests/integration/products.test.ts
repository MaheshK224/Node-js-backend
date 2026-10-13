import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { prisma, resetDatabase } from '../helpers/db.js';

/**
 * Integration test: real HTTP requests through Express, real test database.
 * Requires the inventory_test database: `npm run db:deploy:test` once before `npm test`.
 */
const app = createApp();

async function createCategory(name = 'Electronics'): Promise<string> {
  const res = await request(app).post('/api/v1/categories').send({ name });
  return res.body.data.id as string;
}

describe('Products API', () => {
  let categoryId: string;

  beforeEach(async () => {
    await resetDatabase();
    categoryId = await createCategory();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a product with defaults and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .send({ name: 'iPhone 16', sku: 'apl-ip16', price: 799.99, categoryId });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: 'iPhone 16',
      sku: 'APL-IP16', // normalised to upper case
      price: '799.99', // Decimal comes back as string
      stock: 0, // default
      isActive: true, // default
      category: { id: categoryId, name: 'Electronics' },
    });
    expect(res.body.data).not.toHaveProperty('deletedAt');
  });

  it('returns 400 with details for invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .send({ name: 'X', sku: 'a b', price: -5, categoryId: 'not-a-uuid' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = (res.body.error.details as { path: string }[]).map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'sku', 'price', 'categoryId']));
  });

  it('returns 409 for a duplicate SKU', async () => {
    const product = { name: 'Phone', sku: 'DUP-1', price: 10, categoryId };
    await request(app).post('/api/v1/products').send(product);
    const res = await request(app).post('/api/v1/products').send(product);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('lists products with pagination, filtering and sorting', async () => {
    for (const [i, price] of [10, 30, 20].entries()) {
      await request(app)
        .post('/api/v1/products')
        .send({ name: `Product ${i}`, sku: `SKU-${i}`, price, categoryId });
    }

    const res = await request(app).get('/api/v1/products?sort=-price&limit=2&minPrice=15');

    expect(res.status).toBe(200);
    expect(res.body.data.map((p: { price: string }) => p.price)).toEqual(['30', '20']);
    expect(res.body.meta.pagination).toMatchObject({ page: 1, limit: 2, totalItems: 2 });
  });

  it('PATCH updates only the given fields', async () => {
    const created = await request(app)
      .post('/api/v1/products')
      .send({ name: 'Kettle', sku: 'KET-1', price: 20, stock: 7, categoryId });

    const res = await request(app)
      .patch(`/api/v1/products/${created.body.data.id}`)
      .send({ price: 25.5 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ price: '25.5', stock: 7 });
  });

  it('soft deletes a product', async () => {
    const created = await request(app)
      .post('/api/v1/products')
      .send({ name: 'Old item', sku: 'OLD-1', price: 5, categoryId });
    const id = created.body.data.id as string;

    expect((await request(app).delete(`/api/v1/products/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/v1/products/${id}`)).status).toBe(404);

    // Row still exists in the database, only marked as deleted.
    const row = await prisma.product.findUnique({ where: { id } });
    expect(row?.deletedAt).toBeInstanceOf(Date);
  });

  it('rejects a product for a category that does not exist', async () => {
    const res = await request(app).post('/api/v1/products').send({
      name: 'Ghost',
      sku: 'GHOST-1',
      price: 1,
      categoryId: '00000000-0000-4000-8000-000000000000',
    });

    expect(res.status).toBe(400);
  });
});
