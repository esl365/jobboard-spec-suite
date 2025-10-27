import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsEnum } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password (minimum 8 characters)',
    minLength: 8,
  })
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    example: 'PERSONAL',
    description: 'User type',
    enum: ['PERSONAL', 'COMPANY', 'ADMIN'],
  })
  @IsEnum(['PERSONAL', 'COMPANY', 'ADMIN'])
  @IsNotEmpty()
  userType: 'PERSONAL' | 'COMPANY' | 'ADMIN';
}
