import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString, IsNumber, IsBoolean } from 'class-validator';

export class JobListQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'EXPIRED', 'FILLED'],
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'EXPIRED', 'FILLED'])
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'EXPIRED' | 'FILLED';

  @ApiPropertyOptional({ example: 'FULL_TIME' })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional({ enum: ['HOURLY', 'MONTHLY', 'YEARLY'] })
  @IsOptional()
  @IsEnum(['HOURLY', 'MONTHLY', 'YEARLY'])
  salaryType?: 'HOURLY' | 'MONTHLY' | 'YEARLY';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  locationSiIdx?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  locationGuIdx?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  jobTypeIdx?: number;

  @ApiPropertyOptional({ example: 'backend developer' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Seoul, South Korea', description: 'Filter by location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter for remote jobs' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  remote?: boolean;

  @ApiPropertyOptional({ example: 30000, description: 'Minimum salary' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMin?: number;

  @ApiPropertyOptional({ example: 80000, description: 'Maximum salary' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMax?: number;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'expiresAt', 'title', 'salaryMin'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'expiresAt', 'title', 'salaryMin'])
  sortBy?: 'createdAt' | 'updatedAt' | 'expiresAt' | 'title' | 'salaryMin' = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
