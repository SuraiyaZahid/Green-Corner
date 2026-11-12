import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdatePaymentStatusDto {
  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
    description: 'Used to verify a submitted bKash / Nagad TrxID.',
  })
  @IsEnum(PaymentStatus, {
    message:
      'Payment status must be one of: UNPAID, VERIFYING, PAID, FAILED.',
  })
  paymentStatus: PaymentStatus;
}
