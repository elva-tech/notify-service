const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const requestId = require('./middleware/requestId');
const rateLimiter = require('./middleware/rateLimiter');
require('./businesses');
const { listBusinesses } = require('./businesses');

const app = express();
const publicDir = path.join(__dirname, '../public');
const opsViewerPath = path.join(publicDir, 'ops.html');
const opsRawViewerPath = path.join(publicDir, 'ops-raw.html');

app.use(express.json());
app.use(requestId);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Ops-Admin-Token', 'Authorization'],
}));
app.options('*', cors());
app.use((req, res, next) => {
  if (req.path.startsWith('/ops/')) {
    next();
    return;
  }

  // Public portal metadata and onboarding should not share the tight API rate bucket.
  if (req.path.startsWith('/integrations')) {
    next();
    return;
  }

  if (req.path === '/health' || req.path.startsWith('/health/')) {
    next();
    return;
  }

  if (req.method === 'GET' && req.path.startsWith('/platform')) {
    next();
    return;
  }

  rateLimiter(req, res, next);
});

app.use(routes);

function sendOpsViewer(_req, res) {
  res.sendFile(opsViewerPath);
}

function sendRawOpsViewer(_req, res) {
  res.sendFile(opsRawViewerPath);
}

app.get('/', sendOpsViewer);
app.get('/raw', sendRawOpsViewer);

for (const businessId of listBusinesses()) {
  app.get(`/${businessId}`, sendOpsViewer);
}

app.get('/playground-legacy', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use(express.static(publicDir));

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({
    success: false,
    error: 'internal_error',
    message: 'An unexpected error occurred',
    requestId: req.requestId,
  });
});

module.exports = app;
