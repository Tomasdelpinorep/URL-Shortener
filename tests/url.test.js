const request = require('supertest');
const express = require('express');

// Mock the prisma module before importing anything
jest.mock('../src/db/prisma', () => ({
  shortenedUrl: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const urlRoutes = require('../src/routes/urlRoutes');
const prisma = require('../src/db/prisma');

// Create test app
const app = express();
app.use(express.json());
app.use('/api', urlRoutes);

describe('URL Shortener API', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/shorten', () => {
    
    it('should create a short URL with valid input', async () => {
      // Mock database responses
      prisma.shortenedUrl.findUnique.mockResolvedValue(null);
      prisma.shortenedUrl.create.mockResolvedValue({
        id: 1,
        shortCode: 'abc123',
        originalUrl: 'https://www.google.com',
        clicks: 0,
        createdAt: new Date(),
        expiresAt: null
      });
      
      const response = await request(app)
        .post('/api/shorten')
        .send({ originalUrl: 'https://www.google.com' })
        .expect(201);
      
      expect(response.body).toHaveProperty('shortCode');
      expect(response.body).toHaveProperty('originalUrl', 'https://www.google.com');
      expect(response.body.shortCode).toHaveLength(6);
    });
    
    it('should reject invalid URL', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ originalUrl: 'not a url' })
        .expect(400);
      
      expect(response.body.error).toContain('Invalid URL format');
    });
    
    it('should reject missing URL', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('URL is required.');
    });

    it('should reject already taken custom code', async () => {
        // Mock: pretend this code already exists in DB
        prisma.shortenedUrl.findUnique.mockResolvedValue({
            id: 1,
            shortCode: 'taken',
            originalUrl: 'https://other.com'
        });
        
        const response = await request(app)
            .post('/api/shorten')
            .send({ 
            originalUrl: 'https://www.example.com',
            customCode: 'taken'
            })
            .expect(409);
        
        expect(response.body.error).toContain('already taken');
    });

    it('should reject invalid custom code', async () => {
        const response = await request(app)
            .post('/api/shorten')
            .send({ 
            originalUrl: 'https://www.example.com',
            customCode: 'ab'
            })
            .expect(400);
        
        expect(response.body.error).toContain('Custom code must be 3-20 alphanumeric characters');
    });
    
  });
  
  describe('GET /api/allUrls', () => {
    
    it('should return all URLs', async () => {
      prisma.shortenedUrl.findMany.mockResolvedValue([
        {
          id: 1,
          shortCode: 'abc123',
          originalUrl: 'https://www.google.com',
          clicks: 5,
          createdAt: new Date(),
          expiresAt: null
        }
      ]);
      
      const response = await request(app)
        .get('/api/allUrls')
        .expect(200);
      
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('urls');
      expect(Array.isArray(response.body.urls)).toBe(true);
    });
    
  });
  
});