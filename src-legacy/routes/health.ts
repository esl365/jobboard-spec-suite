/**
 * Health Check Endpoint
 *
 * Provides a simple health check endpoint to verify service availability.
 * No authentication required.
 */

export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string; // ISO 8601 format
}

/**
 * Health check handler
 * @returns HealthCheckResponse with current status and timestamp
 */
export async function healthCheckHandler(): Promise<HealthCheckResponse> {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Register health check route with Express app
 * @param app Express application instance
 */
export function registerHealthRoute(app: any) {
  app.get('/api/v1/health', async (req: any, res: any) => {
    try {
      const response = await healthCheckHandler();
      res.status(200).json(response);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Service unavailable',
      });
    }
  });
}
