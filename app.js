const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

const normalizeOrigin = (origin = '') => origin.trim().replace(/\/+$/, '').toLowerCase();

const envOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const fallbackOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://sasewa.org.np',
    'http://sasewa.org.np',
    'https://www.sasewa.org.np',
    'http://www.sasewa.org.np',
];

const allowedOrigins = [...new Set([...fallbackOrigins, ...envOrigins])];
const allowedOriginSet = new Set(allowedOrigins.map(normalizeOrigin));

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser clients such as server-to-server calls or Postman.
        if (!origin) return callback(null, true);

        if (allowedOriginSet.has(normalizeOrigin(origin))) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
};

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

// Health check routes for Render Health Check and UptimeRobot monitoring
// Placed before generalLimiter so monitoring pings are never throttled
const healthHandler = (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };

    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: dbStatusMap[dbState] || 'unknown',
    });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// FIX 13: Apply general rate limiter across all incoming requests
app.use(generalLimiter);

// Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/sponsors', require('./routes/sponsors'));
app.use('/api/messages', require('./routes/messages'));

app.get('/', (req, res) => {
    res.send('Sa-Sewa NGO API is running.');
});

// FIX 12: 404 handler for undefined API routes (Express 5 compatible)
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Fallback 404 for any other undefined routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// FIX 12: Centralized error-handling middleware (must be last)
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack || err.message);

    // Handle CORS error cleanly
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, message: 'Not allowed by CORS policy' });
    }

    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'Internal server error'
            : err.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

module.exports = app;
