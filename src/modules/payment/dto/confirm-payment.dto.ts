import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmPaymentDto {
  @ApiProperty({
    example: 'tviva20240123123456ABC',
    description: 'Payment key from Toss Payments',
  })
  @IsNotEmpty()
  @IsString()
  paymentKey: string;

  @ApiProperty({
    example: 'ORDER_12345678',
    description: 'Order ID (must match the initiated order)',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    example: 10000,
    description: 'Amount in KRW (must match the initiated amount)',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;
}
