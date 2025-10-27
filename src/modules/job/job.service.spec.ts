import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { JobService } from './job.service';
import { PrismaService } from '../../common/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('JobService', () => {
  let service: JobService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
  });

  describe('create', () => {
    it('should create a new job', async () => {
      const createJobDto = {
        title: 'Backend Developer',
        description: 'We are hiring',
        employmentType: 'FULL_TIME',
        salaryType: 'YEARLY' as const,
        salaryMin: 50000,
        salaryMax: 80000,
        expiresAt: '2025-12-31T23:59:59Z',
      };

      const mockJob = {
        id: BigInt(1),
        title: createJobDto.title,
        description: createJobDto.description,
        status: 'DRAFT',
        employmentType: createJobDto.employmentType,
        salaryType: createJobDto.salaryType,
        salaryMin: 50000,
        salaryMax: 80000,
        locationSiIdx: null,
        locationGuIdx: null,
        jobTypeIdx: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        companyUserId: BigInt(1),
        company: {
          id: BigInt(1),
          email: 'company@example.com',
          companyProfile: {
            companyName: 'Acme Corp',
          },
        },
      };

      prismaMock.job.create.mockResolvedValue(mockJob as any);

      const result = await service.create(createJobDto, 1);

      expect(result).toEqual({
        id: 1,
        title: createJobDto.title,
        description: createJobDto.description,
        status: 'DRAFT',
        employmentType: createJobDto.employmentType,
        salaryType: createJobDto.salaryType,
        salaryMin: 50000,
        salaryMax: 80000,
        locationSiIdx: null,
        locationGuIdx: null,
        jobTypeIdx: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        expiresAt: expect.any(String),
        company: {
          id: 1,
          email: 'company@example.com',
          companyName: 'Acme Corp',
        },
      });

      expect(prismaMock.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createJobDto.title,
          companyUserId: BigInt(1),
          status: 'DRAFT',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return a job by id', async () => {
      const mockJob = {
        id: BigInt(1),
        title: 'Backend Developer',
        description: 'We are hiring',
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
        salaryType: 'YEARLY',
        salaryMin: 50000,
        salaryMax: 80000,
        locationSiIdx: null,
        locationGuIdx: null,
        jobTypeIdx: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        companyUserId: BigInt(1),
        company: {
          id: BigInt(1),
          email: 'company@example.com',
          companyProfile: null,
        },
        jobOptions: null,
      };

      prismaMock.job.findUnique.mockResolvedValue(mockJob as any);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.title).toBe('Backend Developer');
      expect(prismaMock.job.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if job not found', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if job is deleted', async () => {
      const mockJob = {
        id: BigInt(1),
        status: 'DELETED',
      };

      prismaMock.job.findUnique.mockResolvedValue(mockJob as any);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a job', async () => {
      const existingJob = {
        id: BigInt(1),
        companyUserId: BigInt(1),
        status: 'DRAFT',
      };

      const updatedJob = {
        id: BigInt(1),
        title: 'Updated Title',
        description: 'Updated description',
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
        salaryType: 'YEARLY',
        salaryMin: 60000,
        salaryMax: 90000,
        locationSiIdx: null,
        locationGuIdx: null,
        jobTypeIdx: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        companyUserId: BigInt(1),
        company: {
          id: BigInt(1),
          email: 'company@example.com',
          companyProfile: null,
        },
      };

      prismaMock.job.findUnique.mockResolvedValue(existingJob as any);
      prismaMock.job.update.mockResolvedValue(updatedJob as any);

      const updateDto = { title: 'Updated Title', status: 'ACTIVE' as const };
      const result = await service.update(1, updateDto, 1);

      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw ForbiddenException if user does not own the job', async () => {
      const existingJob = {
        id: BigInt(1),
        companyUserId: BigInt(2),
        status: 'DRAFT',
      };

      prismaMock.job.findUnique.mockResolvedValue(existingJob as any);

      await expect(service.update(1, {}, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete a job', async () => {
      const existingJob = {
        id: BigInt(1),
        companyUserId: BigInt(1),
        status: 'ACTIVE',
      };

      prismaMock.job.findUnique.mockResolvedValue(existingJob as any);
      prismaMock.job.update.mockResolvedValue({ ...existingJob, status: 'DELETED' } as any);

      await service.remove(1, 1);

      expect(prismaMock.job.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { status: 'DELETED' },
      });
    });

    it('should throw ForbiddenException if user does not own the job', async () => {
      const existingJob = {
        id: BigInt(1),
        companyUserId: BigInt(2),
        status: 'ACTIVE',
      };

      prismaMock.job.findUnique.mockResolvedValue(existingJob as any);

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
