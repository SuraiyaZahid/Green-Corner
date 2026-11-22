import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export enum CartItemMode {
  /** Add the quantity to whatever the line already holds. */
  ADD = 'add',
  /** Replace the line with the given quantity. */
  SET = 'set',
}

export class AddCartItemDto {
  @ApiProperty({ example: '1f2e3d4c-5b6a-7988-9a0b-1c2d3e4f5a6b' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 99 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;

  /**
   * How the quantity applies to a line that is already in the cart.
   *
   * "Add to Cart" adds to the existing line, while "Buy Now" replaces it —
   * otherwise buying a product that is already in the cart would try to
   * reserve it twice and trip the stock check.
   */
  @ApiPropertyOptional({
    enum: CartItemMode,
    default: CartItemMode.ADD,
  })
  @IsOptional()
  @IsIn([CartItemMode.ADD, CartItemMode.SET])
  mode?: CartItemMode;
}
