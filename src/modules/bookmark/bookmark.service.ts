import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BookmarkResponseDto, BookmarkToggleResponseDto } from './dto/bookmark-response.dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: number, jobId: number): Promise<BookmarkToggleResponseDto> {
    // Check if bookmark already exists
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_jobId: {
          userId: BigInt(userId),
          jobId: BigInt(jobId),
        },
      },
    });

    if (existing) {
      // Remove bookmark
      await this.prisma.bookmark.delete({
        where: {
          id: existing.id,
        },
      });

      return {
        bookmarked: false,
        message: 'Bookmark removed successfully',
      };
    } else {
      // Add bookmark
      await this.prisma.bookmark.create({
        data: {
          userId: BigInt(userId),
          jobId: BigInt(jobId),
        },
      });

      return {
        bookmarked: true,
        message: 'Job bookmarked successfully',
      };
    }
  }

  async findAllByUser(userId: number): Promise<BookmarkResponseDto[]> {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: {
        userId: BigInt(userId),
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return bookmarks.map((bookmark) => ({
      id: Number(bookmark.id),
      userId: Number(bookmark.userId),
      jobId: Number(bookmark.jobId),
      createdAt: bookmark.createdAt.toISOString(),
      job: bookmark.job ? this.mapJobToResponseDto(bookmark.job) : undefined,
    }));
  }

  async checkBookmark(userId: number, jobId: number): Promise<boolean> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_jobId: {
          userId: BigInt(userId),
          jobId: BigInt(jobId),
        },
      },
    });

    return !!bookmark;
  }

  private mapJobToResponseDto(job: any): any {
    let skills: string[] | undefined;
    if (job.skills) {
      try {
        skills = JSON.parse(job.skills);
      } catch {
        skills = undefined;
      }
    }

    return {
      id: Number(job.id),
      title: job.title,
      description: job.description,
      status: job.status,
      employmentType: job.employmentType,
      salaryType: job.salaryType,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
      location: job.location,
      remote: job.remote,
      skills,
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
            logoUrl: job.company.companyProfile?.logoUrl,
          }
        : undefined,
    };
  }
}
