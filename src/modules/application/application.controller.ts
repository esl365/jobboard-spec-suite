import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { ApplicationListQueryDto } from './dto/application-list-query.dto';
import { ApplicationListResponseDto } from './dto/application-list-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Applications')
@Controller('api/v1/applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to a job (jobseeker only)' })
  @ApiResponse({ status: 201, description: 'Application created successfully', type: ApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request (job not active, duplicate application, etc.)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not a jobseeker)' })
  @ApiResponse({ status: 404, description: 'Job or resume not found' })
  @ApiResponse({ status: 409, description: 'Duplicate application' })
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() req: any,
  ): Promise<ApplicationResponseDto> {
    return this.applicationService.create(createApplicationDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'recruiter', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get list of applications (role-filtered)',
    description: 'Jobseekers see their own applications, recruiters see applications for their jobs, admins see all'
  })
  @ApiResponse({ status: 200, description: 'List of applications', type: ApplicationListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query() query: ApplicationListQueryDto,
    @Req() req: any,
  ): Promise<ApplicationListResponseDto> {
    return this.applicationService.findAll(query, req.user.id, req.user.roles);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'recruiter', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get application by ID',
    description: 'Users can only view their own applications or applications for their jobs (recruiters)'
  })
  @ApiResponse({ status: 200, description: 'Application found', type: ApplicationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApplicationResponseDto> {
    return this.applicationService.findOne(+id, req.user.id, req.user.roles);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'recruiter', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update application (status or stage)',
    description: 'Jobseekers can only withdraw, recruiters can update status/stage for their jobs'
  })
  @ApiResponse({ status: 200, description: 'Application updated', type: ApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request (invalid status transition)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: any,
  ): Promise<ApplicationResponseDto> {
    return this.applicationService.update(+id, updateApplicationDto, req.user.id, req.user.roles);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Withdraw application (jobseeker or admin)',
    description: 'Soft delete by setting status to WITHDRAWN_BY_USER'
  })
  @ApiResponse({ status: 204, description: 'Application withdrawn' })
  @ApiResponse({ status: 400, description: 'Bad request (already withdrawn)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async remove(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<void> {
    return this.applicationService.remove(+id, req.user.id, req.user.roles);
  }
}
