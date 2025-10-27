import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobListQueryDto } from './dto/job-list-query.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { JobListResponseDto } from './dto/job-list-response.dto';

@Injectable()
export class JobService {
  constructor(private prisma: PrismaService) {}

  async create(createJobDto: CreateJobDto, companyUserId: number): Promise<JobResponseDto> {
    const job = await this.prisma.job.create({
      data: {
        title: createJobDto.title,
        description: createJobDto.description,
        employmentType: createJobDto.employmentType,
        salaryType: createJobDto.salaryType,
        salaryMin: createJobDto.salaryMin,
        salaryMax: createJobDto.salaryMax,
        locationSiIdx: createJobDto.locationSiIdx,
        locationGuIdx: createJobDto.locationGuIdx,
        jobTypeIdx: createJobDto.jobTypeIdx,
        expiresAt: createJobDto.expiresAt,
        companyUserId: BigInt(companyUserId),
        status: 'DRAFT',
      },
      include: {
        company: {
          select: {
            id: true,
            email: true,
            companyProfile: true,
          },
        },
      },
    });

    return this.mapToResponseDto(job);
  }

  async findAll(query: JobListQueryDto): Promise<JobListResponseDto> {
    const {
      page = 1,
      limit = 20,
      status,
      employmentType,
      salaryType,
      locationSiIdx,
      locationGuIdx,
      jobTypeIdx,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause
    const where: any = {
      // Exclude DELETED jobs by default
      status: status ? status : { not: 'DELETED' },
    };

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (salaryType) {
      where.salaryType = salaryType;
    }

    if (locationSiIdx !== undefined) {
      where.locationSiIdx = locationSiIdx;
    }

    if (locationGuIdx !== undefined) {
      where.locationGuIdx = locationGuIdx;
    }

    if (jobTypeIdx !== undefined) {
      where.jobTypeIdx = jobTypeIdx;
    }

    if (search) {
      where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
    }

    // Build orderBy clause
    const orderBy: any = {
      [sortBy]: sortOrder,
    };

    // Execute query
    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          company: {
            select: {
              id: true,
              email: true,
              companyProfile: true,
            },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: jobs.map((job) => this.mapToResponseDto(job)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: number): Promise<JobResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: { id: BigInt(id) },
      include: {
        company: {
          select: {
            id: true,
            email: true,
            companyProfile: true,
          },
        },
        jobOptions: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (job.status === 'DELETED') {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return this.mapToResponseDto(job);
  }

  async update(id: number, updateJobDto: UpdateJobDto, userId: number): Promise<JobResponseDto> {
    // Check if job exists and user owns it
    const existingJob = await this.prisma.job.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingJob) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (existingJob.status === 'DELETED') {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (Number(existingJob.companyUserId) !== userId) {
      throw new ForbiddenException('You do not have permission to update this job');
    }

    const job = await this.prisma.job.update({
      where: { id: BigInt(id) },
      data: {
        ...updateJobDto,
      },
      include: {
        company: {
          select: {
            id: true,
            email: true,
            companyProfile: true,
          },
        },
      },
    });

    return this.mapToResponseDto(job);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Check if job exists and user owns it
    const existingJob = await this.prisma.job.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingJob) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (existingJob.status === 'DELETED') {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (Number(existingJob.companyUserId) !== userId) {
      throw new ForbiddenException('You do not have permission to delete this job');
    }

    // Soft delete: update status to DELETED
    await this.prisma.job.update({
      where: { id: BigInt(id) },
      data: { status: 'DELETED' },
    });
  }

  private mapToResponseDto(job: any): JobResponseDto {
    return {
      id: Number(job.id),
      title: job.title,
      description: job.description,
      status: job.status,
      employmentType: job.employmentType,
      salaryType: job.salaryType,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
      locationSiIdx: job.locationSiIdx,
      locationGuIdx: job.locationGuIdx,
      jobTypeIdx: job.jobTypeIdx,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      expiresAt: job.expiresAt.toISOString(),
      company: job.company
        ? {
            id: Number(job.company.id),
            email: job.company.email,
            companyName: job.company.companyProfile?.companyName,
          }
        : undefined,
    };
  }
}
