import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import env from './config/env';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log('═'.repeat(60));
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('═'.repeat(60));
  console.log('\n✨ Server ready! Waiting for requests...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing server');
  process.exit(0);
});