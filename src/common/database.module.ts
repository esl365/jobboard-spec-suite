import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global DatabaseModule
 *
 * Provides a singleton PrismaService instance across all modules
 * to prevent multiple database connections and ensure efficient
 * connection pooling.
 *
 * @Global decorator makes PrismaService available everywhere
 * without needing to import DatabaseModule in each feature module.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
