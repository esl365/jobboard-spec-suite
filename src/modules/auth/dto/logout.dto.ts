import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Device ID to logout from (optional, defaults to current device)',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
