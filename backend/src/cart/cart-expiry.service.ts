import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SWEEP_INTERVAL_MS } from '../common/constants/cart-hold';

/**
 * Releases cart lines whose hold window has passed.
 *
 * A cart line only *reserves* stock — the units leave the pool when the
 * order is placed. Deleting a timed-out line is therefore what makes the
 * reserved stock available again, which is why the product listings also
 * run this cleanup: a shopper looking at "All Products" must see the same
 * availability the cart would give them.
 */
@Injectable()
export class CartExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CartExpiryService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    // The sweep keeps abandoned carts from hoarding stock even when no
    // one opens their cart. The read-path purge still covers the case
    // where the timer has not fired yet.
    this.timer = setInterval(() => {
      void this.purgeExpired();
    }, SWEEP_INTERVAL_MS);

    // Never keep the process alive just for the sweep.
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Deletes every cart line whose hold window has passed.
   *
   * Returns the number of released lines. Failures are swallowed on
   * purpose — a broken sweep must never take the API down, and the next
   * read will try again.
   */
  async purgeExpired(now = new Date()): Promise<number> {
    if (this.running) {
      return 0;
    }

    this.running = true;
    try {
      const result = await this.prisma.cartItem.deleteMany({
        where: { expiresAt: { lte: now } },
      });

      if (result.count > 0) {
        this.logger.log(
          `Released ${result.count} expired cart line(s) back to stock.`,
        );
      }

      return result.count;
    } catch (error) {
      this.logger.warn(
        `Cart expiry sweep failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 0;
    } finally {
      this.running = false;
    }
  }
}
