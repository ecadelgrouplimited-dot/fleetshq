const logger = require('../utils/logger');

module.exports = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isApi = req.path.startsWith('/api');

  if (!err.isOperational) {
    logger.error('Unhandled error:', { message: err.message, stack: err.stack, url: req.url });
  }

  if (isApi) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.isOperational ? err.message : 'An unexpected error occurred',
        ...(err.field && { field: err.field }),
      },
    });
  }

  // Web: render error page or redirect
  if (statusCode === 401) return res.redirect('/login');
  if (statusCode === 403) return res.status(403).render('error', { title: 'Access Denied', message: err.message, code: 403 });
  if (statusCode === 404) return res.status(404).render('error', { title: 'Not Found', message: 'The page you are looking for does not exist.', code: 404 });

  logger.error(err.message, { stack: err.stack });
  res.status(500).render('error', { title: 'Server Error', message: 'Something went wrong. Please try again.', code: 500 });
};
