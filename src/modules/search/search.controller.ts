import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  CreateSavedSearchDto,
  UpdateSavedSearchDto,
  SavedSearchResponseDto,
} from './dto/saved-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Saved Searches')
@Controller('api/v1/saved-searches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @Roles('jobseeker')
  @ApiOperation({ summary: 'Create a saved search' })
  @ApiResponse({ status: 201, type: SavedSearchResponseDto })
  async create(@Body() dto: CreateSavedSearchDto, @Req() req: any): Promise<SavedSearchResponseDto> {
    return this.searchService.createSavedSearch(req.user.id, dto);
  }

  @Get()
  @Roles('jobseeker')
  @ApiOperation({ summary: 'Get all saved searches' })
  @ApiResponse({ status: 200, type: [SavedSearchResponseDto] })
  async findAll(@Req() req: any): Promise<SavedSearchResponseDto[]> {
    return this.searchService.getSavedSearches(req.user.id);
  }

  @Put(':id')
  @Roles('jobseeker')
  @ApiOperation({ summary: 'Update a saved search' })
  @ApiResponse({ status: 200, type: SavedSearchResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
    @Req() req: any,
  ): Promise<SavedSearchResponseDto> {
    return this.searchService.updateSavedSearch(+id, req.user.id, dto);
  }

  @Delete(':id')
  @Roles('jobseeker')
  @ApiOperation({ summary: 'Delete a saved search' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.searchService.deleteSavedSearch(+id, req.user.id);
  }
}
