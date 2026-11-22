import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { CartModule } from '../cart/cart.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  // CartModule is imported so timed-out cart lines are released before an
  // order is built from the cart.
  imports: [SettingsModule, CartModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
