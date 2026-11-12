import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { QueryAdminOrdersDto } from './dto/query-admin-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@ApiTags('Admin — Orders')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('api/v1/admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'List all orders with status, payment and TrxID filters',
  })
  findAll(@Query() query: QueryAdminOrdersDto) {
    return this.adminService.findOrders(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard counters for the admin panel' })
  stats() {
    return this.adminService.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order for verification' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOrder(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update the order status',
    description:
      'Cancelling restores stock; delivering marks the payment as PAID.',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(id, dto.status);
  }

  @Patch(':id/payment')
  @ApiOperation({
    summary: 'Verify the bKash / Nagad payment status',
    description:
      'Use this after checking the submitted TrxID against the merchant account.',
  })
  updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.adminService.updatePaymentStatus(id, dto.paymentStatus);
  }
}
