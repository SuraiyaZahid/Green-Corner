import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { CartController } from './cart.controller';
import { CartExpiryService } from './cart-expiry.service';
import { CartService } from './cart.service';

@Module({
  imports: [SettingsModule],
  controllers: [CartController],
  providers: [CartService, CartExpiryService],
  exports: [CartService, CartExpiryService],
})
export class CartModule {}
