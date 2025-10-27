import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PaymentProviderType } from './payment-provider.factory';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import {
  PaymentInitiateResponseDto,
  OrderResponseDto,
  OrderListResponseDto,
  PointTransactionListResponseDto,
} from './dto/payment-response.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Payments')
@Controller('api/v1/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate a payment order',
    description: 'Create a pending payment order and get checkout URL for Toss Payments',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated successfully',
    type: PaymentInitiateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async initiatePayment(
    @Body() initiateDto: InitiatePaymentDto,
    @Req() req: any,
    @Query('provider') provider: PaymentProviderType = 'toss',
  ): Promise<PaymentInitiateResponseDto> {
    return this.paymentService.initiatePayment(initiateDto, req.user.id, provider);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm a payment',
    description: 'Confirm payment with Toss Payments and update order status, credit wallet',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (amount mismatch, already processed, etc.)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not order owner)' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async confirmPayment(
    @Body() confirmDto: ConfirmPaymentDto,
    @Req() req: any,
  ): Promise<OrderResponseDto> {
    return this.paymentService.confirmPayment(confirmDto, req.user.id);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'jobseeker', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get order history',
    description: 'Users see their own orders, admins see all orders',
  })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: OrderListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrders(@Query() query: PaymentQueryDto, @Req() req: any): Promise<OrderListResponseDto> {
    return this.paymentService.getOrders(req.user.id, query, req.user.roles);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'jobseeker', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Users can only view their own orders unless admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('id') id: string, @Req() req: any): Promise<OrderResponseDto> {
    return this.paymentService.getOrderById(+id, req.user.id, req.user.roles);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'jobseeker', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get point transaction history',
    description: 'Users see their own transactions, admins see all',
  })
  @ApiResponse({
    status: 200,
    description: 'List of point transactions',
    type: PointTransactionListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPointTransactions(
    @Query() query: PaymentQueryDto,
    @Req() req: any,
  ): Promise<PointTransactionListResponseDto> {
    return this.paymentService.getPointTransactions(req.user.id, query, req.user.roles);
  }

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get wallet balance',
    description: 'Get current points balance and resume read coupons',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance',
    schema: {
      example: {
        pointsBalance: 10000,
        resumeReadCoupons: 5,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWalletBalance(
    @Req() req: any,
  ): Promise<{ pointsBalance: number; resumeReadCoupons: number }> {
    return this.paymentService.getWalletBalance(req.user.id);
  }
}
