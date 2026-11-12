import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { AdminCategoryController } from './admin-category.controller';
import { AdminProductController } from './admin-product.controller';
import { AdminOrdersController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ProductsModule, CategoriesModule],
  controllers: [
    AdminOrdersController,
    AdminProductController,
    AdminCategoryController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
