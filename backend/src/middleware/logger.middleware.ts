import { Request, Response, NextFunction } from 'express';

interface RequestLog {
  method: string;
  path: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  statusCode?: number;
  responseTime?: number;
}

// Store recent requests (last 100)
const requestLogs: RequestLog[] = [];
const MAX_LOGS = 100;

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log request details
  const log: RequestLog = {
    method: req.method,
    path: req.path,
    timestamp,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent'),
    userId: req.userId,
  };

  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    log.statusCode = res.statusCode;
    log.responseTime = responseTime;

    // Add to logs array
    requestLogs.push(log);

    // Keep only last MAX_LOGS
    if (requestLogs.length > MAX_LOGS) {
      requestLogs.shift();
    }

    // Console log with colors
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : // Red for 5xx
                       res.statusCode >= 400 ? '\x1b[33m' : // Yellow for 4xx
                       res.statusCode >= 300 ? '\x1b[36m' : // Cyan for 3xx
                       '\x1b[32m'; // Green for 2xx
    
    const resetColor = '\x1b[0m';
    console.log(
      `${statusColor}${req.method}${resetColor} ${req.path} ${statusColor}${res.statusCode}${resetColor} - ${responseTime}ms - ${timestamp}`
    );
  });

  next();
};

export const getRequestLogs = (): RequestLog[] => {
  return [...requestLogs].reverse(); // Return most recent first
};

export const clearRequestLogs = (): void => {
  requestLogs.length = 0;
};

