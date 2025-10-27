import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { DeviceSessionService } from '../services/device-session.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private deviceSessionService: DeviceSessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'your-secret-key-change-this-in-production',
      ),
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(req: Request, payload: any) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || '';

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await this.deviceSessionService.isTokenBlacklisted(token);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Validate user exists
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Add deviceId to user object for controller access
    return {
      ...user,
      deviceId: payload.deviceId,
    };
  }
}
