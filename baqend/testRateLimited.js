const Limiter = require('./rateLimiter');

exports.call = function (db, data, req) {
  // Check if IP is rate-limited
  if (Limiter.isRateLimited(req)) {
    throw new Abort('Too many requests');
  }
};
