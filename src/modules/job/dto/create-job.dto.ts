import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: 'Senior Backend Developer', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'We are looking for an experienced backend developer...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'FULL_TIME' })
  @IsString()
  @IsOptional()
  employmentType?: string;

  @ApiPropertyOptional({ enum: ['HOURLY', 'MONTHLY', 'YEARLY'] })
  @IsEnum(['HOURLY', 'MONTHLY', 'YEARLY'])
  @IsOptional()
  salaryType?: 'HOURLY' | 'MONTHLY' | 'YEARLY';

  @ApiPropertyOptional({ example: 50000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ example: 80000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  locationSiIdx?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  locationGuIdx?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  jobTypeIdx?: number;

  @ApiProperty({ example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;
}
