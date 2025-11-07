hereconst rateLimit = require('express-rate-limit');

// Different rate limits for different routes
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: {
            error: 'Too many requests',
            message: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Rate limit exceeded',
                message: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// API rate limits
const apiLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Too many API requests from this IP'
);

// Page view rate limits  
const pageLimiter = createRateLimit(
    60 * 1000, // 1 minute
    30, // 30 page views per minute
    'Too many page views from this IP'
);

// File upload rate limits
const uploadLimiter = createRateLimit(
    60 * 60 * 1000, // 1 hour
    10, // 10 uploads per hour
    'Too many file uploads from this IP'
);

// Authentication rate limits
const authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 login attempts per window
    'Too many authentication attempts'
);

module.exports = {
    apiLimiter,
    pageLimiter, 
    uploadLimiter,
    authLimiter
};
