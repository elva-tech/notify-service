const express = require('express');
const routes = require('./routes');

const app = express();

app.use(express.json());
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
  });
});

module.exports = app;
