import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { randomBytes } from 'crypto';

export interface DeviceInfo {
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
}

/**
 * DeviceSessionService manages user device sessions with Redis
 *
 * This service enforces POL-A-002 policy:
 * - Maximum 5 concurrent devices per user
 * - Automatic cleanup of oldest device when limit exceeded
 * - Session TTL matches JWT expiration (24 hours)
 * - Token blacklist for logout functionality
 *
 * Redis Key Patterns:
 * - device:{userId}:{deviceId} -> DeviceInfo (TTL: 24h)
 * - user-devices:{userId} -> Set of deviceIds
 * - blacklist:{token} -> '1' (TTL: 24h)
 */
@Injectable()
export class DeviceSessionService {
  private readonly MAX_DEVICES = 5;
  private readonly SESSION_TTL = 86400; // 24 hours in seconds

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate a unique device ID
   */
  generateDeviceId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Register a new device session
   * Enforces max 5 devices policy by removing oldest device if needed
   */
  async registerDevice(
    userId: string,
    deviceId: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<void> {
    const redis = this.redisService.getClient();
    const userDevicesKey = `user-devices:${userId}`;
    const deviceKey = `device:${userId}:${deviceId}`;

    // Get current devices for this user
    const currentDevices = await redis.smembers(userDevicesKey);

    // If user has 5 or more devices, remove the oldest one
    if (currentDevices.length >= this.MAX_DEVICES) {
      await this.removeOldestDevice(userId, currentDevices);
    }

    // Store device information
    const deviceInfo: DeviceInfo = {
      deviceId,
      userAgent,
      ipAddress,
      lastActiveAt: new Date().toISOString(),
    };

    // Store device info with TTL
    await redis.setex(deviceKey, this.SESSION_TTL, JSON.stringify(deviceInfo));

    // Add device to user's device set
    await redis.sadd(userDevicesKey, deviceId);

    // Set TTL on user's device set
    await redis.expire(userDevicesKey, this.SESSION_TTL);
  }

  /**
   * Remove the oldest device based on lastActiveAt timestamp
   */
  private async removeOldestDevice(userId: string, deviceIds: string[]): Promise<void> {
    const redis = this.redisService.getClient();
    let oldestDeviceId: string | null = null;
    let oldestTimestamp: Date | null = null;

    // Find the oldest device by checking lastActiveAt
    for (const deviceId of deviceIds) {
      const deviceKey = `device:${userId}:${deviceId}`;
      const deviceData = await redis.get(deviceKey);

      if (deviceData) {
        const deviceInfo: DeviceInfo = JSON.parse(deviceData);
        const lastActive = new Date(deviceInfo.lastActiveAt);

        if (!oldestTimestamp || lastActive < oldestTimestamp) {
          oldestTimestamp = lastActive;
          oldestDeviceId = deviceId;
        }
      }
    }

    // Remove the oldest device
    if (oldestDeviceId) {
      await this.removeDevice(userId, oldestDeviceId);
    }
  }

  /**
   * Remove a specific device session
   */
  async removeDevice(userId: string, deviceId: string): Promise<void> {
    const redis = this.redisService.getClient();
    const deviceKey = `device:${userId}:${deviceId}`;
    const userDevicesKey = `user-devices:${userId}`;

    // Remove device info
    await redis.del(deviceKey);

    // Remove from user's device set
    await redis.srem(userDevicesKey, deviceId);
  }

  /**
   * Get all active devices for a user
   */
  async getUserDevices(userId: string): Promise<DeviceInfo[]> {
    const redis = this.redisService.getClient();
    const userDevicesKey = `user-devices:${userId}`;
    const deviceIds = await redis.smembers(userDevicesKey);

    const devices: DeviceInfo[] = [];

    for (const deviceId of deviceIds) {
      const deviceKey = `device:${userId}:${deviceId}`;
      const deviceData = await redis.get(deviceKey);

      if (deviceData) {
        devices.push(JSON.parse(deviceData));
      }
    }

    return devices;
  }

  /**
   * Update device last active timestamp
   */
  async updateDeviceActivity(userId: string, deviceId: string): Promise<void> {
    const redis = this.redisService.getClient();
    const deviceKey = `device:${userId}:${deviceId}`;
    const deviceData = await redis.get(deviceKey);

    if (deviceData) {
      const deviceInfo: DeviceInfo = JSON.parse(deviceData);
      deviceInfo.lastActiveAt = new Date().toISOString();

      await redis.setex(deviceKey, this.SESSION_TTL, JSON.stringify(deviceInfo));
    }
  }

  /**
   * Blacklist a token (for logout)
   */
  async blacklistToken(token: string): Promise<void> {
    const redis = this.redisService.getClient();
    const blacklistKey = `blacklist:${token}`;

    await redis.setex(blacklistKey, this.SESSION_TTL, '1');
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const redis = this.redisService.getClient();
    const blacklistKey = `blacklist:${token}`;
    const result = await redis.get(blacklistKey);

    return result === '1';
  }
}
