import { Router } from 'express';
import healthController from '../controllers/health.controller';

const router = Router();

/**
 * Health Check Routes
 * These endpoints are used by load balancers, orchestration systems,
 * and monitoring tools to verify service health
 */

// Basic health check - returns OK if service is running
router.get('/health', (req, res) => healthController.healthCheck(req, res));

// Readiness check - verifies all dependencies are accessible
router.get('/ready', (req, res) => healthController.readinessCheck(req, res));

// Liveness check - simple ping to verify process is alive
router.get('/live', (req, res) => healthController.livenessCheck(req, res));

// System metrics - detailed system information
router.get('/metrics', (req, res) => healthController.metrics(req, res));

export default router;
