import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Place an order from the current cart',
    description:
      'bKash and Nagad orders require the sender mobile number and TrxID. Cash on Delivery orders are created as UNPAID.',
  })
  placeOrder(@CurrentUser('sub') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.placeOrder(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List the signed-in user order history' })
  findMyOrders(@CurrentUser('sub') userId: string) {
    return this.ordersService.findMyOrders(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order with its items' })
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.findOne(userId, orderId);
  }

  @Get(':id/track')
  @ApiOperation({ summary: 'Get the delivery status timeline for an order' })
  track(@CurrentUser('sub') userId: string, @Param('id') orderId: string) {
    return this.ordersService.track(userId, orderId);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a pending order',
    description: 'Stock is restored automatically when an order is cancelled.',
  })
  cancel(@CurrentUser('sub') userId: string, @Param('id') orderId: string) {
    return this.ordersService.cancel(userId, orderId);
  }
}
