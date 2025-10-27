import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  DashboardStatsDto,
  UserManagementDto,
  JobModerationDto,
  UpdateUserStatusDto,
  UpdateJobStatusDto,
  AnalyticsDto,
} from './dto/admin-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Dashboard')
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics (admin only)' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination (admin only)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: [UserManagementDto] })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ users: UserManagementDto[]; total: number }> {
    return this.adminService.getUsers(Number(page) || 1, Number(limit) || 20);
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Update user status (admin only)' })
  @ApiResponse({ status: 200 })
  @HttpCode(HttpStatus.OK)
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<{ message: string }> {
    await this.adminService.updateUserStatus(+id, dto.status);
    return { message: 'User status updated successfully' };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({ status: 204 })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.adminService.deleteUser(+id);
  }

  @Get('jobs/pending')
  @ApiOperation({ summary: 'Get pending jobs for moderation (admin only)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: [JobModerationDto] })
  async getPendingJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ jobs: JobModerationDto[]; total: number }> {
    return this.adminService.getPendingJobs(Number(page) || 1, Number(limit) || 20);
  }

  @Put('jobs/:id/status')
  @ApiOperation({ summary: 'Update job status (admin only)' })
  @ApiResponse({ status: 200 })
  @HttpCode(HttpStatus.OK)
  async updateJobStatus(
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ): Promise<{ message: string }> {
    await this.adminService.updateJobStatus(+id, dto.status);
    return { message: 'Job status updated successfully' };
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Delete job (admin only)' })
  @ApiResponse({ status: 204 })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteJob(@Param('id') id: string): Promise<void> {
    await this.adminService.deleteJob(+id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics (admin only)' })
  @ApiResponse({ status: 200, type: AnalyticsDto })
  async getAnalytics(): Promise<AnalyticsDto> {
    return this.adminService.getAnalytics();
  }
}
