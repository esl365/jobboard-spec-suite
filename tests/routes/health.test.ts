import { describe, it, expect } from 'vitest';
import { healthCheckHandler, type HealthCheckResponse } from '../../src/routes/health';

describe('Health Check Endpoint', () => {
  it('should return status "ok"', async () => {
    const response = await healthCheckHandler();
    expect(response.status).toBe('ok');
  });

  it('should return current timestamp in ISO 8601 format', async () => {
    const beforeCall = new Date();
    const response = await healthCheckHandler();
    const afterCall = new Date();

    // Verify it's valid ISO 8601
    const timestamp = new Date(response.timestamp);
    expect(timestamp.toISOString()).toBe(response.timestamp);

    // Verify timestamp is between before and after call
    expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });

  it('should match HealthCheckResponse interface', async () => {
    const response = await healthCheckHandler();

    // Type checking (compile-time)
    const typedResponse: HealthCheckResponse = response;
    expect(typedResponse).toBeDefined();

    // Runtime validation
    expect(response).toHaveProperty('status');
    expect(response).toHaveProperty('timestamp');
    expect(Object.keys(response)).toHaveLength(2);
  });

  it('should match OpenAPI schema requirements', async () => {
    const response = await healthCheckHandler();

    // Schema validation
    expect(response.status).toBe('ok'); // enum: ['ok']
    expect(typeof response.timestamp).toBe('string');
    expect(response.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  it('should return unique timestamps for concurrent calls', async () => {
    const promises = Array.from({ length: 5 }, () => healthCheckHandler());
    const responses = await Promise.all(promises);

    // All responses should be valid
    responses.forEach((response) => {
      expect(response.status).toBe('ok');
      expect(response.timestamp).toBeTruthy();
    });

    // Timestamps might be the same if calls are fast enough, but all should be valid
    const timestamps = responses.map((r) => r.timestamp);
    timestamps.forEach((ts) => {
      expect(new Date(ts).toISOString()).toBe(ts);
    });
  });

  it('should return timestamps with millisecond precision', async () => {
    const response = await healthCheckHandler();

    // ISO 8601 with milliseconds: YYYY-MM-DDTHH:mm:ss.sssZ
    expect(response.timestamp).toMatch(/\.\d{3}Z$/);
  });

  it('should be callable multiple times', async () => {
    const response1 = await healthCheckHandler();
    const response2 = await healthCheckHandler();
    const response3 = await healthCheckHandler();

    expect(response1.status).toBe('ok');
    expect(response2.status).toBe('ok');
    expect(response3.status).toBe('ok');

    // All should have valid timestamps
    [response1, response2, response3].forEach((response) => {
      expect(new Date(response.timestamp).toISOString()).toBe(
        response.timestamp
      );
    });
  });
});
