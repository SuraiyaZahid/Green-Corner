import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { QueryProductsDto } from '../products/dto/query-products.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { ProductsService } from '../products/products.service';

@ApiTags('Admin — Products')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('api/v1/admin/products')
export class AdminProductController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products including archived ones (admin)',
  })
  findAll(@Query() query: QueryProductsDto) {
    return this.productService.findAll({
      ...query,
      includeArchived: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id (admin)' })
  findOne(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a product (admin)' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product (admin)' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore an archived product (admin)',
  })
  restoreProduct(@Param('id') id: string) {
    return this.productService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive a product (admin)',
    description:
      'Products are archived rather than deleted so that order history keeps a valid product reference.',
  })
  removeProduct(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Permanently delete a product (admin)',
    description:
      'Only possible when no order references the product. Use the archive route otherwise.',
  })
  removeProductPermanently(@Param('id') id: string) {
    return this.productService.removePermanently(id);
  }
}
