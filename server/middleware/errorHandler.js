function errorHandler(err, req, res, next) {
  console.error('API Error:', {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const errMsg = err.userMessage || err.message || 'An unexpected error occurred. Please contact support.';

  res.status(statusCode).json({
    success: false,
    error: errMsg,
    message: errMsg,
    code: err.code || 'INTERNAL_ERROR'
  });
}

module.exports = {
  errorHandler
};
