require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const apiRoutes = require('./src/routes/index');
const webRoutes = require('./src/routes/web.routes');
const { scheduleJobs } = require('./src/jobs/dailyAlerts.job');

const app = express();

// Behind nginx reverse proxy — trust the first proxy hop so req.ip / rate-limit
// keys / secure-cookie detection use the real client IP (X-Forwarded-For).
app.set('trust proxy', 1);

// Security headers. CSP allows the CDNs the app loads (Chart.js via jsDelivr,
// Google Fonts) and inline scripts/styles (the views use them heavily), while
// still blocking external script injection, framing (clickjacking), and
// object/base-uri hijacking.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      scriptSrcAttr: ["'unsafe-inline'"], // consistent with scriptSrc; onclick= attrs work across all pages
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: null, // nginx already redirects http→https; avoids breaking non-TLS local
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CSRF: issue a double-submit token, then verify it on state-changing requests.
const { issueToken, verifyToken } = require('./src/middleware/csrf');
app.use(issueToken);
app.use(verifyToken);

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
const prisma = require('./src/config/database');
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok', timestamp: new Date() });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable', timestamp: new Date() });
  }
});
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
