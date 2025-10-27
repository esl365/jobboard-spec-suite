/**
 * Health Check Endpoint
 *
 * GET /api/v1/health
 *
 * Returns service status and current timestamp.
 * No authentication required.
 *
 * Implements:
 * - Issue #20: [Feature] Health Check Endpoint
 * - OpenAPI spec: /health endpoint
 */

export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string; // ISO 8601 format
}

/**
 * Health check handler
 *
 * @returns HealthCheckResponse with current status and timestamp
 */
export async function healthCheckHandler(): Promise<HealthCheckResponse> {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Express route handler example
 *
 * Usage:
 * ```typescript
 * import express from 'express';
 * import { healthCheckHandler } from './routes/health';
 *
 * const app = express();
 *
 * app.get('/api/v1/health', async (req, res) => {
 *   const response = await healthCheckHandler();
 *   res.status(200).json(response);
 * });
 * ```
 */
export function registerHealthRoute(app: any) {
  app.get('/api/v1/health', async (req: any, res: any) => {
    try {
      const response = await healthCheckHandler();
      res.status(200).json(response);
    } catch (error) {
      // Health check should always succeed unless system is critically down
      res.status(503).json({
        status: 'error',
        message: 'Service unavailable',
      });
    }
  });
}
