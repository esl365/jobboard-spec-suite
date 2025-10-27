import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TossPaymentsService } from './toss-payments.service';
import { PrismaService } from '../../common/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [PaymentController],
  providers: [PaymentService, TossPaymentsService, PrismaService],
  exports: [PaymentService],
})
export class PaymentModule {}
