const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

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

const allowedOrigins = envOrigins.length > 0 ? envOrigins : fallbackOrigins;
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
app.use(express.json());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

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

module.exports = app;
