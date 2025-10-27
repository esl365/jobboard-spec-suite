import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { PrismaService } from '../../common/prisma.service';
import { FileStorageService } from '../../common/storage/file-storage.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ResumeController],
  providers: [ResumeService, PrismaService, FileStorageService],
  exports: [ResumeService],
})
export class ResumeModule {}
