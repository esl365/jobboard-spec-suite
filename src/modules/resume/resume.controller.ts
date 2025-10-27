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
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ResumeResponseDto, ResumeListResponseDto } from './dto/resume-response.dto';
import { ResumeQueryDto } from './dto/resume-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadedFile as FileType } from '../../common/storage/file-storage.service';

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
  async findAll(@Query() query: ResumeQueryDto, @Req() req: any): Promise<ResumeListResponseDto> {
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
  async findOne(@Param('id') id: string, @Req() req: any): Promise<ResumeResponseDto> {
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
    return this.resumeService.update(+id, updateResumeDto, req.user.id, req.user.roles);
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
  async setDefault(@Param('id') id: string, @Req() req: any): Promise<ResumeResponseDto> {
    return this.resumeService.setDefault(+id, req.user.id, req.user.roles);
  }

  @Post(':id/upload-pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload resume PDF',
    description: 'Upload a PDF file for the resume (max 5MB)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'PDF uploaded', type: ResumeResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file (size/type)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async uploadPDF(
    @Param('id') id: string,
    @UploadedFile() file: FileType,
    @Req() req: any,
  ): Promise<ResumeResponseDto> {
    return this.resumeService.uploadPDF(+id, file, req.user.id, req.user.roles);
  }

  @Get(':id/download-pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'recruiter', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Download resume PDF',
    description: 'Download the PDF file attached to the resume',
  })
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Resume or PDF not found' })
  async downloadPDF(@Param('id') id: string, @Req() req: any, @Res() res: Response): Promise<void> {
    const { buffer, filename } = await this.resumeService.downloadPDF(
      +id,
      req.user.id,
      req.user.roles,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Delete(':id/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete resume PDF',
    description: 'Delete the PDF file attached to the resume',
  })
  @ApiResponse({ status: 200, description: 'PDF deleted', type: ResumeResponseDto })
  @ApiResponse({ status: 400, description: 'Resume has no PDF' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async deletePDF(@Param('id') id: string, @Req() req: any): Promise<ResumeResponseDto> {
    return this.resumeService.deletePDF(+id, req.user.id, req.user.roles);
  }
}
