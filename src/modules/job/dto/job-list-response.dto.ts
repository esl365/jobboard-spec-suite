import { ApiProperty } from '@nestjs/swagger';
import { JobResponseDto } from './job-response.dto';

export class PaginationMetaDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class JobListResponseDto {
  @ApiProperty({ type: [JobResponseDto] })
  data: JobResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
