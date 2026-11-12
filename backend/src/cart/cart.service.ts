import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_INCLUDE = {
  items: {
    include: {
      product: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

export interface CartView {
  id: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      stock: number;
      imageUrl: string | null;
      images: string[];
      isArchived: boolean;
      category: { id: string; name: string; slug: string };
    };
  }>;
  totalItems: number;
  subtotal: number;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });

    if (!cart) {
      return { id: null, items: [], totalItems: 0, subtotal: 0 };
    }

    return this.mapCart(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartView> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product || product.isArchived) {
      throw new NotFoundException('Product not found.');
    }

    const cart = await this.ensureCart(userId);
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });

    const requestedQuantity = (existing?.quantity ?? 0) + dto.quantity;

    if (requestedQuantity > product.stock) {
      throw new ConflictException(
        `Only ${product.stock} unit(s) of "${product.name}" are in stock.`,
      );
    }

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: requestedQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found.');
    }

    if (item.product.isArchived) {
      throw new BadRequestException(
        `"${item.product.name}" is no longer available. Please remove it from your cart.`,
      );
    }

    if (dto.quantity > item.product.stock) {
      throw new ConflictException(
        `Only ${item.product.stock} unit(s) of "${item.product.name}" are in stock.`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.getCart(userId);
  }

  async clear(userId: string): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return this.getCart(userId);
  }

  private async ensureCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { userId } });
    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({ data: { userId } });
  }

  private mapCart(cart: {
    id: string;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        stock: number;
        imageUrl: string | null;
        images: string[];
        isArchived: boolean;
        category: { id: string; name: string; slug: string };
      };
    }>;
  }): CartView {
    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.product.price,
      lineTotal: Number((item.product.price * item.quantity).toFixed(2)),
      product: item.product,
    }));

    return {
      id: cart.id,
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Number(
        items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
      ),
    };
  }
}
