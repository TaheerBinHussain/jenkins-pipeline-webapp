const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const ENV = process.env.NODE_ENV || 'development';

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── Health check endpoint ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: APP_VERSION,
    environment: ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ── Version info ───────────────────────────────────────────────────────────
app.get('/api/version', (req, res) => {
  res.json({
    app: 'DevOps WebApp',
    version: APP_VERSION,
    environment: ENV,
    node: process.version
  });
});

// ── API routes ─────────────────────────────────────────────────────────────
app.get('/api/message', (req, res) => {
  res.json({
    message: `Hello from DevOps WebApp v${APP_VERSION}! 🚀`,
    deployedAt: new Date().toISOString()
  });
});

// ── Root route (serve index.html) ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server (only when run directly, not during tests) ───────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅  Server running on port ${PORT}`);
    console.log(`🔖  Version: ${APP_VERSION} | Env: ${ENV}`);
  });
}

module.exports = app;
