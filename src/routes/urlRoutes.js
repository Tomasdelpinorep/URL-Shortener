const express = require('express');
const { shortenUrl, redirectUrl, getAnalytics, getAllUrls, deleteUrl } = require('../controllers/urlController');
const { generalLimiter, createUrlLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(generalLimiter);

router.post('/shorten', createUrlLimiter, shortenUrl);

router.get('/analytics/:shortCode', getAnalytics);

router.get('/allUrls', getAllUrls);

// IMPORTANT: Place wildcard routes LAST to avoid misredirecting
router.delete('/:shortCode', deleteUrl)

router.get('/:shortCode', redirectUrl);

module.exports = router;