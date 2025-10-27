import { Controller, Post, Get, Delete, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookmarkService } from './bookmark.service';
import { BookmarkResponseDto, BookmarkToggleResponseDto } from './dto/bookmark-response.dto';

@ApiTags('Bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post(':jobId')
  @ApiOperation({ summary: 'Toggle bookmark for a job (add if not exists, remove if exists)' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark toggled successfully',
    type: BookmarkToggleResponseDto,
  })
  async toggleBookmark(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Req() req: any,
  ): Promise<BookmarkToggleResponseDto> {
    const userId = req.user.userId;
    return this.bookmarkService.toggle(userId, jobId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookmarked jobs for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of bookmarked jobs',
    type: [BookmarkResponseDto],
  })
  async getMyBookmarks(@Req() req: any): Promise<BookmarkResponseDto[]> {
    const userId = req.user.userId;
    return this.bookmarkService.findAllByUser(userId);
  }

  @Get('check/:jobId')
  @ApiOperation({ summary: 'Check if a job is bookmarked by the current user' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark status',
    schema: {
      type: 'object',
      properties: {
        bookmarked: { type: 'boolean', example: true },
      },
    },
  })
  async checkBookmark(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Req() req: any,
  ): Promise<{ bookmarked: boolean }> {
    const userId = req.user.userId;
    const bookmarked = await this.bookmarkService.checkBookmark(userId, jobId);
    return { bookmarked };
  }
}
