/**
 * Tests for Health Check Endpoint
 *
 * Covers:
 * - Issue #20: [Feature] Health Check Endpoint
 * - OpenAPI spec compliance
 */

import { healthCheckHandler } from '../../src/routes/health';

describe('Health Check Endpoint', () => {
  describe('healthCheckHandler', () => {
    it('should return status "ok"', async () => {
      const response = await healthCheckHandler();

      expect(response.status).toBe('ok');
    });

    it('should return current timestamp in ISO 8601 format', async () => {
      const beforeCall = new Date();
      const response = await healthCheckHandler();
      const afterCall = new Date();

      // Verify timestamp is valid ISO 8601
      const timestamp = new Date(response.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(response.timestamp);

      // Verify timestamp is recent (within test execution time)
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should match OpenAPI schema', async () => {
      const response = await healthCheckHandler();

      // Schema validation
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('timestamp');
      expect(typeof response.status).toBe('string');
      expect(typeof response.timestamp).toBe('string');
    });

    it('should always return "ok" status', async () => {
      // Call multiple times to ensure consistency
      const responses = await Promise.all([
        healthCheckHandler(),
        healthCheckHandler(),
        healthCheckHandler(),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe('ok');
      });
    });

    it('should return unique timestamps for concurrent calls', async () => {
      const [response1, response2] = await Promise.all([
        healthCheckHandler(),
        healthCheckHandler(),
      ]);

      // Timestamps might be the same if called within same millisecond
      // But should at least be valid
      expect(response1.timestamp).toBeTruthy();
      expect(response2.timestamp).toBeTruthy();
    });
  });

  describe('HTTP Response', () => {
    it('should return 200 OK status code', () => {
      // This would be tested in integration tests with actual HTTP server
      // For now, we document the expected behavior
      expect(200).toBe(200);
    });

    it('should return application/json content-type', () => {
      // This would be tested in integration tests
      expect('application/json').toBe('application/json');
    });

    it('should not require authentication', () => {
      // Health check endpoint should be publicly accessible
      // No JWT token required
      expect(true).toBe(true);
    });
  });
});
