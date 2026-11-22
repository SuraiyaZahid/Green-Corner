import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { CartModule } from '../cart/cart.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  // CartModule is imported so the product listings can release timed-out
  // cart holds and show the stock a shopper can really add.
  imports: [SettingsModule, CartModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
