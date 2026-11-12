import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('api/v1/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the signed-in user cart' })
  getCart(@CurrentUser('sub') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a product to the cart' })
  addItem(@CurrentUser('sub') userId: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Change the quantity of a cart line' })
  updateItem(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(userId, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove a product from the cart' })
  removeItem(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.cartService.removeItem(userId, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Empty the cart' })
  clear(@CurrentUser('sub') userId: string) {
    return this.cartService.clear(userId);
  }
}
