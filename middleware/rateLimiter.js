const rateLimit = require('express-rate-limit');

// FIX 13: General rate limiter for all endpoints (100 reqs / 15 mins)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});

// FIX 13: Auth rate limiter (10 reqs / 15 mins) to prevent brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.'
    }
});

// FIX 13: Form rate limiter (5 reqs / 15 mins) to protect public contact, volunteer, and donation endpoints from spam
const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Submission limit reached. Please wait 15 minutes before submitting again.'
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    formLimiter
};
