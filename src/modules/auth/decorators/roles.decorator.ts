import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator for RBAC
 * Usage: @Roles('admin', 'recruiter')
 *
 * This decorator sets metadata that RolesGuard will check
 * to enforce role-based access control.
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
