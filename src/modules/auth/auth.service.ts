import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { DeviceSessionService } from './services/device-session.service';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private deviceSessionService: DeviceSessionService,
    private emailService: EmailService,
  ) {}

  async register(
    registerDto: RegisterDto,
    userAgent: string,
    ipAddress: string,
  ): Promise<AuthResponseDto> {
    const { email, password, userType } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        userType,
        status: 'PENDING_VERIFICATION',
      },
    });

    // Create wallet for user
    await this.prisma.userWallet.create({
      data: {
        userId: user.id,
        pointsBalance: 0,
        resumeReadCoupons: 0,
      },
    });

    // Generate device ID and register device session
    const deviceId = this.deviceSessionService.generateDeviceId();
    await this.deviceSessionService.registerDevice(
      user.id.toString(),
      deviceId,
      userAgent,
      ipAddress,
    );

    // Generate JWT token
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      userType: user.userType,
      deviceId, // Include deviceId in JWT payload
    };

    const accessToken = this.jwtService.sign(payload);

    // Send welcome email (non-blocking)
    const username = email.split('@')[0];
    this.emailService.sendWelcomeEmail(email, username, userType).catch((error) => {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
    });

    return {
      accessToken,
      tokenType: 'bearer',
      expiresIn: 86400, // 24 hours
      user: {
        id: Number(user.id),
        email: user.email,
        userType: user.userType,
      },
    };
  }

  async login(loginDto: LoginDto, userAgent: string, ipAddress: string): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login time
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate device ID and register device session
    const deviceId = this.deviceSessionService.generateDeviceId();
    await this.deviceSessionService.registerDevice(
      user.id.toString(),
      deviceId,
      userAgent,
      ipAddress,
    );

    // Generate JWT token
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      userType: user.userType,
      deviceId, // Include deviceId in JWT payload
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'bearer',
      expiresIn: 86400, // 24 hours
      user: {
        id: Number(user.id),
        email: user.email,
        userType: user.userType,
      },
    };
  }

  async refresh(
    userId: string,
    deviceId: string,
    _userAgent: string,
    _ipAddress: string,
  ): Promise<AuthResponseDto> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update device activity
    await this.deviceSessionService.updateDeviceActivity(userId, deviceId);

    // Generate new JWT token
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      userType: user.userType,
      deviceId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'bearer',
      expiresIn: 86400, // 24 hours
      user: {
        id: Number(user.id),
        email: user.email,
        userType: user.userType,
      },
    };
  }

  async logout(userId: string, deviceId: string, accessToken: string): Promise<void> {
    // Remove device session
    await this.deviceSessionService.removeDevice(userId, deviceId);

    // Blacklist the current token
    await this.deviceSessionService.blacklistToken(accessToken);
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      return null;
    }

    return {
      id: Number(user.id),
      email: user.email,
      userType: user.userType,
    };
  }
}
