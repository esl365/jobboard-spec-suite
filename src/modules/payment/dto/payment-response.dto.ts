import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentInitiateResponseDto {
  @ApiProperty({ example: 'ORDER_12345678' })
  orderId: string;

  @ApiProperty({ example: 10000 })
  amount: number;

  @ApiProperty({ example: 'https://tosspayments.com/widget/...' })
  checkoutUrl: string;

  @ApiProperty({ example: '2025-01-27T10:30:00Z' })
  createdAt: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiPropertyOptional({ example: 1 })
  packageId?: number;

  @ApiProperty({ example: 10000 })
  totalAmount: number;

  @ApiPropertyOptional({ example: 'CARD' })
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'toss_payment_12345' })
  pgTransactionId?: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
  })
  status: string;

  @ApiProperty({ example: '2025-01-27T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-27T10:30:00Z' })
  updatedAt: string;
}

export class OrderListResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  data: OrderResponseDto[];

  @ApiProperty({
    example: {
      total: 50,
      page: 1,
      limit: 20,
      totalPages: 3,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class PointTransactionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 10000 })
  amount: number;

  @ApiProperty({ example: 'CHARGE' })
  reasonType: string;

  @ApiPropertyOptional({ example: 1 })
  relatedOrderId?: number;

  @ApiPropertyOptional({ example: 'Points charged via order #1' })
  description?: string;

  @ApiProperty({ example: '2025-01-27T10:30:00Z' })
  createdAt: string;
}

export class PointTransactionListResponseDto {
  @ApiProperty({ type: [PointTransactionResponseDto] })
  data: PointTransactionResponseDto[];

  @ApiProperty({
    example: {
      total: 50,
      page: 1,
      limit: 20,
      totalPages: 3,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
