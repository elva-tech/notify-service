const app = require('./app');
const { port, nodeEnv } = require('./config/env');
const { connectRedis } = require('./services/redis.service');

async function start() {
  await connectRedis();
  app.listen(port, () => {
    console.log(`elva-otp-service listening on port ${port} (${nodeEnv})`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
