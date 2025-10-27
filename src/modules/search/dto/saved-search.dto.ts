import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateSavedSearchDto {
  @ApiProperty({ example: 'Backend Jobs in Seoul' })
  @IsString()
  searchName: string;

  @ApiProperty({
    example: { search: 'backend', locationSiIdx: 1, salaryMin: 40000 },
    description: 'Search criteria object',
  })
  @IsObject()
  searchCriteria: Record<string, any>;
}

export class UpdateSavedSearchDto {
  @ApiPropertyOptional({ example: 'Updated Search Name' })
  @IsOptional()
  @IsString()
  searchName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  searchCriteria?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SavedSearchResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'Backend Jobs in Seoul' })
  searchName: string;

  @ApiProperty({
    example: { search: 'backend', locationSiIdx: 1 },
  })
  searchCriteria: Record<string, any>;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-10-27T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-27T10:00:00.000Z' })
  updatedAt: Date;
}
