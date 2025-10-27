import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApplicationDto {
  @ApiProperty({
    example: 1,
    description: 'Job ID to apply to',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  jobId: number;

  @ApiProperty({
    example: 1,
    description: 'Resume ID to submit with application',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  resumeId: number;
}
