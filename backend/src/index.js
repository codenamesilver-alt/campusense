require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crudRoutes = require('./routes/crud');
const authRoutes = require('./routes/auth');
const integrationRoutes = require('./routes/integrations');
const functionRoutes = require('./routes/functions');
const approvalRoutes = require('./routes/approvals');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('query parser', 'extended');
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check (also works as Vercel root)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'campusense-backend', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/integrations/Core', integrationRoutes);
app.use('/api/entities', crudRoutes);
app.use('/api/functions', functionRoutes);
app.use('/api/approvals', approvalRoutes);

// Serve built frontend (production only)
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// Start server locally (Vercel ignores this)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Campusense backend running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
