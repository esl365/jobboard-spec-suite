import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { ApplicationListQueryDto } from './dto/application-list-query.dto';
import { ApplicationListResponseDto } from './dto/application-list-response.dto';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createApplicationDto: CreateApplicationDto,
    userId: number,
  ): Promise<ApplicationResponseDto> {
    // Verify job exists and is ACTIVE
    const job = await this.prisma.job.findUnique({
      where: { id: BigInt(createApplicationDto.jobId) },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'ACTIVE') {
      throw new BadRequestException('Job is not active and cannot accept applications');
    }

    // Check if job has expired
    if (job.expiresAt < new Date()) {
      throw new BadRequestException('Job has expired');
    }

    // Verify resume exists and belongs to user
    const resume = await this.prisma.resume.findUnique({
      where: { id: BigInt(createApplicationDto.resumeId) },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (Number(resume.jobseekerUserId) !== userId) {
      throw new ForbiddenException('You can only use your own resumes');
    }

    // Check for duplicate application
    const existingApplication = await this.prisma.jobApplication.findUnique({
      where: {
        uk_job_user: {
          jobId: BigInt(createApplicationDto.jobId),
          jobseekerUserId: BigInt(userId),
        },
      },
    });

    if (existingApplication) {
      throw new ConflictException('You have already applied to this job');
    }

    // Get or create default application stage for the company (atomic upsert to prevent race conditions)
    const companyUserId = Number(job.companyUserId);

    // First, try to find existing default stage
    let defaultStage = await this.prisma.jobApplicationStage.findFirst({
      where: {
        companyUserId: BigInt(companyUserId),
        isDefaultStage: true,
      },
    });

    // If not found, use upsert to create it atomically
    if (!defaultStage) {
      try {
        defaultStage = await this.prisma.jobApplicationStage.create({
          data: {
            companyUserId: BigInt(companyUserId),
            stageName: 'Applied',
            stageOrder: 1,
            isDefaultStage: true,
          },
        });
      } catch (error) {
        // If another request created it concurrently, fetch it
        defaultStage = await this.prisma.jobApplicationStage.findFirstOrThrow({
          where: {
            companyUserId: BigInt(companyUserId),
            isDefaultStage: true,
          },
        });
      }
    }

    // Create application
    const application = await this.prisma.jobApplication.create({
      data: {
        jobId: BigInt(createApplicationDto.jobId),
        jobseekerUserId: BigInt(userId),
        resumeId: BigInt(createApplicationDto.resumeId),
        currentStageId: defaultStage.id,
        status: 'ACTIVE',
      },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                email: true,
                companyProfile: true,
              },
            },
          },
        },
        jobseeker: {
          select: {
            id: true,
            email: true,
            personalProfile: true,
          },
        },
        resume: {
          select: {
            id: true,
            title: true,
          },
        },
        currentStage: true,
      },
    });

    // Send email notification to company (fire and forget - don't block response)
    this.emailService
      .sendApplicationReceivedEmail(
        application.job.company.email,
        application.job.title,
        application.jobseeker.personalProfile?.username || application.jobseeker.email,
      )
      .catch((err) => console.error('Failed to send application received email:', err));

    return this.mapToResponseDto(application);
  }

  async findAll(
    query: ApplicationListQueryDto,
    userId: number,
    userRoles: string[],
  ): Promise<ApplicationListResponseDto> {
    const {
      page = 1,
      limit = 20,
      status,
      jobId,
      jobseekerUserId,
      sortBy = 'appliedAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause based on user role
    const where: any = {};

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (jobId) {
      where.jobId = BigInt(jobId);
    }

    // RBAC: Filter based on role
    const isAdmin = userRoles.includes('admin');
    const isRecruiter = userRoles.includes('recruiter');
    const isJobseeker = userRoles.includes('jobseeker');

    if (!isAdmin) {
      if (isRecruiter) {
        // Recruiters can only see applications for their own jobs
        where.job = {
          companyUserId: BigInt(userId),
        };

        // Allow filtering by jobseeker if recruiter specified it
        if (jobseekerUserId) {
          where.jobseekerUserId = BigInt(jobseekerUserId);
        }
      } else if (isJobseeker) {
        // Jobseekers can only see their own applications
        where.jobseekerUserId = BigInt(userId);
      } else {
        // No role means no access
        throw new ForbiddenException('You do not have permission to view applications');
      }
    } else {
      // Admins can filter by jobseeker if specified
      if (jobseekerUserId) {
        where.jobseekerUserId = BigInt(jobseekerUserId);
      }
    }

    const orderBy: any = {
      [sortBy]: sortOrder,
    };

    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  email: true,
                  companyProfile: true,
                },
              },
            },
          },
          jobseeker: {
            select: {
              id: true,
              email: true,
              personalProfile: true,
            },
          },
          resume: {
            select: {
              id: true,
              title: true,
            },
          },
          currentStage: true,
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: applications.map((app) => this.mapToResponseDto(app)),
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(id: number, userId: number, userRoles: string[]): Promise<ApplicationResponseDto> {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: BigInt(id) },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                email: true,
                companyProfile: true,
              },
            },
          },
        },
        jobseeker: {
          select: {
            id: true,
            email: true,
            personalProfile: true,
          },
        },
        resume: true,
        currentStage: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // RBAC: Check permissions
    const isAdmin = userRoles.includes('admin');
    const isRecruiter = userRoles.includes('recruiter');
    const isOwner = Number(application.jobseekerUserId) === userId;
    const isJobOwner = Number(application.job.companyUserId) === userId;

    if (!isAdmin && !isOwner && !(isRecruiter && isJobOwner)) {
      throw new ForbiddenException('You do not have permission to view this application');
    }

    return this.mapToResponseDto(application);
  }

  async update(
    id: number,
    updateApplicationDto: UpdateApplicationDto,
    userId: number,
    userRoles: string[],
  ): Promise<ApplicationResponseDto> {
    const existingApplication = await this.prisma.jobApplication.findUnique({
      where: { id: BigInt(id) },
      include: {
        job: true,
      },
    });

    if (!existingApplication) {
      throw new NotFoundException('Application not found');
    }

    // RBAC: Determine what can be updated based on role
    const isAdmin = userRoles.includes('admin');
    const isRecruiter = userRoles.includes('recruiter');
    const isOwner = Number(existingApplication.jobseekerUserId) === userId;
    const isJobOwner = Number(existingApplication.job.companyUserId) === userId;

    // Jobseekers can only withdraw their own applications
    if (isOwner && !isAdmin && !isRecruiter) {
      if (updateApplicationDto.status && updateApplicationDto.status !== 'WITHDRAWN_BY_USER') {
        throw new ForbiddenException('Jobseekers can only withdraw their applications');
      }
      if (updateApplicationDto.currentStageId) {
        throw new ForbiddenException('Jobseekers cannot change application stage');
      }
    }

    // Recruiters can only update applications for their own jobs
    if (isRecruiter && !isJobOwner && !isAdmin) {
      throw new ForbiddenException('You can only update applications for your own jobs');
    }

    // Prepare update data
    const updateData: any = {};

    if (updateApplicationDto.status) {
      // Validate status transitions
      if (existingApplication.status === 'WITHDRAWN_BY_USER') {
        throw new BadRequestException('Cannot update withdrawn application');
      }
      if (existingApplication.status === 'HIRED') {
        throw new BadRequestException('Cannot update hired application');
      }

      updateData.status = updateApplicationDto.status;
    }

    if (updateApplicationDto.currentStageId) {
      // Verify stage exists and belongs to the company
      const stage = await this.prisma.jobApplicationStage.findUnique({
        where: { id: BigInt(updateApplicationDto.currentStageId) },
      });

      if (!stage) {
        throw new NotFoundException('Application stage not found');
      }

      if (Number(stage.companyUserId) !== Number(existingApplication.job.companyUserId)) {
        throw new BadRequestException('Stage does not belong to this company');
      }

      updateData.currentStageId = BigInt(updateApplicationDto.currentStageId);
    }

    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                email: true,
                companyProfile: true,
              },
            },
          },
        },
        jobseeker: {
          select: {
            id: true,
            email: true,
            personalProfile: true,
          },
        },
        resume: {
          select: {
            id: true,
            title: true,
          },
        },
        currentStage: true,
      },
    });

    // Send email notification to job seeker if status changed (fire and forget)
    if (updateData.status && updateData.status !== existingApplication.status) {
      this.emailService
        .sendApplicationStatusEmail(
          updatedApplication.jobseeker.email,
          updatedApplication.job.title,
          updatedApplication.job.company.companyProfile?.companyName ||
            updatedApplication.job.company.email,
          updateData.status,
        )
        .catch((err) => console.error('Failed to send application status email:', err));
    }

    return this.mapToResponseDto(updatedApplication);
  }

  async remove(id: number, userId: number, userRoles: string[]): Promise<void> {
    const existingApplication = await this.prisma.jobApplication.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingApplication) {
      throw new NotFoundException('Application not found');
    }

    // RBAC: Only the applicant or admin can withdraw
    const isAdmin = userRoles.includes('admin');
    const isOwner = Number(existingApplication.jobseekerUserId) === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only withdraw your own applications');
    }

    // Check if already withdrawn
    if (existingApplication.status === 'WITHDRAWN_BY_USER') {
      throw new BadRequestException('Application is already withdrawn');
    }

    // Soft delete by updating status
    await this.prisma.jobApplication.update({
      where: { id: BigInt(id) },
      data: { status: 'WITHDRAWN_BY_USER' },
    });
  }

  private mapToResponseDto(application: any): ApplicationResponseDto {
    return {
      id: Number(application.id),
      jobId: Number(application.jobId),
      jobseekerUserId: Number(application.jobseekerUserId),
      resumeId: Number(application.resumeId),
      currentStageId: Number(application.currentStageId),
      status: application.status,
      appliedAt: application.appliedAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      job: application.job
        ? {
            id: Number(application.job.id),
            title: application.job.title,
            status: application.job.status,
            company: application.job.company
              ? {
                  id: Number(application.job.company.id),
                  email: application.job.company.email,
                  companyName: application.job.company.companyProfile?.companyName,
                }
              : undefined,
          }
        : undefined,
      jobseeker: application.jobseeker
        ? {
            id: Number(application.jobseeker.id),
            email: application.jobseeker.email,
            username: application.jobseeker.personalProfile?.username,
          }
        : undefined,
      resume: application.resume
        ? {
            id: Number(application.resume.id),
            title: application.resume.title,
          }
        : undefined,
      currentStage: application.currentStage
        ? {
            id: Number(application.currentStage.id),
            stageName: application.currentStage.stageName,
            stageOrder: application.currentStage.stageOrder,
          }
        : undefined,
    };
  }
}
