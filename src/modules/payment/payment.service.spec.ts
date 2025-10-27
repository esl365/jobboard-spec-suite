import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { TossPaymentsService } from './toss-payments.service';
import { PrismaService } from '../../common/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaMock: DeepMockProxy<PrismaService>;
  let tossPaymentsServiceMock: DeepMockProxy<TossPaymentsService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();
    tossPaymentsServiceMock = mockDeep<TossPaymentsService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: TossPaymentsService,
          useValue: tossPaymentsServiceMock,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('initiatePayment', () => {
    it('should create a pending order', async () => {
      const initiateDto = {
        amount: 10000,
        productType: 'POINTS' as const,
      };

      const mockOrder = {
        id: BigInt(1),
        userId: BigInt(1),
        packageId: null,
        totalAmount: 10000,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.order.create.mockResolvedValue(mockOrder as any);

      const result = await service.initiatePayment(initiateDto, 1);

      expect(result).toHaveProperty('orderId', 'ORDER_1');
      expect(result).toHaveProperty('amount', 10000);
      expect(result).toHaveProperty('checkoutUrl');
      expect(prismaMock.order.create).toHaveBeenCalled();
    });

    it('should validate package if packageId provided', async () => {
      const initiateDto = {
        amount: 10000,
        productType: 'POINTS' as const,
        packageId: 1,
      };

      prismaMock.productPackage.findUnique.mockResolvedValue(null);

      await expect(
        service.initiatePayment(initiateDto, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate amount matches package price', async () => {
      const initiateDto = {
        amount: 5000,
        productType: 'POINTS' as const,
        packageId: 1,
      };

      const mockPackage = {
        id: 1,
        packageName: 'Basic Package',
        price: 10000,
        benefits: {},
        isActive: true,
      };

      prismaMock.productPackage.findUnique.mockResolvedValue(mockPackage as any);

      await expect(
        service.initiatePayment(initiateDto, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment and credit wallet', async () => {
      const confirmDto = {
        paymentKey: 'test_payment_key_123',
        orderId: 'ORDER_1',
        amount: 10000,
      };

      const mockOrder = {
        id: BigInt(1),
        userId: BigInt(1),
        totalAmount: 10000,
        status: 'PENDING',
      };

      const mockUpdatedOrder = {
        ...mockOrder,
        status: 'COMPLETED',
        paymentMethod: 'CARD',
        pgTransactionId: 'test_payment_key_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockWallet = {
        userId: BigInt(1),
        pointsBalance: BigInt(0),
        resumeReadCoupons: 0,
        updatedAt: new Date(),
      };

      const mockTossResponse = {
        method: 'CARD',
        paymentKey: 'test_payment_key_123',
        orderId: 'ORDER_1',
        totalAmount: 10000,
        status: 'DONE',
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);
      prismaMock.order.update.mockResolvedValue(mockUpdatedOrder as any);
      prismaMock.userWallet.upsert.mockResolvedValue(mockWallet as any);
      prismaMock.userWallet.update.mockResolvedValue({
        ...mockWallet,
        pointsBalance: BigInt(10000),
      } as any);
      prismaMock.pointTransaction.create.mockResolvedValue({} as any);
      tossPaymentsServiceMock.confirmPayment.mockResolvedValue(mockTossResponse as any);

      const result = await service.confirmPayment(confirmDto, 1);

      expect(result.status).toBe('COMPLETED');
      expect(prismaMock.order.update).toHaveBeenCalled();
      expect(prismaMock.userWallet.update).toHaveBeenCalled();
      expect(prismaMock.pointTransaction.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      const confirmDto = {
        paymentKey: 'test_key',
        orderId: 'ORDER_999',
        amount: 10000,
      };

      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmPayment(confirmDto, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own order', async () => {
      const confirmDto = {
        paymentKey: 'test_key',
        orderId: 'ORDER_1',
        amount: 10000,
      };

      const mockOrder = {
        id: BigInt(1),
        userId: BigInt(2), // Different user
        totalAmount: 10000,
        status: 'PENDING',
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

      await expect(
        service.confirmPayment(confirmDto, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if amount mismatch', async () => {
      const confirmDto = {
        paymentKey: 'test_key',
        orderId: 'ORDER_1',
        amount: 5000, // Different amount
      };

      const mockOrder = {
        id: BigInt(1),
        userId: BigInt(1),
        totalAmount: 10000,
        status: 'PENDING',
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

      await expect(
        service.confirmPayment(confirmDto, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if order already processed', async () => {
      const confirmDto = {
        paymentKey: 'test_key',
        orderId: 'ORDER_1',
        amount: 10000,
      };

      const mockOrder = {
        id: BigInt(1),
        userId: BigInt(1),
        totalAmount: 10000,
        status: 'COMPLETED', // Already completed
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

      await expect(
        service.confirmPayment(confirmDto, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOrders', () => {
    it('should return user orders', async () => {
      const mockOrders = [
        {
          id: BigInt(1),
          userId: BigInt(1),
          packageId: null,
          totalAmount: 10000,
          paymentMethod: 'CARD',
          pgTransactionId: 'test_123',
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders as any);
      prismaMock.order.count.mockResolvedValue(1);

      const result = await service.getOrders(1, {}, ['jobseeker']);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status if provided', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);
      prismaMock.order.count.mockResolvedValue(0);

      await service.getOrders(1, { status: 'COMPLETED' }, ['jobseeker']);

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });
  });

  describe('getWalletBalance', () => {
    it('should return wallet balance', async () => {
      const mockWallet = {
        userId: BigInt(1),
        pointsBalance: BigInt(10000),
        resumeReadCoupons: 5,
        updatedAt: new Date(),
      };

      prismaMock.userWallet.findUnique.mockResolvedValue(mockWallet as any);

      const result = await service.getWalletBalance(1);

      expect(result.pointsBalance).toBe(10000);
      expect(result.resumeReadCoupons).toBe(5);
    });

    it('should return zero balance if wallet not found', async () => {
      prismaMock.userWallet.findUnique.mockResolvedValue(null);

      const result = await service.getWalletBalance(1);

      expect(result.pointsBalance).toBe(0);
      expect(result.resumeReadCoupons).toBe(0);
    });
  });
});
