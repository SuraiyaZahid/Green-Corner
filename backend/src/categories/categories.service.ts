import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { uniqueSlug } from '../common/utils/slug';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** All categories with the number of live products in each. */
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = await uniqueSlug(
      dto.slug ?? dto.name,
      (candidate) =>
        this.prisma.category
          .findUnique({ where: { slug: candidate } })
          .then((found) => Boolean(found)),
    );

    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description ?? null,
          imageUrl: dto.imageUrl ?? null,
        },
      });
    } catch {
      throw new ConflictException('A category with this name already exists.');
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      const slug = await uniqueSlug(dto.slug, async (candidate) => {
        const found = await this.prisma.category.findUnique({
          where: { slug: candidate },
        });
        return Boolean(found && found.id !== id);
      });
      data.slug = slug;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.imageUrl !== undefined) {
      data.imageUrl = dto.imageUrl;
    }

    try {
      return await this.prisma.category.update({ where: { id }, data });
    } catch {
      throw new ConflictException('A category with this name already exists.');
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    // Archived products still hold a foreign key to this category, so they
    // must be moved or permanently deleted before the category can go.
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete this category: ${productCount} product(s) still belong to it. Move or permanently delete them first.`,
      );
    }

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted successfully.' };
  }
}
