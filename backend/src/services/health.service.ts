import prisma from '../config/database';
import resend from '../config/resend';
import { v2 as cloudinary } from 'cloudinary';
import { getRequestLogs } from '../middleware/logger.middleware';

interface ServiceStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  message?: string;
  responseTime?: number;
}

export const checkDatabaseConnection = async (): Promise<ServiceStatus> => {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    return {
      name: 'Database (PostgreSQL)',
      status: 'connected',
      responseTime,
    };
  } catch (error: any) {
    return {
      name: 'Database (PostgreSQL)',
      status: 'error',
      message: error.message || 'Connection failed',
    };
  }
};

export const checkEmailService = async (): Promise<ServiceStatus> => {
  const startTime = Date.now();
  try {
    // Test Resend API by checking if API key is valid
    // We can't actually send a test email without charges, so we just verify the client is configured
    if (resend) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'Email Service (Resend)',
        status: 'connected',
        responseTime,
        message: 'API key configured',
      };
    }
    return {
      name: 'Email Service (Resend)',
      status: 'disconnected',
      message: 'API key not configured',
    };
  } catch (error: any) {
    return {
      name: 'Email Service (Resend)',
      status: 'error',
      message: error.message || 'Service unavailable',
    };
  }
};

export const checkCloudinaryService = async (): Promise<ServiceStatus> => {
  const startTime = Date.now();
  try {
    // Test Cloudinary by checking configuration
    if (cloudinary.config().cloud_name) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'Image Storage (Cloudinary)',
        status: 'connected',
        responseTime,
        message: 'Configuration valid',
      };
    }
    return {
      name: 'Image Storage (Cloudinary)',
      status: 'disconnected',
      message: 'Not configured',
    };
  } catch (error: any) {
    return {
      name: 'Image Storage (Cloudinary)',
      status: 'error',
      message: error.message || 'Service unavailable',
    };
  }
};

export const getSystemHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: ServiceStatus[];
  statistics: {
    totalRequests: number;
    recentRequests: number;
    averageResponseTime: number;
  };
}> => {
  // Check all services
  const [database, email, cloudinary] = await Promise.all([
    checkDatabaseConnection(),
    checkEmailService(),
    checkCloudinaryService(),
  ]);

  const services = [database, email, cloudinary];
  
  // Determine overall status
  const hasErrors = services.some(s => s.status === 'error');
  const hasDisconnected = services.some(s => s.status === 'disconnected');
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (hasErrors) {
    overallStatus = 'unhealthy';
  } else if (hasDisconnected) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  // Get request statistics
  const requestLogs = getRequestLogs();
  const recentRequests = requestLogs.slice(0, 20); // Last 20 requests
  const totalRequests = requestLogs.length;
  
  const responseTimes = requestLogs
    .filter(log => log.responseTime !== undefined)
    .map(log => log.responseTime!);
  
  const averageResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services,
    statistics: {
      totalRequests,
      recentRequests: recentRequests.length,
      averageResponseTime,
    },
  };
};

export const getDetailedHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: ServiceStatus[];
  statistics: {
    totalRequests: number;
    recentRequests: any[];
    averageResponseTime: number;
    requestsByMethod: Record<string, number>;
    requestsByStatus: Record<string, number>;
  };
  environment: {
    nodeVersion: string;
    environment: string;
    port: string;
  };
}> => {
  const health = await getSystemHealth();
  const requestLogs = getRequestLogs();

  // Group by method
  const requestsByMethod: Record<string, number> = {};
  requestLogs.forEach(log => {
    requestsByMethod[log.method] = (requestsByMethod[log.method] || 0) + 1;
  });

  // Group by status code
  const requestsByStatus: Record<string, number> = {};
  requestLogs.forEach(log => {
    if (log.statusCode) {
      const statusGroup = Math.floor(log.statusCode / 100) + 'xx';
      requestsByStatus[statusGroup] = (requestsByStatus[statusGroup] || 0) + 1;
    }
  });

  return {
    ...health,
    statistics: {
      ...health.statistics,
      recentRequests: requestLogs.slice(0, 50), // Last 50 requests with full details
      requestsByMethod,
      requestsByStatus,
    },
    environment: {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '5000',
    },
  };
};

