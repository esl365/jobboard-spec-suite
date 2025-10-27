import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../../../common/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockExecutionContext({ id: 1 });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const mockUserRoles = [
        {
          userId: BigInt(1),
          roleId: 1,
          role: {
            id: 1,
            roleName: 'admin',
          },
        },
      ];

      prismaMock.userRole.findMany.mockResolvedValue(mockUserRoles as any);

      const context = createMockExecutionContext({ id: 1 });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaMock.userRole.findMany).toHaveBeenCalledWith({
        where: { userId: BigInt(1) },
        include: { role: true },
      });
    });

    it('should deny access when user does not have required role', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['admin', 'recruiter']);

      const mockUserRoles = [
        {
          userId: BigInt(1),
          roleId: 3,
          role: {
            id: 3,
            roleName: 'user',
          },
        },
      ];

      prismaMock.userRole.findMany.mockResolvedValue(mockUserRoles as any);

      const context = createMockExecutionContext({ id: 1 });
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access when user is not authenticated', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const context = createMockExecutionContext(null);
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when user has one of multiple required roles', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['admin', 'recruiter', 'moderator']);

      const mockUserRoles = [
        {
          userId: BigInt(1),
          roleId: 2,
          role: {
            id: 2,
            roleName: 'recruiter',
          },
        },
      ];

      prismaMock.userRole.findMany.mockResolvedValue(mockUserRoles as any);

      const context = createMockExecutionContext({ id: 1 });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
