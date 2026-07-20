// ==========================================================
// QA PORTAL — Application entrypoint.
// ==========================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config/config');
const { testConnection } = require('./config/jsonStore');
const { helmetMiddleware, apiLimiter, xssSanitize } = require('./middleware/security');
const { notFound, globalErrorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const teamRoutes = require('./routes/teamRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const coachingRoutes = require('./routes/coachingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const exportRoutes = require('./routes/exportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

/* ---------------- Core middleware ---------------- */
app.use(helmetMiddleware);
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiLimiter);
app.use(xssSanitize);

/* ---------------- Static assets ---------------- */
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', config.uploads.dir)));

/* ---------------- Health check ---------------- */
app.get('/api/health', (req, res) => res.json({ success: true, message: 'QA Portal API is running.', env: config.env }));

/* ---------------- API routes ---------------- */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/coaching', coachingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/search', searchRoutes);

/* ---------------- SPA fallback for the frontend pages ---------------- */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), (err) => {
    if (err) next();
  });
});

/* ---------------- 404 + error handling (must be last) ---------------- */
app.use('/api', notFound);
app.use(globalErrorHandler);

/* ---------------- Boot (skip listen on Vercel serverless) ---------------- */
testConnection();

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log('==================================================');
    console.log('  QA PORTAL API');
    console.log(`  Environment : ${config.env}`);
    console.log(`  Listening on: http://localhost:${config.port}`);
    console.log('==================================================');
  });
}

module.exports = app;
