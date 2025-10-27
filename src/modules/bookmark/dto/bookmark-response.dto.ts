import { ApiProperty } from '@nestjs/swagger';
import { JobResponseDto } from '../../job/dto/job-response.dto';

export class BookmarkResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 1 })
  jobId: number;

  @ApiProperty({ example: '2025-10-27T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ type: JobResponseDto, required: false })
  job?: JobResponseDto;
}

export class BookmarkToggleResponseDto {
  @ApiProperty({ example: true, description: 'Whether the job is now bookmarked' })
  bookmarked: boolean;

  @ApiProperty({ example: 'Job bookmarked successfully', required: false })
  message?: string;
}
