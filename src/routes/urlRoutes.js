const express = require('express');
const { shortenUrl, redirectUrl } = require('../controllers/urlController');

const router = express.Router();

router.post('/shorten', shortenUrl);

router.get('/:shortCode', redirectUrl);

module.exports = router;