const express = require('express');
const { shortenUrl, redirectUrl, getAnalytics, getAllUrls } = require('../controllers/urlController');

const router = express.Router();

router.post('/shorten', shortenUrl);

router.get('/analytics/:shortCode', getAnalytics);

router.get('/allUrls', getAllUrls);

// IMPORTANT: Place wildcard routes LAST to avoid misredirecting
router.get('/:shortCode', redirectUrl);

module.exports = router;