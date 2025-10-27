import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { PrismaService } from '../../common/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('ApplicationService', () => {
  let service: ApplicationService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ApplicationService>(ApplicationService);
  });

  describe('create', () => {
    it('should create a new application', async () => {
      const createApplicationDto = {
        jobId: 1,
        resumeId: 1,
      };

      const mockJob = {
        id: BigInt(1),
        companyUserId: BigInt(2),
        status: 'ACTIVE',
        expiresAt: new Date('2025-12-31'),
      };

      const mockResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        title: 'My Resume',
      };

      const mockStage = {
        id: BigInt(1),
        companyUserId: BigInt(2),
        stageName: 'Applied',
        stageOrder: 1,
        isDefaultStage: true,
      };

      const mockApplication = {
        id: BigInt(1),
        jobId: BigInt(1),
        jobseekerUserId: BigInt(1),
        resumeId: BigInt(1),
        currentStageId: BigInt(1),
        status: 'ACTIVE',
        appliedAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: BigInt(1),
          title: 'Backend Developer',
          status: 'ACTIVE',
          company: {
            id: BigInt(2),
            email: 'company@example.com',
            companyProfile: {
              companyName: 'Acme Corp',
            },
          },
        },
        jobseeker: {
          id: BigInt(1),
          email: 'jobseeker@example.com',
          personalProfile: {
            username: 'John Doe',
          },
        },
        resume: {
          id: BigInt(1),
          title: 'My Resume',
        },
        currentStage: mockStage,
      };

      prismaMock.job.findUnique.mockResolvedValue(mockJob as any);
      prismaMock.resume.findUnique.mockResolvedValue(mockResume as any);
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);
      prismaMock.jobApplicationStage.findFirst.mockResolvedValue(mockStage as any);
      prismaMock.jobApplication.create.mockResolvedValue(mockApplication as any);

      const result = await service.create(createApplicationDto, 1);

      expect(result).toEqual({
        id: 1,
        jobId: 1,
        jobseekerUserId: 1,
        resumeId: 1,
        currentStageId: 1,
        status: 'ACTIVE',
        appliedAt: expect.any(String),
        updatedAt: expect.any(String),
        job: {
          id: 1,
          title: 'Backend Developer',
          status: 'ACTIVE',
          company: {
            id: 2,
            email: 'company@example.com',
            companyName: 'Acme Corp',
          },
        },
        jobseeker: {
          id: 1,
          email: 'jobseeker@example.com',
          username: 'John Doe',
        },
        resume: {
          id: 1,
          title: 'My Resume',
        },
        currentStage: {
          id: 1,
          stageName: 'Applied',
          stageOrder: 1,
        },
      });

      expect(prismaMock.jobApplication.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          jobId: BigInt(1),
          jobseekerUserId: BigInt(1),
          resumeId: BigInt(1),
          status: 'ACTIVE',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if job not found', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.create({ jobId: 999, resumeId: 1 }, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if job is not active', async () => {
      const mockJob = {
        id: BigInt(1),
        status: 'DRAFT',
        expiresAt: new Date('2025-12-31'),
      };

      prismaMock.job.findUnique.mockResolvedValue(mockJob as any);

      await expect(service.create({ jobId: 1, resumeId: 1 }, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if job has expired', async () => {
      const mockJob = {
        id: BigInt(1),
        status: 'ACTIVE',
        expiresAt: new Date('2020-01-01'), // Expired
      };

      prismaMock.job.findUnique.mockResolvedValue(mockJob as any);

      await expect(service.create({ jobId: 1, resumeId: 1 }, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if application already exists', async () => {
      const mockJob = {
        id: BigInt(1),
        companyUserId: BigInt(2),
        status: 'ACTIVE',
        expiresAt: new Date('2025-12-31'),
      };

      const mockResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
      };

      const mockExistingApplication = {
        id: BigInt(1),
        jobId: BigInt(1),
        jobseekerUserId: BigInt(1),
      };

      prismaMock.job.findUnique.mockResolvedValue(mockJob as any);
      prismaMock.resume.findUnique.mockResolvedValue(mockResume as any);
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockExistingApplication as any);

      await expect(service.create({ jobId: 1, resumeId: 1 }, 1)).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if resume does not belong to user', async () => {
      const mockJob = {
        id: BigInt(1),
        status: 'ACTIVE',
        expiresAt: new Date('2025-12-31'),
      };

      const mockResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(2), // Different user
      };

      prismaMock.job.findUnique.mockResolvedValue(mockJob as any);
      prismaMock.resume.findUnique.mockResolvedValue(mockResume as any);

      await expect(service.create({ jobId: 1, resumeId: 1 }, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return an application by id for owner', async () => {
      const mockApplication = {
        id: BigInt(1),
        jobId: BigInt(1),
        jobseekerUserId: BigInt(1),
        resumeId: BigInt(1),
        currentStageId: BigInt(1),
        status: 'ACTIVE',
        appliedAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: BigInt(1),
          title: 'Backend Developer',
          status: 'ACTIVE',
          companyUserId: BigInt(2),
          company: {
            id: BigInt(2),
            email: 'company@example.com',
            companyProfile: null,
          },
        },
        jobseeker: {
          id: BigInt(1),
          email: 'jobseeker@example.com',
          personalProfile: null,
        },
        resume: {
          id: BigInt(1),
          title: 'My Resume',
        },
        currentStage: {
          id: BigInt(1),
          stageName: 'Applied',
          stageOrder: 1,
        },
      };

      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApplication as any);

      const result = await service.findOne(1, 1, ['jobseeker']);

      expect(result.id).toBe(1);
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException if application not found', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999, 1, ['jobseeker'])).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner and not recruiter of job', async () => {
      const mockApplication = {
        id: BigInt(1),
        jobseekerUserId: BigInt(2), // Different user
        job: {
          companyUserId: BigInt(3), // Different company
        },
      };

      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApplication as any);

      await expect(service.findOne(1, 1, ['jobseeker'])).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update application status', async () => {
      const existingApplication = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        status: 'ACTIVE',
        job: {
          companyUserId: BigInt(2),
        },
      };

      const updatedApplication = {
        id: BigInt(1),
        jobId: BigInt(1),
        jobseekerUserId: BigInt(1),
        resumeId: BigInt(1),
        currentStageId: BigInt(1),
        status: 'HIRED',
        appliedAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: BigInt(1),
          title: 'Backend Developer',
          status: 'ACTIVE',
          company: {
            id: BigInt(2),
            email: 'company@example.com',
            companyProfile: null,
          },
        },
        jobseeker: {
          id: BigInt(1),
          email: 'jobseeker@example.com',
          personalProfile: null,
        },
        resume: {
          id: BigInt(1),
          title: 'My Resume',
        },
        currentStage: {
          id: BigInt(1),
          stageName: 'Applied',
          stageOrder: 1,
        },
      };

      prismaMock.jobApplication.findUnique.mockResolvedValue(existingApplication as any);
      prismaMock.jobApplication.update.mockResolvedValue(updatedApplication as any);

      const result = await service.update(1, { status: 'HIRED' }, 2, ['recruiter']);

      expect(result.status).toBe('HIRED');
    });

    it('should throw ForbiddenException if jobseeker tries to update status to non-withdrawn', async () => {
      const existingApplication = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        status: 'ACTIVE',
        job: {
          companyUserId: BigInt(2),
        },
      };

      prismaMock.jobApplication.findUnique.mockResolvedValue(existingApplication as any);

      await expect(service.update(1, { status: 'HIRED' }, 1, ['jobseeker'])).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if trying to update withdrawn application', async () => {
      const existingApplication = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        status: 'WITHDRAWN_BY_USER',
        job: {
          companyUserId: BigInt(2),
        },
      };

      prismaMock.jobApplication.findUnique.mockResolvedValue(existingApplication as any);

      await expect(service.update(1, { status: 'ACTIVE' }, 2, ['recruiter'])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should withdraw an application', async () => {
      const existingApplication = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        status: 'ACTIVE',
      };

      prismaMock.jobApplication.findUnique.mockResolvedValue(existingApplication as any);
      prismaMock.jobApplication.update.mockResolvedValue({
        ...existingApplication,
        status: 'WITHDRAWN_BY_USER',
      } as any);

      await service.remove(1, 1, ['jobseeker']);

      expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { status: 'WITHDRAWN_BY_USER' },
      });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const existingApplication = {
        id: BigInt(1),
        jobseekerUserId: BigInt(2), // Different user
        status: 'ACTIVE',
      };

      prismaMock.jobApplication.findUnique.mockResolvedValue(existingApplication as any);

      await expect(service.remove(1, 1, ['jobseeker'])).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already withdrawn', async () => {
      const existingApplication = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        status: 'WITHDRAWN_BY_USER',
      };

      prismaMock.jobApplication.findUnique.mockResolvedValue(existingApplication as any);

      await expect(service.remove(1, 1, ['jobseeker'])).rejects.toThrow(BadRequestException);
    });
  });
});
