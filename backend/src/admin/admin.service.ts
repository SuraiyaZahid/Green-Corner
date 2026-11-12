import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAdminOrdersDto } from './dto/query-admin-orders.dto';

const ORDER_INCLUDE = {
  items: true,
  user: {
    select: { id: true, name: true, email: true, phone: true },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrders(query: QueryAdminOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.OrderWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { trxId: { contains: term, mode: 'insensitive' } },
        { senderNumber: { contains: term, mode: 'insensitive' } },
        { id: { contains: term, mode: 'insensitive' } },
        { shippingAddr: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
        { user: { phone: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }

  /**
   * Changes the fulfilment status of an order. Cancelling restores the
   * reserved stock; delivering marks the payment as collected.
   */
  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.findOrder(id);

    if (order.status === status) {
      return order;
    }

    if (order.status === OrderStatus.DELIVERED && status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'A delivered order cannot be cancelled. Please contact the customer directly.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const data: Prisma.OrderUpdateInput = { status };

      if (status === OrderStatus.DELIVERED) {
        data.paymentStatus = PaymentStatus.PAID;
      }

      return tx.order.update({
        where: { id },
        data,
        include: ORDER_INCLUDE,
      });
    });

    return updated;
  }

  /** Manual verification of a submitted bKash / Nagad transaction. */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    await this.findOrder(id);

    return this.prisma.order.update({
      where: { id },
      data: { paymentStatus },
      include: ORDER_INCLUDE,
    });
  }

  /** Dashboard counters for the admin home screen. */
  async stats() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      pendingVerification,
      productCount,
      lowStockCount,
      categoryCount,
      revenue,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.count({
        where: { paymentStatus: PaymentStatus.VERIFYING },
      }),
      this.prisma.product.count({ where: { isArchived: false } }),
      this.prisma.product.count({
        where: { isArchived: false, stock: { lte: 5 } },
      }),
      this.prisma.category.count(),
      this.prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
        },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      pendingVerification,
      productCount,
      lowStockCount,
      categoryCount,
      revenue: Number((revenue._sum.totalAmount ?? 0).toFixed(2)),
      recentOrders,
    };
  }
}
