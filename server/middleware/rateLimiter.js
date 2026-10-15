/**
 * In-memory sliding window rate limiter
 */
function createRateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 5,
  message = 'Too many requests. Please try again later.'
}) {
  const hits = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let clientRecord = hits.get(ip);
    if (!clientRecord) {
      clientRecord = { timestamps: [] };
      hits.set(ip, clientRecord);
    }

    // Filter out timestamps outside the sliding window
    clientRecord.timestamps = clientRecord.timestamps.filter(t => now - t < windowMs);

    if (clientRecord.timestamps.length >= max) {
      const retryAfterSecs = Math.ceil((windowMs - (now - clientRecord.timestamps[0])) / 1000);
      res.setHeader('Retry-After', retryAfterSecs);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfterSecs
      });
    }

    clientRecord.timestamps.push(now);
    next();
  };
}

module.exports = {
  createRateLimiter,
  authRateLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  }),
  apiRateLimiter: createRateLimiter({
    windowMs: 60 * 1000,
    max: 200,
    message: 'Rate limit exceeded. Please throttle your requests.'
  })
};
