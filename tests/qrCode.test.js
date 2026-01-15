const request = require('supertest');
const express = require('express');

jest.mock('../src/db/prisma', () => ({
  shortenedUrl: {
    findUnique: jest.fn()
  }
}));

jest.mock('../src/db/redis', () => ({
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn()
}));

const urlRoutes = require('../src/routes/urlRoutes');
const prisma = require('../src/db/prisma');

const app = express();
app.use(express.json());
app.use('/api', urlRoutes);

describe('QR Code Generation', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should generate QR code for valid short code', async () => {
    prisma.shortenedUrl.findUnique.mockResolvedValue({
      id: 1,
      shortCode: 'abc123',
      originalUrl: 'https://www.github.com',
      clicks: 0,
      createdAt: new Date(),
      expiresAt: null
    });
    
    const response = await request(app)
      .get('/api/qr/abc123')
      .expect(200);
    
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.body).toBeInstanceOf(Buffer);
  });
  
  it('should return 404 for non-existent short code', async () => {
    prisma.shortenedUrl.findUnique.mockResolvedValue(null);
    
    const response = await request(app)
      .get('/api/qr/nonexistent')
      .expect(404);
    
    expect(response.body.error).toBe('Short URL not found.');
  });
  
  it('should generate SVG format QR code', async () => {
    prisma.shortenedUrl.findUnique.mockResolvedValue({
      id: 1,
      shortCode: 'abc123',
      originalUrl: 'https://www.github.com',
      clicks: 0,
      createdAt: new Date(),
      expiresAt: null
    });
    
    const response = await request(app)
      .get('/api/qr/abc123?format=svg')
      .expect(200);
    
    expect(response.headers['content-type']).toContain('image/svg+xml');
    expect(response.body.toString()).toContain('<svg');
  });
  
  it('should generate JSON format with data URL', async () => {
    prisma.shortenedUrl.findUnique.mockResolvedValue({
      id: 1,
      shortCode: 'abc123',
      originalUrl: 'https://www.github.com',
      clicks: 0,
      createdAt: new Date(),
      expiresAt: null
    });
    
    const response = await request(app)
      .get('/api/qr/abc123?format=json')
      .expect(200);
    
    expect(response.body).toHaveProperty('shortCode', 'abc123');
    expect(response.body).toHaveProperty('qrCode');
    expect(response.body.qrCode).toContain('data:image/png;base64');
  });
  
});