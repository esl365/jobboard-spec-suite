import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobListQueryDto } from './dto/job-list-query.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { JobListResponseDto } from './dto/job-list-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new job posting (recruiter/admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Job created successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() createJobDto: CreateJobDto, @Req() req: any): Promise<JobResponseDto> {
    return this.jobService.create(createJobDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of jobs with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of jobs retrieved successfully',
    type: JobListResponseDto,
  })
  async findAll(@Query() query: JobListQueryDto): Promise<JobListResponseDto> {
    return this.jobService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Job retrieved successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<JobResponseDto> {
    return this.jobService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a job posting (owner/admin only)' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Job updated successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the job owner' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
    @Req() req: any,
  ): Promise<JobResponseDto> {
    return this.jobService.update(id, updateJobDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a job posting (soft delete, owner/admin only)' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ status: 204, description: 'Job deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the job owner' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any): Promise<void> {
    return this.jobService.remove(id, req.user.id);
  }
}
