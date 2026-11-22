import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CartExpiryService } from '../cart/cart-expiry.service';
import { splitDiscount } from '../common/utils/discount';
import { CreateOrderDto } from './dto/create-order.dto';
import { deliveryFeeFor } from './delivery.constants';

const ORDER_INCLUDE = {
  items: true,
  user: {
    select: { id: true, name: true, email: true, phone: true },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly cartExpiry: CartExpiryService,
  ) {}

  async placeOrder(userId: string, dto: CreateOrderDto) {
    // Drop any cart line whose hold window has passed — it must not be
    // turned into an order, and its stock belongs back in the pool.
    await this.cartExpiry.purgeExpired();

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException(
        'Your cart is empty. Add products before placing an order.',
      );
    }

    this.assertPaymentDetails(dto);

    const archivedItem = cart.items.find((item) => item.product.isArchived);
    if (archivedItem) {
      throw new BadRequestException(
        `"${archivedItem.product.name}" is no longer available. Please remove it from your cart.`,
      );
    }

    const outOfStock = cart.items.find(
      (item) => item.quantity > item.product.stock,
    );
    if (outOfStock) {
      throw new ConflictException(
        `Only ${outOfStock.product.stock} unit(s) of "${outOfStock.product.name}" are in stock. Please update your cart.`,
      );
    }

    // Totals are always recomputed from the database — the client is never trusted.
    const subtotal = Number(
      cart.items
        .reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        )
        .toFixed(2),
    );

    // The store-wide discount is resolved from the database and snapshotted
    // onto the order, so editing the discount later never rewrites a past
    // invoice.
    const discountPercentage = await this.settingsService.getDiscountPercentage();
    const { discountAmount, discountedTotal } = splitDiscount(
      subtotal,
      discountPercentage,
    );

    // The delivery fee is resolved from the delivery area, so a client that
    // tampers with the request body cannot choose its own amount.
    const deliveryFee = deliveryFeeFor(dto.deliveryArea);
    const totalAmount = Number((discountedTotal + deliveryFee).toFixed(2));

    const paymentStatus =
      dto.paymentMethod === PaymentMethod.COD
        ? PaymentStatus.UNPAID
        : PaymentStatus.VERIFYING;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          totalAmount,
          deliveryArea: dto.deliveryArea,
          deliveryFee,
          subtotalAmount: subtotal,
          discountPercentage,
          discountAmount,
          shippingAddr: dto.shippingAddr.trim(),
          note: dto.note?.trim() ?? null,
          paymentMethod: dto.paymentMethod,
          paymentStatus,
          senderNumber:
            dto.paymentMethod === PaymentMethod.COD ? null : dto.senderNumber,
          trxId: dto.paymentMethod === PaymentMethod.COD ? null : dto.trxId,
          status: OrderStatus.PENDING,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              // The price actually charged is snapshotted, so the invoice
              // keeps showing the discounted price even after the store
              // discount is changed or removed.
              price: Number(
                (item.product.price * (1 - discountPercentage / 100)).toFixed(2),
              ),
            })),
          },
        },
        include: ORDER_INCLUDE,
      });

      // Decrement stock inside the same transaction as the order creation.
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return order;
  }

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.userId !== userId) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }

  /** A simple status timeline for the customer-facing order tracker. */
  async track(userId: string, orderId: string) {
    const order = await this.findOne(userId, orderId);

    const steps: Array<{ status: OrderStatus; label: string }> = [
      { status: OrderStatus.PENDING, label: 'Order placed' },
      { status: OrderStatus.PROCESSING, label: 'Processing' },
      { status: OrderStatus.DELIVERED, label: 'Delivered' },
    ];

    const currentIndex = steps.findIndex((step) => step.status === order.status);

    return {
      orderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      cancelled: order.status === OrderStatus.CANCELLED,
      steps: steps.map((step, index) => ({
        label: step.label,
        status: step.status,
        completed:
          order.status !== OrderStatus.CANCELLED && currentIndex >= index,
        current: order.status === step.status,
      })),
    };
  }

  /** Customers may cancel while the order is still pending; stock is restored. */
  async cancel(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `An order with status "${order.status}" can no longer be cancelled. Please contact us at 01735262232.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: ORDER_INCLUDE,
      });
    });

    return updated;
  }

  private assertPaymentDetails(dto: CreateOrderDto): void {
    if (dto.paymentMethod === PaymentMethod.COD) {
      return;
    }

    if (!dto.senderNumber) {
      throw new BadRequestException(
        'Your mobile number is required for bKash and Nagad payments.',
      );
    }

    if (!dto.trxId) {
      throw new BadRequestException(
        'The transaction ID (TrxID) is required for bKash and Nagad payments.',
      );
    }
  }
}
