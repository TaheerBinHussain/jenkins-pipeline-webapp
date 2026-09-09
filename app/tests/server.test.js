const request = require('supertest');
const app = require('../src/server');

describe('DevOps WebApp API', () => {
  // ── Health check ──────────────────────────────────────────────────────────
  describe('GET /health', () => {
    test('should return 200 with healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  // ── Version info ──────────────────────────────────────────────────────────
  describe('GET /api/version', () => {
    test('should return version info', async () => {
      const res = await request(app).get('/api/version');
      expect(res.statusCode).toBe(200);
      expect(res.body.app).toBe('DevOps WebApp');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('node');
    });
  });

  // ── Message endpoint ──────────────────────────────────────────────────────
  describe('GET /api/message', () => {
    test('should return a greeting message', async () => {
      const res = await request(app).get('/api/message');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('DevOps WebApp');
      expect(res.body).toHaveProperty('deployedAt');
    });
  });

  // ── 404 handler ───────────────────────────────────────────────────────────
  describe('Unknown routes', () => {
    test('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Route not found');
    });
  });
});
