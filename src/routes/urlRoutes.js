const express = require('express');
const { 
  shortenUrl, 
  redirectUrl, 
  getAnalytics, 
  getAllUrls, 
  deleteUrl, 
  getCacheStats,
  generateQRCode
} = require('../controllers/urlController');
const { generalLimiter, createUrlLimiter } = require('../middleware/rateLimiter');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.use(generalLimiter);

router.post('/shorten', authenticateToken, createUrlLimiter, shortenUrl);

router.get('/analytics/:shortCode', authenticateToken, getAnalytics);

router.get('/allUrls', authenticateToken, getAllUrls);

router.get('/cache/stats', authenticateToken, getCacheStats);

// IMPORTANT: Place wildcard routes LAST to avoid misredirecting
router.get('/qr/:shortCode', generateQRCode);

router.delete('/:shortCode', authenticateToken, deleteUrl)

router.get('/:shortCode', redirectUrl);

module.exports = router;