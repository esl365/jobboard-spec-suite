import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TossPaymentsProvider } from './providers/toss-payments.provider';
import { StripeProvider } from './providers/stripe.provider';
import { PaymentProviderFactory } from './payment-provider.factory';
import { PrismaService } from '../../common/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    TossPaymentsProvider,
    StripeProvider,
    PaymentProviderFactory,
    PrismaService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
