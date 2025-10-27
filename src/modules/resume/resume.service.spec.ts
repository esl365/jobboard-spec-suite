import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { PrismaService } from '../../common/prisma.service';
import { FileStorageService } from '../../common/storage/file-storage.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('ResumeService', () => {
  let service: ResumeService;
  let prismaMock: DeepMockProxy<PrismaService>;
  let fileStorageMock: DeepMockProxy<FileStorageService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();
    fileStorageMock = mockDeep<FileStorageService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: FileStorageService,
          useValue: fileStorageMock,
        },
      ],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
  });

  describe('create', () => {
    it('should create a new resume', async () => {
      const createResumeDto = {
        title: 'Software Engineer Resume',
        introduction: 'Experienced developer',
        educationHistory: [
          {
            school: 'Seoul National University',
            major: 'Computer Science',
            degree: 'Bachelor',
            startDate: '2018-03',
            endDate: '2022-02',
          },
        ],
        workExperience: [
          {
            company: 'Naver',
            position: 'Engineer',
            startDate: '2022-03',
          },
        ],
        skills: ['Node.js', 'React'],
        isDefault: false,
      };

      const mockResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        title: createResumeDto.title,
        introduction: createResumeDto.introduction,
        educationHistory: createResumeDto.educationHistory,
        workExperience: createResumeDto.workExperience,
        skills: createResumeDto.skills,
        filePath: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.resume.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.resume.create.mockResolvedValue(mockResume as any);

      const result = await service.create(createResumeDto, 1);

      expect(result.id).toBe(1);
      expect(result.title).toBe(createResumeDto.title);
      expect(prismaMock.resume.create).toHaveBeenCalled();
    });

    it('should unset other defaults when creating a default resume', async () => {
      const createResumeDto = {
        title: 'My Resume',
        isDefault: true,
      };

      const mockResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        title: 'My Resume',
        introduction: null,
        educationHistory: [],
        workExperience: [],
        skills: [],
        filePath: null,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.resume.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.resume.create.mockResolvedValue(mockResume as any);

      await service.create(createResumeDto, 1);

      expect(prismaMock.resume.updateMany).toHaveBeenCalledWith({
        where: {
          jobseekerUserId: BigInt(1),
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return user resumes', async () => {
      const mockResumes = [
        {
          id: BigInt(1),
          jobseekerUserId: BigInt(1),
          title: 'Resume 1',
          introduction: null,
          educationHistory: [],
          workExperience: [],
          skills: [],
          filePath: null,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.resume.findMany.mockResolvedValue(mockResumes as any);
      prismaMock.resume.count.mockResolvedValue(1);

      const result = await service.findAll(1, {}, ['jobseeker']);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a resume by id for owner', async () => {
      const mockResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        title: 'My Resume',
        introduction: null,
        educationHistory: [],
        workExperience: [],
        skills: [],
        filePath: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.resume.findUnique.mockResolvedValue(mockResume as any);

      const result = await service.findOne(1, 1, ['jobseeker']);

      expect(result.id).toBe(1);
      expect(result.title).toBe('My Resume');
    });

    it('should throw NotFoundException if resume not found', async () => {
      prismaMock.resume.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999, 1, ['jobseeker'])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const mockResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(2), // Different user
        title: 'Resume',
        filePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.resume.findUnique.mockResolvedValue(mockResume as any);

      await expect(service.findOne(1, 1, ['jobseeker'])).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a resume', async () => {
      const updateDto = {
        title: 'Updated Resume',
        skills: ['Node.js', 'TypeScript', 'Docker'],
      };

      const existingResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        title: 'Old Resume',
        introduction: null,
        educationHistory: [],
        workExperience: [],
        skills: [],
        filePath: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedResume = {
        ...existingResume,
        title: updateDto.title,
        skills: updateDto.skills,
      };

      prismaMock.resume.findUnique.mockResolvedValue(existingResume as any);
      prismaMock.resume.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.resume.update.mockResolvedValue(updatedResume as any);

      const result = await service.update(1, updateDto, 1, ['jobseeker']);

      expect(result.title).toBe(updateDto.title);
      expect(result.skills).toEqual(updateDto.skills);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const existingResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(2), // Different user
        title: 'Resume',
        filePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.resume.findUnique.mockResolvedValue(existingResume as any);

      await expect(
        service.update(1, { title: 'New Title' }, 1, ['jobseeker']),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a resume', async () => {
      const existingResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        title: 'Resume',
        filePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.resume.findUnique.mockResolvedValue(existingResume as any);
      prismaMock.jobApplication.count.mockResolvedValue(0);
      prismaMock.resume.delete.mockResolvedValue(existingResume as any);

      await service.remove(1, 1, ['jobseeker']);

      expect(prismaMock.resume.delete).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
    });

    it('should throw BadRequestException if resume is used in active applications', async () => {
      const existingResume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        title: 'Resume',
        filePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.resume.findUnique.mockResolvedValue(existingResume as any);
      prismaMock.jobApplication.count.mockResolvedValue(2); // Has active applications

      await expect(service.remove(1, 1, ['jobseeker'])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('setDefault', () => {
    it('should set resume as default', async () => {
      const resume = {
        id: BigInt(1),
        jobseekerUserId: BigInt(1),
        title: 'Resume',
        introduction: null,
        educationHistory: [],
        workExperience: [],
        skills: [],
        filePath: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedResume = {
        ...resume,
        isDefault: true,
      };

      prismaMock.resume.findUnique.mockResolvedValue(resume as any);
      prismaMock.resume.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.resume.update.mockResolvedValue(updatedResume as any);

      const result = await service.setDefault(1, 1, ['jobseeker']);

      expect(result.isDefault).toBe(true);
      expect(prismaMock.resume.updateMany).toHaveBeenCalled();
    });
  });
});
