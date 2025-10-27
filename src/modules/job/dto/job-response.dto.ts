import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobCompanyDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'company@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Acme Corporation' })
  companyName?: string;
}

export class JobResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Senior Backend Developer' })
  title: string;

  @ApiProperty({ example: 'We are looking for an experienced backend developer...' })
  description: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'EXPIRED', 'FILLED', 'DELETED'],
  })
  status: string;

  @ApiPropertyOptional({ example: 'FULL_TIME' })
  employmentType?: string;

  @ApiPropertyOptional({ example: 'YEARLY', enum: ['HOURLY', 'MONTHLY', 'YEARLY'] })
  salaryType?: string;

  @ApiPropertyOptional({ example: 50000 })
  salaryMin?: number;

  @ApiPropertyOptional({ example: 80000 })
  salaryMax?: number;

  @ApiPropertyOptional({ example: 1 })
  locationSiIdx?: number;

  @ApiPropertyOptional({ example: 1 })
  locationGuIdx?: number;

  @ApiPropertyOptional({ example: 1 })
  jobTypeIdx?: number;

  @ApiProperty({ example: '2025-10-27T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-10-27T10:00:00.000Z' })
  updatedAt: string;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z' })
  expiresAt: string;

  @ApiPropertyOptional({ type: JobCompanyDto })
  company?: JobCompanyDto;
}
