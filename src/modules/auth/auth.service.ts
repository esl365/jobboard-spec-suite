import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private prisma: PrismaClient;

  constructor(private jwtService: JwtService) {
    this.prisma = new PrismaClient();
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
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

    // Generate JWT token
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      userType: user.userType,
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

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
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

    // Generate JWT token
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      userType: user.userType,
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

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
