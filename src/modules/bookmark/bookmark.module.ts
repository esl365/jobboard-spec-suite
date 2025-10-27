import { Module } from '@nestjs/common';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [BookmarkController],
  providers: [BookmarkService, PrismaService],
  exports: [BookmarkService],
})
export class BookmarkModule {}
