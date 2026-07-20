// ==========================================================
// Central application configuration.
// ==========================================================

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5000',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    rememberMeExpiresIn: process.env.JWT_REMEMBER_ME_EXPIRES_IN || '30d',
    resetSecret: process.env.JWT_RESET_SECRET || 'dev_reset_secret_change_me',
    resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || '15m',
  },

  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME || 'QA Portal',
  },

  uploads: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxMb: Number(process.env.MAX_UPLOAD_MB) || 5,
  },

  rateLimit: {
    windowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
    loginMax: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  },

  defaults: {
    qaPassPercentage: Number(process.env.DEFAULT_QA_PASS_PERCENTAGE) || 80,
  },
};
