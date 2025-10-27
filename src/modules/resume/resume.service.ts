import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { FileStorageService, UploadedFile } from '../../common/storage/file-storage.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ResumeResponseDto, ResumeListResponseDto } from './dto/resume-response.dto';
import { ResumeQueryDto } from './dto/resume-query.dto';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(createResumeDto: CreateResumeDto, userId: number): Promise<ResumeResponseDto> {
    // If setting as default, unset other defaults first
    if (createResumeDto.isDefault) {
      await this.prisma.resume.updateMany({
        where: {
          jobseekerUserId: BigInt(userId),
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const resume = await this.prisma.resume.create({
      data: {
        jobseekerUserId: BigInt(userId),
        title: createResumeDto.title,
        introduction: createResumeDto.introduction,
        educationHistory: (createResumeDto.educationHistory || []) as any,
        workExperience: (createResumeDto.workExperience || []) as any,
        skills: createResumeDto.skills || [],
        isDefault: createResumeDto.isDefault || false,
      },
    });

    this.logger.log(`Resume created: id=${resume.id}, userId=${userId}`);

    return this.mapToResponseDto(resume);
  }

  async findAll(
    userId: number,
    query: ResumeQueryDto,
    userRoles: string[],
  ): Promise<ResumeListResponseDto> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause
    const where: any = {};

    // RBAC: Users can only see their own resumes unless admin
    const isAdmin = userRoles.includes('admin');
    if (!isAdmin) {
      where.jobseekerUserId = BigInt(userId);
    }

    const orderBy: any = {
      [sortBy]: sortOrder,
    };

    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.resume.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: resumes.map((resume) => this.mapToResponseDto(resume)),
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(id: number, userId: number, userRoles: string[]): Promise<ResumeResponseDto> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: BigInt(id) },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // RBAC: Check permissions
    const isAdmin = userRoles.includes('admin');
    const isOwner = Number(resume.jobseekerUserId) === userId;
    const isRecruiter = userRoles.includes('recruiter');

    // Recruiters can view resumes through job applications (checked in applications)
    // For now, only owner or admin can view directly
    if (!isAdmin && !isOwner && !isRecruiter) {
      throw new ForbiddenException('You do not have permission to view this resume');
    }

    // If recruiter, verify they have access through an application
    if (isRecruiter && !isOwner && !isAdmin) {
      const hasAccess = await this.verifyRecruiterAccess(id, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You can only view resumes from applications to your jobs');
      }
    }

    return this.mapToResponseDto(resume);
  }

  async update(
    id: number,
    updateResumeDto: UpdateResumeDto,
    userId: number,
    userRoles: string[],
  ): Promise<ResumeResponseDto> {
    const existingResume = await this.prisma.resume.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingResume) {
      throw new NotFoundException('Resume not found');
    }

    // RBAC: Only owner or admin can update
    const isAdmin = userRoles.includes('admin');
    const isOwner = Number(existingResume.jobseekerUserId) === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only update your own resumes');
    }

    // If setting as default, unset other defaults first
    if (updateResumeDto.isDefault) {
      await this.prisma.resume.updateMany({
        where: {
          jobseekerUserId: existingResume.jobseekerUserId,
          isDefault: true,
          id: { not: BigInt(id) },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedResume = await this.prisma.resume.update({
      where: { id: BigInt(id) },
      data: {
        ...(updateResumeDto.title && { title: updateResumeDto.title }),
        ...(updateResumeDto.introduction !== undefined && {
          introduction: updateResumeDto.introduction,
        }),
        ...(updateResumeDto.educationHistory !== undefined && {
          educationHistory: updateResumeDto.educationHistory as any,
        }),
        ...(updateResumeDto.workExperience !== undefined && {
          workExperience: updateResumeDto.workExperience as any,
        }),
        ...(updateResumeDto.skills !== undefined && {
          skills: updateResumeDto.skills,
        }),
        ...(updateResumeDto.isDefault !== undefined && {
          isDefault: updateResumeDto.isDefault,
        }),
      },
    });

    this.logger.log(`Resume updated: id=${id}, userId=${userId}`);

    return this.mapToResponseDto(updatedResume);
  }

  async remove(id: number, userId: number, userRoles: string[]): Promise<void> {
    const existingResume = await this.prisma.resume.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingResume) {
      throw new NotFoundException('Resume not found');
    }

    // RBAC: Only owner or admin can delete
    const isAdmin = userRoles.includes('admin');
    const isOwner = Number(existingResume.jobseekerUserId) === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only delete your own resumes');
    }

    // Check if resume is being used in active applications
    const activeApplications = await this.prisma.jobApplication.count({
      where: {
        resumeId: BigInt(id),
        status: 'ACTIVE',
      },
    });

    if (activeApplications > 0) {
      throw new BadRequestException('Cannot delete resume that is used in active applications');
    }

    await this.prisma.resume.delete({
      where: { id: BigInt(id) },
    });

    this.logger.log(`Resume deleted: id=${id}, userId=${userId}`);
  }

  async setDefault(id: number, userId: number, userRoles: string[]): Promise<ResumeResponseDto> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: BigInt(id) },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // RBAC: Only owner can set default
    const isAdmin = userRoles.includes('admin');
    const isOwner = Number(resume.jobseekerUserId) === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only set default for your own resumes');
    }

    // Unset all other defaults for this user
    await this.prisma.resume.updateMany({
      where: {
        jobseekerUserId: resume.jobseekerUserId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set this one as default
    const updatedResume = await this.prisma.resume.update({
      where: { id: BigInt(id) },
      data: {
        isDefault: true,
      },
    });

    this.logger.log(`Resume set as default: id=${id}, userId=${userId}`);

    return this.mapToResponseDto(updatedResume);
  }

  async uploadPDF(
    id: number,
    file: UploadedFile,
    userId: number,
    userRoles: string[],
  ): Promise<ResumeResponseDto> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: BigInt(id) },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // RBAC: Only owner can upload
    const isAdmin = userRoles.includes('admin');
    const isOwner = Number(resume.jobseekerUserId) === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only upload files to your own resumes');
    }

    // Delete old file if exists
    if (resume.filePath) {
      await this.fileStorageService.deleteFile(resume.filePath);
    }

    // Upload new file
    const filePath = await this.fileStorageService.uploadResumePDF(file, id);

    // Update resume with file path
    const updatedResume = await this.prisma.resume.update({
      where: { id: BigInt(id) },
      data: { filePath },
    });

    this.logger.log(`PDF uploaded for resume: id=${id}, path=${filePath}`);

    return this.mapToResponseDto(updatedResume);
  }

  async downloadPDF(
    id: number,
    userId: number,
    userRoles: string[],
  ): Promise<{ buffer: Buffer; filename: string }> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: BigInt(id) },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (!resume.filePath) {
      throw new NotFoundException('Resume has no attached PDF');
    }

    // RBAC: Check permissions
    const isAdmin = userRoles.includes('admin');
    const isOwner = Number(resume.jobseekerUserId) === userId;
    const isRecruiter = userRoles.includes('recruiter');

    if (!isAdmin && !isOwner && !isRecruiter) {
      throw new ForbiddenException('You do not have permission to download this resume');
    }

    // If recruiter, verify they have access through an application
    if (isRecruiter && !isOwner && !isAdmin) {
      const hasAccess = await this.verifyRecruiterAccess(id, userId);
      if (!hasAccess) {
        throw new ForbiddenException(
          'You can only download resumes from applications to your jobs',
        );
      }
    }

    const buffer = await this.fileStorageService.getFile(resume.filePath);
    const filename = `resume-${id}.pdf`;

    return { buffer, filename };
  }

  async deletePDF(id: number, userId: number, userRoles: string[]): Promise<ResumeResponseDto> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: BigInt(id) },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // RBAC: Only owner can delete
    const isAdmin = userRoles.includes('admin');
    const isOwner = Number(resume.jobseekerUserId) === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only delete files from your own resumes');
    }

    if (!resume.filePath) {
      throw new BadRequestException('Resume has no attached PDF');
    }

    // Delete file
    await this.fileStorageService.deleteFile(resume.filePath);

    // Update resume to remove file path
    const updatedResume = await this.prisma.resume.update({
      where: { id: BigInt(id) },
      data: { filePath: null },
    });

    this.logger.log(`PDF deleted from resume: id=${id}`);

    return this.mapToResponseDto(updatedResume);
  }

  private async verifyRecruiterAccess(resumeId: number, recruiterId: number): Promise<boolean> {
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        resumeId: BigInt(resumeId),
        job: {
          companyUserId: BigInt(recruiterId),
        },
      },
    });

    return !!application;
  }

  private mapToResponseDto(resume: any): ResumeResponseDto {
    return {
      id: Number(resume.id),
      jobseekerUserId: Number(resume.jobseekerUserId),
      title: resume.title,
      introduction: resume.introduction,
      educationHistory: resume.educationHistory,
      workExperience: resume.workExperience,
      skills: resume.skills,
      filePath: resume.filePath,
      isDefault: resume.isDefault,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    };
  }
}
