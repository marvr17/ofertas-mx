import { initTelegramBot } from './services/telegram';
import { startWorkers } from './services/worker';
import { startServer } from './api/server';
import { config } from './config';
import prisma from './db';

async function main() {
  console.log('🚀 Starting Ofertas - Price Tracker & Deal Hunter\n');

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Initialize Telegram bot
  initTelegramBot();

  // Start workers (cron jobs)
  startWorkers();

  // Start API server
  const port = parseInt(process.env.PORT || '3000');
  startServer(port);

  console.log('\n✨ System is running!\n');

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
