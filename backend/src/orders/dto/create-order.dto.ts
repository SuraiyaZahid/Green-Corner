import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryArea, PaymentMethod } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 'House 12, Road 7, Banani, Dhaka 1213, Bangladesh',
  })
  @IsString()
  @MinLength(10, { message: 'Please provide a complete shipping address.' })
  @MaxLength(300)
  shippingAddr: string;

  @ApiProperty({
    enum: DeliveryArea,
    example: DeliveryArea.INSIDE_DHAKA,
    description:
      'Where the order is delivered. The delivery fee is resolved server-side from this value — clients cannot set the amount themselves.',
  })
  @IsEnum(DeliveryArea, {
    message: 'Delivery area must be one of: INSIDE_DHAKA, OUTSIDE_DHAKA.',
  })
  deliveryArea: DeliveryArea;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.COD,
    description: 'COD, BKASH or NAGAD.',
  })
  @IsEnum(PaymentMethod, {
    message: 'Payment method must be one of: COD, BKASH, NAGAD.',
  })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: '01735262232',
    description:
      'Required for BKASH and NAGAD — the mobile number you sent the money from.',
  })
  @IsOptional()
  @Matches(/^(\+?88)?01[3-9]\d{8}$/, {
    message: 'Please enter a valid Bangladeshi mobile number.',
  })
  senderNumber?: string;

  @ApiPropertyOptional({
    example: '8H2K4L9MNP',
    description: 'Required for BKASH and NAGAD — the transaction ID from your payment.',
  })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'Please enter the transaction ID (TrxID).' })
  @MaxLength(64)
  trxId?: string;

  @ApiPropertyOptional({ example: 'Please call before delivery.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
