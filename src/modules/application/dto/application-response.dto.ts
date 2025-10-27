import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class JobSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Senior Backend Developer' })
  title: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiPropertyOptional()
  company?: {
    id: number;
    email: string;
    companyName?: string;
  };
}

class JobseekerSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'jobseeker@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  username?: string;
}

class ResumeSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Software Engineer Resume' })
  title: string;
}

class ApplicationStageDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Applied' })
  stageName: string;

  @ApiProperty({ example: 1 })
  stageOrder: number;
}

export class ApplicationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  jobId: number;

  @ApiProperty({ example: 1 })
  jobseekerUserId: number;

  @ApiProperty({ example: 1 })
  resumeId: number;

  @ApiProperty({ example: 1 })
  currentStageId: number;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'WITHDRAWN_BY_USER', 'HIRED', 'REJECTED_BY_COMPANY'],
  })
  status: string;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  appliedAt: string;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  updatedAt: string;

  @ApiPropertyOptional({ type: JobSummaryDto })
  job?: JobSummaryDto;

  @ApiPropertyOptional({ type: JobseekerSummaryDto })
  jobseeker?: JobseekerSummaryDto;

  @ApiPropertyOptional({ type: ResumeSummaryDto })
  resume?: ResumeSummaryDto;

  @ApiPropertyOptional({ type: ApplicationStageDto })
  currentStage?: ApplicationStageDto;
}
