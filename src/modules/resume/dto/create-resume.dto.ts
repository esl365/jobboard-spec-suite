import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EducationItem {
  @ApiProperty({ example: 'Seoul National University' })
  @IsString()
  @IsNotEmpty()
  school: string;

  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  major: string;

  @ApiProperty({ example: 'Bachelor' })
  @IsString()
  @IsNotEmpty()
  degree: string;

  @ApiProperty({ example: '2018-03' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '2022-02' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: '3.8/4.0' })
  @IsString()
  @IsOptional()
  gpa?: string;
}

export class WorkExperienceItem {
  @ApiProperty({ example: 'Naver Corp' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({ example: '2022-03' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '2024-12' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Developed microservices...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['Node.js', 'TypeScript', 'Docker'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technologies?: string[];
}

export class CreateResumeDto {
  @ApiProperty({
    example: 'Software Engineer Resume',
    maxLength: 255,
    description: 'Resume title',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'Experienced full-stack developer...',
    description: 'Brief introduction or summary',
  })
  @IsString()
  @IsOptional()
  introduction?: string;

  @ApiPropertyOptional({
    type: [EducationItem],
    description: 'Education history',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItem)
  @IsOptional()
  educationHistory?: EducationItem[];

  @ApiPropertyOptional({
    type: [WorkExperienceItem],
    description: 'Work experience',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceItem)
  @IsOptional()
  workExperience?: WorkExperienceItem[];

  @ApiPropertyOptional({
    example: ['Node.js', 'React', 'TypeScript', 'Docker', 'AWS'],
    description: 'List of skills',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({
    example: false,
    description: 'Set as default resume',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
