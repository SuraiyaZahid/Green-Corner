import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { discountedPrice, round2, splitDiscount } from '../common/utils/discount';
import {
  CART_HOLD_MS,
  CART_HOLD_MINUTES,
  cartExpiryFromNow,
} from '../common/constants/cart-hold';
import { CartExpiryService } from './cart-expiry.service';
import { AddCartItemDto, CartItemMode } from './dto/add-cart-item.dto';
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
    /** The price before the store-wide discount. */
    unitPrice: number;
    /** The price actually charged, after the store-wide discount. */
    discountedUnitPrice: number;
    lineTotal: number;
    /** When the line stops holding its stock and is auto-released. */
    expiresAt: string;
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
  /** The total before the store-wide discount. */
  subtotal: number;
  /** The discount applied to the subtotal. */
  discountAmount: number;
  /** The store-wide discount percentage in force. */
  discountPercentage: number;
  /** The total the customer actually pays for the items. */
  total: number;
  /** How long a cart line holds its stock, in minutes. */
  holdMinutes: number;
}

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly cartExpiry: CartExpiryService,
  ) {}

  async getCart(userId: string): Promise<CartView> {
    // Release anything that already timed out before reading the cart.
    await this.cartExpiry.purgeExpired();

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });

    const discountPercentage = await this.settingsService.getDiscountPercentage();

    if (!cart) {
      return {
        id: null,
        items: [],
        totalItems: 0,
        subtotal: 0,
        discountAmount: 0,
        discountPercentage,
        total: 0,
        holdMinutes: CART_HOLD_MINUTES,
      };
    }

    return this.mapCart(cart, discountPercentage);
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

    // "Add to Cart" adds to whatever the line already holds, while "Buy Now"
    // replaces it. Replacing matters for Buy Now: buying a product that is
    // already in the cart would otherwise try to reserve it twice and trip
    // the stock check.
    const requestedQuantity =
      dto.mode === CartItemMode.SET
        ? dto.quantity
        : (existing?.quantity ?? 0) + dto.quantity;

    if (requestedQuantity > product.stock) {
      throw new ConflictException(
        `Only ${product.stock} unit(s) of "${product.name}" are in stock.`,
      );
    }

    const expiresAt = cartExpiryFromNow();

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: requestedQuantity, expiresAt },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: requestedQuantity,
          expiresAt,
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

    // Touching the line restarts its hold window.
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity, expiresAt: cartExpiryFromNow() },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Cart not found.');
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

  /**
   * Finds the shopper's cart, creating an empty one on first use.
   */
  private async ensureCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { userId } });
    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({ data: { userId } });
  }

  private mapCart(
    cart: {
      id: string;
      items: Array<{
        id: string;
        productId: string;
        quantity: number;
        expiresAt: Date;
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
    },
    discountPercentage: number,
  ): CartView {
    const items = cart.items.map((item) => {
      const discountedUnitPrice = discountedPrice(
        item.product.price,
        discountPercentage,
      );

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.product.price,
        discountedUnitPrice,
        lineTotal: round2(discountedUnitPrice * item.quantity),
        expiresAt: item.expiresAt.toISOString(),
        product: item.product,
      };
    });

    const subtotal = round2(
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );

    const { discountAmount, discountedTotal } = splitDiscount(
      subtotal,
      discountPercentage,
    );

    return {
      id: cart.id,
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discountAmount,
      discountPercentage,
      total: discountedTotal,
      holdMinutes: CART_HOLD_MINUTES,
    };
  }
}

export { CART_HOLD_MS, CART_HOLD_MINUTES };
