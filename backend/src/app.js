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

app.use(express.json());
app.use(requestId);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());
app.use((req, res, next) => {
  if (req.path.startsWith('/ops/')) {
    next();
    return;
  }
  rateLimiter(req, res, next);
});

app.use(routes);

function sendOpsViewer(_req, res) {
  res.sendFile(opsViewerPath);
}

app.get('/', sendOpsViewer);

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
