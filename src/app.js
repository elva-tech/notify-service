const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const requestId = require('./middleware/requestId');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

app.use(express.json());
app.use(requestId);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());
app.use(rateLimiter);
app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.use(routes);
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
