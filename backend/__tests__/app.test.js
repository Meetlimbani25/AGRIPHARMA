const request = require('supertest');
const app = require('../server');

// Mock database initialization to prevent side-effects during tests
jest.mock('../initDb', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(true)
}));

// Mock sequelize to prevent connection hanging
jest.mock('../config/sequelize', () => {
  const SequelizeMock = require('sequelize');
  return {
    define: jest.fn(),
    authenticate: jest.fn().mockResolvedValue(true)
  };
});

describe('API Core & Routing Tests', () => {
  it('should return 200 on the root health-check route', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('running');
  });

  it('should return 404 for an unknown route', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });
});

describe('Authentication API Tests', () => {
  it('should return 400 when logging in without credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({}); // Empty body
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('should return 400 when registering with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User' }); // Missing mobile and password
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when sending SSO login without credential', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ role: 'farmer' }); // Missing credential
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('required');
  });
});
