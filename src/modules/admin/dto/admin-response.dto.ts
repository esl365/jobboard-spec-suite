import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ example: 1250 })
  totalUsers: number;

  @ApiProperty({ example: 850 })
  totalJobseekers: number;

  @ApiProperty({ example: 400 })
  totalCompanies: number;

  @ApiProperty({ example: 320 })
  totalActiveJobs: number;

  @ApiProperty({ example: 45 })
  totalPendingJobs: number;

  @ApiProperty({ example: 1580 })
  totalApplications: number;

  @ApiProperty({ example: 125 })
  newUsersThisMonth: number;

  @ApiProperty({ example: 65 })
  newJobsThisMonth: number;

  @ApiProperty({ example: 285 })
  newApplicationsThisMonth: number;
}

export class UserManagementDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'PERSONAL' })
  userType: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: '2025-10-27T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-27T10:00:00.000Z' })
  lastLoginAt: Date | null;

  @ApiProperty({ example: { username: 'John Doe' } })
  profile?: any;
}

export class JobModerationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Senior Backend Developer' })
  title: string;

  @ApiProperty({ example: 'PENDING_REVIEW' })
  status: string;

  @ApiProperty({ example: 1 })
  companyId: number;

  @ApiProperty({ example: 'Tech Company Ltd.' })
  companyName: string;

  @ApiProperty({ example: '2025-10-27T10:00:00.000Z' })
  createdAt: Date;
}

export class UpdateUserStatusDto {
  @ApiProperty({
    example: 'ACTIVE',
    enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DELETED'],
  })
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

export class UpdateJobStatusDto {
  @ApiProperty({
    example: 'ACTIVE',
    enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'EXPIRED', 'FILLED', 'DELETED'],
  })
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'EXPIRED' | 'FILLED' | 'DELETED';
}

export class AnalyticsDto {
  @ApiProperty({ example: { '2025-10': 125, '2025-09': 98 } })
  userGrowth: Record<string, number>;

  @ApiProperty({ example: { '2025-10': 65, '2025-09': 52 } })
  jobGrowth: Record<string, number>;

  @ApiProperty({ example: { PERSONAL: 850, COMPANY: 400 } })
  usersByType: Record<string, number>;

  @ApiProperty({ example: { ACTIVE: 320, FILLED: 180, EXPIRED: 95 } })
  jobsByStatus: Record<string, number>;
}
