import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class InitiatePaymentDto {
  @ApiProperty({
    example: 10000,
    description: 'Amount to charge in KRW',
    minimum: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 'POINTS',
    enum: ['POINTS', 'COUPONS'],
    description: 'Type of product to purchase',
  })
  @IsNotEmpty()
  @IsEnum(['POINTS', 'COUPONS'])
  productType: 'POINTS' | 'COUPONS';

  @ApiPropertyOptional({
    example: 1,
    description: 'Optional package ID to purchase',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  packageId?: number;

  @ApiPropertyOptional({
    example: 'Points Purchase',
    description: 'Order name/description',
  })
  @IsOptional()
  @IsString()
  orderName?: string;
}
