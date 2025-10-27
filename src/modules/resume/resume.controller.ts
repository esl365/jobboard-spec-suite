import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import {
  ResumeResponseDto,
  ResumeListResponseDto,
} from './dto/resume-response.dto';
import { ResumeQueryDto } from './dto/resume-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Resumes')
@Controller('api/v1/resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new resume',
    description: 'Jobseekers can create resumes with education, experience, and skills',
  })
  @ApiResponse({
    status: 201,
    description: 'Resume created successfully',
    type: ResumeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not a jobseeker)' })
  async create(
    @Body() createResumeDto: CreateResumeDto,
    @Req() req: any,
  ): Promise<ResumeResponseDto> {
    return this.resumeService.create(createResumeDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get list of resumes',
    description: 'Jobseekers see their own resumes, admins see all',
  })
  @ApiResponse({
    status: 200,
    description: 'List of resumes',
    type: ResumeListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: ResumeQueryDto,
    @Req() req: any,
  ): Promise<ResumeListResponseDto> {
    return this.resumeService.findAll(req.user.id, query, req.user.roles);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'recruiter', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get resume by ID',
    description:
      'Jobseekers see own resumes, recruiters see resumes from applications, admins see all',
  })
  @ApiResponse({
    status: 200,
    description: 'Resume found',
    type: ResumeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ResumeResponseDto> {
    return this.resumeService.findOne(+id, req.user.id, req.user.roles);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update resume',
    description: 'Jobseekers can update their own resumes',
  })
  @ApiResponse({
    status: 200,
    description: 'Resume updated',
    type: ResumeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async update(
    @Param('id') id: string,
    @Body() updateResumeDto: UpdateResumeDto,
    @Req() req: any,
  ): Promise<ResumeResponseDto> {
    return this.resumeService.update(
      +id,
      updateResumeDto,
      req.user.id,
      req.user.roles,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete resume',
    description: 'Jobseekers can delete their own resumes (if not used in active applications)',
  })
  @ApiResponse({ status: 204, description: 'Resume deleted' })
  @ApiResponse({ status: 400, description: 'Resume is used in active applications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.resumeService.remove(+id, req.user.id, req.user.roles);
  }

  @Patch(':id/set-default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set resume as default',
    description: 'Set a resume as the default one for job applications',
  })
  @ApiResponse({
    status: 200,
    description: 'Resume set as default',
    type: ResumeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async setDefault(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ResumeResponseDto> {
    return this.resumeService.setDefault(+id, req.user.id, req.user.roles);
  }
}
