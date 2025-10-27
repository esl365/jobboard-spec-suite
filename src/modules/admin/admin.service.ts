import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  DashboardStatsDto,
  UserManagementDto,
  JobModerationDto,
  AnalyticsDto,
} from './dto/admin-response.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalJobseekers,
      totalCompanies,
      totalActiveJobs,
      totalPendingJobs,
      totalApplications,
      newUsersThisMonth,
      newJobsThisMonth,
      newApplicationsThisMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { userType: 'PERSONAL' } }),
      this.prisma.user.count({ where: { userType: 'COMPANY' } }),
      this.prisma.job.count({ where: { status: 'ACTIVE' } }),
      this.prisma.job.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.jobApplication.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.job.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.jobApplication.count({ where: { appliedAt: { gte: startOfMonth } } }),
    ]);

    return {
      totalUsers,
      totalJobseekers,
      totalCompanies,
      totalActiveJobs,
      totalPendingJobs,
      totalApplications,
      newUsersThisMonth,
      newJobsThisMonth,
      newApplicationsThisMonth,
    };
  }

  async getUsers(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ users: UserManagementDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          personalProfile: true,
          companyProfile: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users: users.map((user) => ({
        id: Number(user.id),
        email: user.email,
        userType: user.userType,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        profile: user.personalProfile || user.companyProfile,
      })),
      total,
    };
  }

  async updateUserStatus(userId: number, status: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data: { status: status as any },
    });
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id: BigInt(userId) },
    });
  }

  async getPendingJobs(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ jobs: JobModerationDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: { status: 'PENDING_REVIEW' },
        skip,
        take: limit,
        include: {
          company: {
            include: {
              companyProfile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where: { status: 'PENDING_REVIEW' } }),
    ]);

    return {
      jobs: jobs.map((job) => ({
        id: Number(job.id),
        title: job.title,
        status: job.status,
        companyId: Number(job.companyUserId),
        companyName: job.company.companyProfile?.companyName || job.company.email,
        createdAt: job.createdAt,
      })),
      total,
    };
  }

  async updateJobStatus(jobId: number, status: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: BigInt(jobId) },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.prisma.job.update({
      where: { id: BigInt(jobId) },
      data: { status: status as any },
    });
  }

  async deleteJob(jobId: number): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: BigInt(jobId) },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.prisma.job.delete({
      where: { id: BigInt(jobId) },
    });
  }

  async getAnalytics(): Promise<AnalyticsDto> {
    // User growth by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });

    const jobs = await this.prisma.job.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });

    const userGrowth: Record<string, number> = {};
    const jobGrowth: Record<string, number> = {};

    users.forEach((user) => {
      const monthKey = user.createdAt.toISOString().substring(0, 7);
      userGrowth[monthKey] = (userGrowth[monthKey] || 0) + 1;
    });

    jobs.forEach((job) => {
      const monthKey = job.createdAt.toISOString().substring(0, 7);
      jobGrowth[monthKey] = (jobGrowth[monthKey] || 0) + 1;
    });

    // Users by type
    const [personalCount, companyCount] = await Promise.all([
      this.prisma.user.count({ where: { userType: 'PERSONAL' } }),
      this.prisma.user.count({ where: { userType: 'COMPANY' } }),
    ]);

    const usersByType = {
      PERSONAL: personalCount,
      COMPANY: companyCount,
    };

    // Jobs by status
    const [activeJobs, filledJobs, expiredJobs, pendingJobs] = await Promise.all([
      this.prisma.job.count({ where: { status: 'ACTIVE' } }),
      this.prisma.job.count({ where: { status: 'FILLED' } }),
      this.prisma.job.count({ where: { status: 'EXPIRED' } }),
      this.prisma.job.count({ where: { status: 'PENDING_REVIEW' } }),
    ]);

    const jobsByStatus = {
      ACTIVE: activeJobs,
      FILLED: filledJobs,
      EXPIRED: expiredJobs,
      PENDING_REVIEW: pendingJobs,
    };

    return {
      userGrowth,
      jobGrowth,
      usersByType,
      jobsByStatus,
    };
  }
}
