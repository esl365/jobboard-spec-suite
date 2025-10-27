import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateApplicationDto {
  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'WITHDRAWN_BY_USER', 'HIRED', 'REJECTED_BY_COMPANY'],
    description: 'Application status',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'WITHDRAWN_BY_USER', 'HIRED', 'REJECTED_BY_COMPANY'])
  status?: 'ACTIVE' | 'WITHDRAWN_BY_USER' | 'HIRED' | 'REJECTED_BY_COMPANY';

  @ApiPropertyOptional({
    example: 2,
    description: 'Move application to a different stage',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  currentStageId?: number;
}
