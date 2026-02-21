import { createServer } from './server';

const PORT = parseInt(process.env.PORT || '8099', 10);

const relay = createServer(PORT);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  await relay.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await relay.stop();
  process.exit(0);
});

relay.start();
