const request = require('supertest');
const express = require('express');

jest.mock('../src/db/prisma', () => ({
  shortenedUrl: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

const urlRoutes = require('../src/routes/urlRoutes');
const prisma = require('../src/db/prisma');

const app = express();
app.use(express.json());
app.use('/api', urlRoutes);

describe('Rate Limiting', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.shortenedUrl.findUnique.mockResolvedValue(null);
    prisma.shortenedUrl.create.mockResolvedValue({
      id: 1,
      shortCode: 'abc123',
      originalUrl: 'https://www.google.com',
      clicks: 0,
      createdAt: new Date(),
      expiresAt: null
    });
  });
  
  it('should allow requests within rate limit', async () => {
    const response = await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'https://www.google.com' });
    
    expect(response.status).toBe(201);
    expect(response.headers['ratelimit-limit']).toBeDefined();
    expect(response.headers['ratelimit-remaining']).toBeDefined();
  });
  
  it('should reject requests exceeding rate limit', async () => {
    // Make 10 requests (the limit)
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/shorten')
        .send({ originalUrl: `https://www.example${i}.com` });
    }
    
    // 11th request should be rate limited
    const response = await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'https://www.example.com' });
    
    expect(response.status).toBe(429);
    expect(response.body.error).toContain('Too many URLs created from this IP. Please try again later.');
  });
  
});