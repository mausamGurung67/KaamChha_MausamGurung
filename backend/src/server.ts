import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import env from './config/env';
import { initSocketIO } from './socket';

const PORT = env.PORT || 5000;

// Create an HTTP server so Socket.IO and Express share the same port
const server = http.createServer(app);

// Attach Socket.IO
initSocketIO(server);

server.listen(PORT, () => {
  console.log('═'.repeat(60));
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`⚡ WebSocket:    ws://localhost:${PORT}`);
  console.log('═'.repeat(60));
  console.log('\n✨ Server ready! Waiting for requests...\n');
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received: closing server`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));