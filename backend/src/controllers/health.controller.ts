import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

/**
 * Health Check Controller
 * Provides endpoints for monitoring application health and readiness
 */
export class HealthController {
  /**
   * Basic health check - returns OK if service is running
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    });
  }

  /**
   * Readiness check - verifies all dependencies are accessible
   */
  async readinessCheck(req: Request, res: Response): Promise<void> {
    const checks: Record<string, any> = {
      database: { status: 'unknown' },
      sharefile: { status: 'unknown' },
      openai: { status: 'unknown' },
    };

    let overallStatus = 'healthy';
    let httpStatus = 200;

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'healthy',
        message: 'Database connection successful',
      };
    } catch (error: any) {
      checks.database = {
        status: 'unhealthy',
        message: error.message,
      };
      overallStatus = 'unhealthy';
      httpStatus = 503;
    }

    // Check ShareFile configuration
    try {
      const requiredShareFileVars = [
        'SHAREFILE_CLIENT_ID',
        'SHAREFILE_CLIENT_SECRET',
        'SHAREFILE_API_URL',
      ];
      const missingVars = requiredShareFileVars.filter(
        (v) => !process.env[v]
      );

      if (missingVars.length > 0) {
        checks.sharefile = {
          status: 'warning',
          message: `Missing configuration: ${missingVars.join(', ')}`,
        };
      } else {
        checks.sharefile = {
          status: 'healthy',
          message: 'ShareFile configuration present',
        };
      }
    } catch (error: any) {
      checks.sharefile = {
        status: 'warning',
        message: error.message,
      };
    }

    // Check OpenAI configuration
    try {
      if (!process.env.OPENAI_API_KEY) {
        checks.openai = {
          status: 'warning',
          message: 'OpenAI API key not configured',
        };
      } else {
        checks.openai = {
          status: 'healthy',
          message: 'OpenAI configuration present',
        };
      }
    } catch (error: any) {
      checks.openai = {
        status: 'warning',
        message: error.message,
      };
    }

    res.status(httpStatus).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    });
  }

  /**
   * Liveness check - simple ping to verify process is alive
   */
  async livenessCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * System metrics endpoint
   */
  async metrics(req: Request, res: Response): Promise<void> {
    const memUsage = process.memoryUsage();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        unit: 'MB',
      },
      cpu: {
        user: process.cpuUsage().user,
        system: process.cpuUsage().system,
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
      },
    });
  }
}

export default new HealthController();
