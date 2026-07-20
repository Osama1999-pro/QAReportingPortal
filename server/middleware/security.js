// ==========================================================
// Security middleware: Helmet headers, rate limiting, XSS sanitization.
//
// Note on CSRF: this API is stateless and authenticates every request
// via a JWT sent in the Authorization header (not via cookies), so
// classic cookie-based CSRF does not apply here — CSRF exploits rely on
// the browser automatically attaching cookies to a forged request, and
// no cookie carries the auth token. If you switch to storing the JWT in
// an httpOnly cookie, add the `csurf` middleware (or a double-submit
// token) on all state-changing routes at that point.
// ==========================================================
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { filterXSS } = require('xss');
const config = require('../config/config');

const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
});

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  max: config.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

/** Recursively strips dangerous HTML/script content from string fields in the request body. */
function xssSanitize(req, res, next) {
  const clean = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return filterXSS(obj);
    if (Array.isArray(obj)) return obj.map(clean);
    if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        obj[key] = clean(obj[key]);
      }
      return obj;
    }
    return obj;
  };
  if (req.body) req.body = clean(req.body);
  next();
}

module.exports = { helmetMiddleware, apiLimiter, loginLimiter, xssSanitize };
