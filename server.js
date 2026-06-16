require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const apiRoutes = require('./src/routes/index');
const webRoutes = require('./src/routes/web.routes');
const { scheduleJobs } = require('./src/jobs/dailyAlerts.job');

const app = express();

// Security headers (relaxed for demo — allows CDN scripts)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// HTTP logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.url === '/health',
}));

// Rate limiting on API
app.use('/api', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/api/v1', apiRoutes);
app.use('/', webRoutes);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`256 Logistics Compliance Hub running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'test') scheduleJobs();
  });
}

module.exports = app;
