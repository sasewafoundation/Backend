const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register admin
// @route   POST /api/auth/register
// @access  Restricted (First-admin only OR authenticated admin with secret)
// FIX 1: Secure admin registration with first-admin check and admin secret
exports.register = async (req, res) => {
    try {
        const { name, email, password, adminSecret } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
        }

        // Secondary gate: Validate ADMIN_REGISTRATION_SECRET if defined
        const requiredSecret = process.env.ADMIN_REGISTRATION_SECRET;
        if (requiredSecret && adminSecret !== requiredSecret) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid registration secret key.' 
            });
        }

        // Check if any admin already exists in the database
        const adminCount = await User.countDocuments();

        // If admins already exist, caller MUST be an authenticated admin
        if (adminCount > 0 && !req.user) {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin registration is closed. Please contact an existing administrator to create new accounts.' 
            });
        }

        const user = await User.create({ name, email, password });
        sendTokenResponse(user, 201, res);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'An account with that email already exists.' });
        }
        res.status(400).json({ success: false, message: err.message || 'Registration failed.' });
    }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const sendTokenResponse = (user, statusCode, res) => {
    const secret = process.env.JWT_SECRET || 'sa_sewa_fallback_secret_key';
    const expiresIn = process.env.JWT_EXPIRE || '30d';

    const token = jwt.sign({ id: user._id }, secret, { expiresIn });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });
};
