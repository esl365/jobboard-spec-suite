import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResumeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  jobseekerUserId: number;

  @ApiProperty({ example: 'Software Engineer Resume' })
  title: string;

  @ApiPropertyOptional({ example: 'Experienced full-stack developer...' })
  introduction?: string;

  @ApiPropertyOptional({
    example: [
      {
        school: 'Seoul National University',
        major: 'Computer Science',
        degree: 'Bachelor',
        startDate: '2018-03',
        endDate: '2022-02',
        gpa: '3.8/4.0',
      },
    ],
  })
  educationHistory?: any;

  @ApiPropertyOptional({
    example: [
      {
        company: 'Naver Corp',
        position: 'Software Engineer',
        startDate: '2022-03',
        endDate: '2024-12',
        description: 'Developed microservices...',
        technologies: ['Node.js', 'TypeScript', 'Docker'],
      },
    ],
  })
  workExperience?: any;

  @ApiPropertyOptional({
    example: ['Node.js', 'React', 'TypeScript', 'Docker', 'AWS'],
  })
  skills?: any;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty({ example: '2025-01-27T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-27T10:30:00Z' })
  updatedAt: string;
}

export class ResumeListResponseDto {
  @ApiProperty({ type: [ResumeResponseDto] })
  data: ResumeResponseDto[];

  @ApiProperty({
    example: {
      total: 10,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
