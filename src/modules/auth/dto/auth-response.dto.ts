import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token (short-lived, 15 minutes)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token (long-lived, 7 days)',
  })
  refreshToken: string;

  @ApiProperty({
    example: 'bearer',
    description: 'Token type',
  })
  tokenType: string;

  @ApiProperty({
    example: 900,
    description: 'Access token expiration time in seconds (15 minutes)',
  })
  expiresIn: number;

  @ApiProperty({
    example: {
      id: 1,
      email: 'user@example.com',
      userType: 'PERSONAL',
      roles: ['jobseeker'],
    },
    description: 'User information including roles',
  })
  user: {
    id: number;
    email: string;
    userType: string;
    roles?: string[];
  };
}
