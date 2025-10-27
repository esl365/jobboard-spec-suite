import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplicationListQueryDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    default: 1,
    description: 'Page number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'WITHDRAWN_BY_USER', 'HIRED', 'REJECTED_BY_COMPANY'],
    description: 'Filter by application status',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'WITHDRAWN_BY_USER', 'HIRED', 'REJECTED_BY_COMPANY'])
  status?: 'ACTIVE' | 'WITHDRAWN_BY_USER' | 'HIRED' | 'REJECTED_BY_COMPANY';

  @ApiPropertyOptional({
    example: 1,
    description: 'Filter by job ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  jobId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filter by jobseeker user ID (admin/recruiter only)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  jobseekerUserId?: number;

  @ApiPropertyOptional({
    example: 'appliedAt',
    enum: ['appliedAt', 'updatedAt'],
    default: 'appliedAt',
    description: 'Sort field',
  })
  @IsOptional()
  @IsEnum(['appliedAt', 'updatedAt'])
  sortBy?: 'appliedAt' | 'updatedAt' = 'appliedAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
