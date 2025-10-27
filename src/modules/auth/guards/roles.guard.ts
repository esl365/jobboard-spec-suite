import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard enforces role-based access control (RBAC)
 *
 * This guard:
 * 1. Reads required roles from route metadata (set by @Roles decorator)
 * 2. Fetches the current user's roles from database
 * 3. Checks if user has at least one of the required roles
 * 4. Denies access if user lacks required roles
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin', 'recruiter')
 * async myProtectedRoute() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private prisma: PrismaClient;

  constructor(private reflector: Reflector) {
    this.prisma = new PrismaClient();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from route metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (populated by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return false;
    }

    // Fetch user's roles from database
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId: BigInt(user.id),
      },
      include: {
        role: true,
      },
    });

    // Extract role names
    const userRoleNames = userRoles.map((ur) => ur.role.roleName);

    // Check if user has at least one of the required roles
    const hasRole = requiredRoles.some((role) => userRoleNames.includes(role));

    return hasRole;
  }
}
