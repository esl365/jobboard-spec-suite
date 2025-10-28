import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { JobModule } from './modules/job/job.module';
import { ApplicationModule } from './modules/application/application.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ResumeModule } from './modules/resume/resume.module';
import { SearchModule } from './modules/search/search.module';
import { AdminModule } from './modules/admin/admin.module';
import { BookmarkModule } from './modules/bookmark/bookmark.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Global Database module
    DatabaseModule,

    // Rate limiting (relaxed for development)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute (increased for development)
      },
    ]),

    // Feature modules
    AuthModule,
    JobModule,
    ApplicationModule,
    PaymentModule,
    ResumeModule,
    SearchModule,
    AdminModule,
    BookmarkModule,
    // UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
