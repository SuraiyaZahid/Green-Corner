import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [SettingsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
