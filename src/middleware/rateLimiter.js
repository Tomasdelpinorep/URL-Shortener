const rateLimit = require('express-rate-limit');

// Specific limiter for creting short URLs
const createUrlLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Maximum of 10 requests per hour
    message: {
        error: 'Too many URLs created from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 1 hour
    max: 10, // Maximum of 10 requests per hour
    message: {
        error: 'Too many requests from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { createUrlLimiter, generalLimiter };