import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DeviceSessionService } from './services/device-session.service';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../email/email.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let deviceSessionService: DeviceSessionService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: DeviceSessionService,
          useValue: {
            generateDeviceId: jest.fn().mockReturnValue('mock-device-id'),
            registerDevice: jest.fn(),
            updateDeviceActivity: jest.fn(),
            removeDevice: jest.fn(),
            blacklistToken: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn().mockResolvedValue(true),
            sendApplicationStatusEmail: jest.fn().mockResolvedValue(true),
            sendPaymentConfirmationEmail: jest.fn().mockResolvedValue(true),
            sendApplicationReceivedEmail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    deviceSessionService = module.get<DeviceSessionService>(DeviceSessionService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        userType: 'PERSONAL' as const,
      };

      const mockUser = {
        id: BigInt(1),
        email: registerDto.email,
        passwordHash: 'hashed-password',
        userType: registerDto.userType,
        status: 'PENDING_VERIFICATION' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser);
      prismaMock.userWallet.create.mockResolvedValue({
        userId: BigInt(1),
        pointsBalance: BigInt(0),
        resumeReadCoupons: 0,
        updatedAt: new Date(),
      });

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(registerDto, 'Mozilla/5.0', '127.0.0.1');

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        tokenType: 'bearer',
        expiresIn: 86400,
        user: {
          id: 1,
          email: registerDto.email,
          userType: registerDto.userType,
        },
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(prismaMock.userWallet.create).toHaveBeenCalled();
      expect(deviceSessionService.registerDevice).toHaveBeenCalledWith(
        '1',
        'mock-device-id',
        'Mozilla/5.0',
        '127.0.0.1',
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        userType: 'PERSONAL' as const,
      };

      prismaMock.user.findUnique.mockResolvedValue({
        id: BigInt(1),
        email: registerDto.email,
        passwordHash: 'hash',
        userType: 'PERSONAL',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      });

      await expect(service.register(registerDto, 'Mozilla/5.0', '127.0.0.1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: BigInt(1),
        email: loginDto.email,
        passwordHash: 'hashed-password',
        userType: 'PERSONAL' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto, 'Mozilla/5.0', '127.0.0.1');

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        tokenType: 'bearer',
        expiresIn: 86400,
        user: {
          id: 1,
          email: loginDto.email,
          userType: 'PERSONAL',
        },
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });

      expect(deviceSessionService.registerDevice).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto, 'Mozilla/5.0', '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: BigInt(1),
        email: loginDto.email,
        passwordHash: 'hashed-password',
        userType: 'PERSONAL' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto, 'Mozilla/5.0', '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await service.logout('1', 'device-id', 'access-token');

      expect(deviceSessionService.removeDevice).toHaveBeenCalledWith('1', 'device-id');
      expect(deviceSessionService.blacklistToken).toHaveBeenCalledWith('access-token');
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: BigInt(1),
        email: 'test@example.com',
        passwordHash: 'hash',
        userType: 'PERSONAL' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('1');

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        userType: 'PERSONAL',
      });
    });

    it('should return null if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('999');

      expect(result).toBeNull();
    });
  });
});
