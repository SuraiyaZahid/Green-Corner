import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CartExpiryService } from '../cart/cart-expiry.service';
import { uniqueSlug } from '../common/utils/slug';
import { discountedPrice } from '../common/utils/discount';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly cartExpiry: CartExpiryService,
  ) {}

  async findAll(query: QueryProductsDto) {
    // Release timed-out cart holds first, so the stock shown on the listing
    // is the stock the shopper can actually add to their cart.
    await this.cartExpiry.purgeExpired();

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const where: Prisma.ProductWhereInput = {};

    if (!query.includeArchived) {
      where.isArchived = false;
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.featured) {
      where.isFeatured = true;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { careInstructions: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.buildOrderBy(query.sort);

    const [items, total, discountPercentage] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
      this.settingsService.getDiscountPercentage(),
    ]);

    return {
      items: this.withDiscount(items, discountPercentage),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      discountPercentage,
    };
  }

  /** All live products — used by the seed-adjacent admin list and quick picks. */
  async findFeatured(limit = 8) {
    await this.cartExpiry.purgeExpired();

    const [products, discountPercentage] = await Promise.all([
      this.prisma.product.findMany({
        where: { isArchived: false, isFeatured: true },
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.settingsService.getDiscountPercentage(),
    ]);

    return this.withDiscount(products, discountPercentage);
  }

  async findBySlug(slug: string) {
    // Release timed-out cart holds first so the product page agrees with
    // the cart about what is still available.
    await this.cartExpiry.purgeExpired();

    const product = await this.prisma.product.findFirst({
      where: { slug, isArchived: false },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const discountPercentage = await this.settingsService.getDiscountPercentage();

    return this.withDiscount(product, discountPercentage);
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('The selected category does not exist.');
    }

    const slug = await uniqueSlug(dto.slug ?? dto.name, (candidate) =>
      this.prisma.product
        .findUnique({ where: { slug: candidate } })
        .then((found) => Boolean(found)),
    );

    return this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description.trim(),
        careInstructions: dto.careInstructions?.trim() ?? null,
        price: dto.price,
        stock: dto.stock,
        imageUrl: dto.imageUrl ?? null,
        images: dto.images ?? [],
        isFeatured: dto.isFeatured ?? false,
        categoryId: dto.categoryId,
      },
      include: PRODUCT_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    const data: Prisma.ProductUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      data.slug = await uniqueSlug(dto.slug, async (candidate) => {
        const found = await this.prisma.product.findUnique({
          where: { slug: candidate },
        });
        return Boolean(found && found.id !== id);
      });
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim();
    }

    if (dto.careInstructions !== undefined) {
      data.careInstructions = dto.careInstructions?.trim() ?? null;
    }

    if (dto.price !== undefined) {
      data.price = dto.price;
    }

    if (dto.stock !== undefined) {
      data.stock = dto.stock;
    }

    if (dto.imageUrl !== undefined) {
      data.imageUrl = dto.imageUrl;
    }

    if (dto.images !== undefined) {
      data.images = dto.images;
    }

    if (dto.isFeatured !== undefined) {
      data.isFeatured = dto.isFeatured;
    }

    if (dto.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('The selected category does not exist.');
      }
      data.category = { connect: { id: dto.categoryId } };
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
    });
  }

  /**
   * Products are archived rather than hard-deleted so that historic order
   * items keep a valid product reference.
   */
  async remove(id: string) {
    await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: { isArchived: true, isFeatured: false },
      include: PRODUCT_INCLUDE,
    });
  }

  async restore(id: string) {
    await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: { isArchived: false },
      include: PRODUCT_INCLUDE,
    });
  }

  /**
   * Permanently removes a product. Only possible when no order references
   * it — otherwise the archive path must be used so history stays intact.
   */
  async removePermanently(id: string) {
    await this.findById(id);

    const orderItemCount = await this.prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      throw new ConflictException(
        `This product appears in ${orderItemCount} order(s) and cannot be permanently deleted. Archive it instead.`,
      );
    }

    await this.prisma.cartItem.deleteMany({ where: { productId: id } });
    await this.prisma.product.delete({ where: { id } });

    return { message: 'Product permanently deleted.' };
  }

  /**
   * Adds the store-wide discount to a product (or list of products) so the
   * storefront can show the discounted price next to the original one.
   */
  private withDiscount<T extends { price: number }>(
    product: T,
    discountPercentage: number,
  ): T & { discountedPrice: number; discountPercentage: number };
  private withDiscount<T extends { price: number }>(
    products: T[],
    discountPercentage: number,
  ): Array<T & { discountedPrice: number; discountPercentage: number }>;
  private withDiscount<T extends { price: number }>(
    input: T | T[],
    discountPercentage: number,
  ) {
    const decorate = (product: T) => ({
      ...product,
      discountedPrice: discountedPrice(product.price, discountPercentage),
      discountPercentage,
    });

    return Array.isArray(input) ? input.map(decorate) : decorate(input);
  }

  private buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'price-asc':
        return { price: 'asc' };
      case 'price-desc':
        return { price: 'desc' };
      case 'name-asc':
        return { name: 'asc' };
      case 'name-desc':
        return { name: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }
}
