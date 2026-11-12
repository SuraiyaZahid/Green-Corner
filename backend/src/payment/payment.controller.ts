import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@Controller('api/v1/payment')
@ApiTags('Payment')
export class PaymentController {
  @Public()
  @Get('merchant-details')
  @ApiOperation({
    summary: 'Merchant bKash / Nagad numbers shown at checkout',
  })
  getMerchantDetails() {
    return {
      bkashNumber: '01735262232',
      nagadNumber: '01735262232',
      accountType: 'Personal / Send Money',
      instructions:
        'Send money to 01735262232 and submit your mobile number and TrxID at checkout.',
    };
  }
}
