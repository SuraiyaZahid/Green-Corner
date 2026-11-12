import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ADMIN_BCRYPT_ROUNDS,
  ADMIN_EMAIL,
  ADMIN_NAME,
  ADMIN_PASSWORD,
  ADMIN_PHONE,
} from '../common/constants/admin-seed.constants';
import { PrismaService } from './prisma.service';

/**
 * Guarantees the fixed Admin account exists as soon as the API boots.
 *
 * The seed script (`prisma db seed`) also creates this account, but relying on
 * a manual step means a fresh database can come up with no administrator at
 * all. This service closes that gap: it runs on every startup and repairs the
 * account if it is missing, has the wrong password, or lost its ADMIN role.
 */
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureAdminAccount();
  }

  async ensureAdminAccount(): Promise<void> {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
        select: { id: true, role: true },
      });

      // Nothing to do when the account already exists with the right role and
      // an untouched password hash.
      if (existing && existing.role === Role.ADMIN) {
        const passwordMatches = await this.hasExpectedPassword(ADMIN_EMAIL);
        if (passwordMatches) {
          this.logger.log(`Admin account ready: ${ADMIN_EMAIL}`);
          return;
        }
      }

      const password = await bcrypt.hash(
        ADMIN_PASSWORD,
        ADMIN_BCRYPT_ROUNDS,
      );

      await this.prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {
          name: ADMIN_NAME,
          role: Role.ADMIN,
          password,
        },
        create: {
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          password,
          phone: ADMIN_PHONE,
          role: Role.ADMIN,
        },
      });

      this.logger.log(`Admin account seeded: ${ADMIN_EMAIL}`);
    } catch (error) {
      // Never crash the API because of the bootstrap step — an unreachable
      // database is a deployment problem, not a reason to fail to start.
      this.logger.error(
        `Could not seed the admin account: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Compares the stored hash against the expected admin password. */
  private async hasExpectedPassword(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { password: true },
    });

    if (!user) return false;

    return bcrypt.compare(ADMIN_PASSWORD, user.password);
  }
}
