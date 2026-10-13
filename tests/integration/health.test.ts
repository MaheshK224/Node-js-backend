import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

const app = createApp();

describe('Health & common behaviour', () => {
  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('GET /api/v1/health/ready checks the database', async () => {
    const res = await request(app).get('/api/v1/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.data.database.status).toBe('up');
  });

  it('adds an X-Request-Id header to every response', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('keeps a valid X-Request-Id sent by the client', async () => {
    const res = await request(app).get('/api/v1/health').set('X-Request-Id', 'my-trace-123');
    expect(res.headers['x-request-id']).toBe('my-trace-123');
  });

  it('returns the standard error shape for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
