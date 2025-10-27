import { ApiProperty } from '@nestjs/swagger';
import { ApplicationResponseDto } from './application-response.dto';

class PaginationMetaDto {
  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class ApplicationListResponseDto {
  @ApiProperty({ type: [ApplicationResponseDto] })
  data: ApplicationResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
