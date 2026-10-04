const jwt = require('jsonwebtoken');
const User = require('../models/User');

// FIX 3: Check if req.user exists and reject with 401 if user is deleted/disabled
exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'sa_sewa_fallback_secret_key';
        const decoded = jwt.verify(token, secret);
        
        const user = await User.findById(decoded.id).select('-password');
        
        // FIX 3: Explicitly verify req.user exists before calling next()
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User account no longer exists. Please log in again.' 
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized. Invalid or expired token.' });
    }
};

// FIX 15: Optional auth middleware to check for admin session without blocking public visitors
exports.optionalAuth = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const secret = process.env.JWT_SECRET || 'sa_sewa_fallback_secret_key';
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
            req.user = user;
        }
    } catch (err) {
        // Token invalid or expired; proceed unauthenticated
    }
    next();
};
