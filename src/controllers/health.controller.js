function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'elva-otp-service',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
