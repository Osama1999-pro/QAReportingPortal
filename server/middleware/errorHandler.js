// ==========================================================
// Centralized error handling.
// ==========================================================
const { validationResult } = require('express-validator');

/** Call at the top of a controller to short-circuit on express-validator errors. */
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    return true;
  }
  return false;
}

/** 404 handler — mounted after all routes. */
function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Global error handler — mounted last. */
function globalErrorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[error]', err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists.' });
  }
  if (err instanceof multerErrorCheck()) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}

function multerErrorCheck() {
  try {
    return require('multer').MulterError;
  } catch {
    return class Never {};
  }
}

module.exports = { handleValidation, notFound, globalErrorHandler };
