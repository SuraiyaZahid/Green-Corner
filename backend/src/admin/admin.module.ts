import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';
import { AdminCategoryController } from './admin-category.controller';
import { AdminProductController } from './admin-product.controller';
import { AdminOrdersController } from './admin.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ProductsModule, CategoriesModule, SettingsModule],
  controllers: [
    AdminOrdersController,
    AdminProductController,
    AdminCategoryController,
    AdminSettingsController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
