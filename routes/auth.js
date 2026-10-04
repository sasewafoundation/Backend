const express = require('express');
const { register, login } = require('../controllers/auth');
const { optionalAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// FIX 1 & FIX 13: Protected registration with rate limiting and optional auth context
router.post('/register', authLimiter, optionalAuth, register);
router.post('/login', authLimiter, login);

module.exports = router;
