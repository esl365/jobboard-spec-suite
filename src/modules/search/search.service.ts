import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  CreateSavedSearchDto,
  UpdateSavedSearchDto,
  SavedSearchResponseDto,
} from './dto/saved-search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async createSavedSearch(
    userId: number,
    dto: CreateSavedSearchDto,
  ): Promise<SavedSearchResponseDto> {
    const savedSearch = await this.prisma.savedSearch.create({
      data: {
        userId: BigInt(userId),
        searchName: dto.searchName,
        searchCriteria: dto.searchCriteria as any,
        isActive: true,
      },
    });

    return this.mapToDto(savedSearch);
  }

  async getSavedSearches(userId: number): Promise<SavedSearchResponseDto[]> {
    const searches = await this.prisma.savedSearch.findMany({
      where: {
        userId: BigInt(userId),
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return searches.map((s) => this.mapToDto(s));
  }

  async updateSavedSearch(
    id: number,
    userId: number,
    dto: UpdateSavedSearchDto,
  ): Promise<SavedSearchResponseDto> {
    const search = await this.prisma.savedSearch.findUnique({
      where: { id: BigInt(id) },
    });

    if (!search) {
      throw new NotFoundException('Saved search not found');
    }

    if (Number(search.userId) !== userId) {
      throw new ForbiddenException('You can only update your own saved searches');
    }

    const updated = await this.prisma.savedSearch.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.searchName && { searchName: dto.searchName }),
        ...(dto.searchCriteria && { searchCriteria: dto.searchCriteria as any }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.mapToDto(updated);
  }

  async deleteSavedSearch(id: number, userId: number): Promise<void> {
    const search = await this.prisma.savedSearch.findUnique({
      where: { id: BigInt(id) },
    });

    if (!search) {
      throw new NotFoundException('Saved search not found');
    }

    if (Number(search.userId) !== userId) {
      throw new ForbiddenException('You can only delete your own saved searches');
    }

    await this.prisma.savedSearch.delete({
      where: { id: BigInt(id) },
    });
  }

  async trackSearchHistory(userId: number, searchCriteria: any, resultsCount: number): Promise<void> {
    await this.prisma.searchHistory.create({
      data: {
        userId: BigInt(userId),
        searchCriteria: searchCriteria as any,
        resultsCount,
      },
    });
  }

  private mapToDto(search: any): SavedSearchResponseDto {
    return {
      id: Number(search.id),
      userId: Number(search.userId),
      searchName: search.searchName,
      searchCriteria: search.searchCriteria,
      isActive: search.isActive,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
    };
  }
}
