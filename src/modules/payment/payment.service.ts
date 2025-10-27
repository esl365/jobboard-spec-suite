import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PaymentProviderFactory, PaymentProviderType } from './payment-provider.factory';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import {
  PaymentInitiateResponseDto,
  OrderResponseDto,
  OrderListResponseDto,
  PointTransactionResponseDto,
  PointTransactionListResponseDto,
} from './dto/payment-response.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  /**
   * Initiate a payment order
   */
  async initiatePayment(
    initiateDto: InitiatePaymentDto,
    userId: number,
    providerType: PaymentProviderType = 'toss', // Default to Toss for Korea
  ): Promise<PaymentInitiateResponseDto> {
    const { amount, productType, packageId, orderName } = initiateDto;

    // Validate package if provided
    if (packageId) {
      const pkg = await this.prisma.productPackage.findUnique({
        where: { id: packageId },
      });

      if (!pkg) {
        throw new NotFoundException('Package not found');
      }

      if (!pkg.isActive) {
        throw new BadRequestException('Package is not active');
      }

      // Validate amount matches package price
      if (Number(pkg.price) !== amount) {
        throw new BadRequestException(
          'Amount does not match package price',
        );
      }
    }

    // Create pending order
    const order = await this.prisma.order.create({
      data: {
        userId: BigInt(userId),
        packageId: packageId || null,
        totalAmount: amount,
        status: 'PENDING',
        provider: providerType, // Store provider type
      },
    });

    const orderId = `ORDER_${order.id}`;

    // Get user for email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Use provider through factory
    const provider = this.providerFactory.getProvider(providerType);
    const result = await provider.initiate({
      orderId,
      amount,
      orderName: orderName || `Order #${order.id}`,
      customerEmail: user?.email || '',
    });

    this.logger.log(
      `Payment initiated: orderId=${orderId}, provider=${providerType}, amount=${amount}`,
    );

    return {
      orderId: result.orderId,
      amount: result.amount,
      checkoutUrl: result.checkoutUrl,
      createdAt: order.createdAt.toISOString(),
    };
  }

  /**
   * Confirm payment after user completes payment on Toss Payments
   */
  async confirmPayment(
    confirmDto: ConfirmPaymentDto,
    userId: number,
  ): Promise<OrderResponseDto> {
    const { paymentKey, orderId, amount } = confirmDto;

    // Extract order ID from string (ORDER_12345 -> 12345)
    const orderIdNum = parseInt(orderId.replace('ORDER_', ''));

    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderIdNum) },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify ownership
    if (Number(order.userId) !== userId) {
      throw new ForbiddenException('You do not own this order');
    }

    // Verify amount matches
    if (Number(order.totalAmount) !== amount) {
      throw new BadRequestException('Amount mismatch');
    }

    // Verify order is still pending
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Order already processed with status: ${order.status}`,
      );
    }

    try {
      // Get provider from order
      const providerType = (order.provider || 'toss') as PaymentProviderType;
      const provider = this.providerFactory.getProvider(providerType);

      // Confirm with provider
      const result = await provider.confirm({
        orderId,
        paymentKey,
        amount,
      });

      // Update order status and payment details
      const updatedOrder = await this.prisma.order.update({
        where: { id: BigInt(orderIdNum) },
        data: {
          status: result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
          paymentMethod: result.raw?.method || null,
          pgTransactionId: result.transactionId,
        },
      });

      // Credit points to user wallet
      await this.creditWallet(userId, amount, orderIdNum);

      this.logger.log(
        `Payment confirmed: orderId=${orderId}, userId=${userId}, amount=${amount}`,
      );

      return this.mapOrderToResponseDto(updatedOrder);
    } catch (error) {
      // Mark order as failed
      await this.prisma.order.update({
        where: { id: BigInt(orderIdNum) },
        data: { status: 'FAILED' },
      });

      this.logger.error('Payment confirmation failed', error);
      throw new BadRequestException(
        `Payment confirmation failed: ${error.message}`,
      );
    }
  }

  /**
   * Credit points to user wallet
   */
  private async creditWallet(
    userId: number,
    amount: number,
    orderId: number,
  ): Promise<void> {
    // Ensure wallet exists
    const wallet = await this.prisma.userWallet.upsert({
      where: { userId: BigInt(userId) },
      update: {},
      create: {
        userId: BigInt(userId),
        pointsBalance: 0,
        resumeReadCoupons: 0,
      },
    });

    // Calculate points (1 KRW = 1 point for simplicity)
    const pointsToAdd = BigInt(amount);

    // Update wallet balance
    await this.prisma.userWallet.update({
      where: { userId: BigInt(userId) },
      data: {
        pointsBalance: BigInt(wallet.pointsBalance) + pointsToAdd,
      },
    });

    // Create point transaction record
    await this.prisma.pointTransaction.create({
      data: {
        userId: BigInt(userId),
        amount: pointsToAdd,
        reasonType: 'CHARGE',
        relatedOrderId: BigInt(orderId),
        description: `Points charged via order #${orderId}`,
      },
    });

    this.logger.log(
      `Wallet credited: userId=${userId}, amount=${amount} points`,
    );
  }

  /**
   * Get user's order history
   */
  async getOrders(
    userId: number,
    query: PaymentQueryDto,
    userRoles: string[],
  ): Promise<OrderListResponseDto> {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause
    const where: any = {};

    // RBAC: Only show user's own orders unless admin
    const isAdmin = userRoles.includes('admin');
    if (!isAdmin) {
      where.userId = BigInt(userId);
    }

    if (status) {
      where.status = status;
    }

    const orderBy: any = {
      [sortBy]: sortOrder,
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders.map((order) => this.mapOrderToResponseDto(order)),
      meta: { total, page, limit, totalPages },
    };
  }

  /**
   * Get single order by ID
   */
  async getOrderById(
    orderId: number,
    userId: number,
    userRoles: string[],
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // RBAC: Verify ownership unless admin
    const isAdmin = userRoles.includes('admin');
    if (!isAdmin && Number(order.userId) !== userId) {
      throw new ForbiddenException('You do not own this order');
    }

    return this.mapOrderToResponseDto(order);
  }

  /**
   * Get user's point transaction history
   */
  async getPointTransactions(
    userId: number,
    query: PaymentQueryDto,
    userRoles: string[],
  ): Promise<PointTransactionListResponseDto> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause
    const where: any = {};

    // RBAC: Only show user's own transactions unless admin
    const isAdmin = userRoles.includes('admin');
    if (!isAdmin) {
      where.userId = BigInt(userId);
    }

    const orderBy: any = {
      [sortBy]: sortOrder,
    };

    const [transactions, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.pointTransaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: transactions.map((tx) =>
        this.mapPointTransactionToResponseDto(tx),
      ),
      meta: { total, page, limit, totalPages },
    };
  }

  /**
   * Get user's current wallet balance
   */
  async getWalletBalance(userId: number): Promise<{
    pointsBalance: number;
    resumeReadCoupons: number;
  }> {
    const wallet = await this.prisma.userWallet.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!wallet) {
      return {
        pointsBalance: 0,
        resumeReadCoupons: 0,
      };
    }

    return {
      pointsBalance: Number(wallet.pointsBalance),
      resumeReadCoupons: wallet.resumeReadCoupons,
    };
  }

  private mapOrderToResponseDto(order: any): OrderResponseDto {
    return {
      id: Number(order.id),
      userId: Number(order.userId),
      packageId: order.packageId ? Number(order.packageId) : undefined,
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      pgTransactionId: order.pgTransactionId,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private mapPointTransactionToResponseDto(
    tx: any,
  ): PointTransactionResponseDto {
    return {
      id: Number(tx.id),
      userId: Number(tx.userId),
      amount: Number(tx.amount),
      reasonType: tx.reasonType,
      relatedOrderId: tx.relatedOrderId
        ? Number(tx.relatedOrderId)
        : undefined,
      description: tx.description,
      createdAt: tx.createdAt.toISOString(),
    };
  }
}
