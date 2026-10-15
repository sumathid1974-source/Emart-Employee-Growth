const app = require('./app');
const { config, validateConfig } = require('./config');
const { runMigrations } = require('./db/migrate');
const { seedDatabase } = require('./db/seed');
const db = require('./db/connection');

async function startServer() {
  try {
    validateConfig();

    console.log('Initializing EmployeeHub Enterprise Backend...');
    await runMigrations();
    await seedDatabase();

    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`EmployeeHub Full-Stack Server Running on Port ${config.port}`);
      console.log(`Environment: ${config.env}`);
      console.log(`Database Client: ${config.db.client}`);
      console.log(`Frontend URL: http://localhost:${config.port}`);
      console.log(`API Health: http://localhost:${config.port}/api/health`);
      console.log(`====================================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await db.close();
        console.log('Database connections closed. Process terminating.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer
};
