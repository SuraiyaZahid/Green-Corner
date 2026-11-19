import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** The single settings row is pinned to this id. */
const SETTINGS_ID = 'default';

export interface StoreSettingsView {
  discountPercentage: number;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reads the store settings, creating the singleton row on first access so
   * callers never have to handle a "not set up yet" state.
   */
  async getSettings(): Promise<StoreSettingsView> {
    const existing = await this.prisma.storeSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (existing) {
      return { discountPercentage: existing.discountPercentage };
    }

    const created = await this.prisma.storeSettings.create({
      data: { id: SETTINGS_ID, discountPercentage: 0 },
    });

    return { discountPercentage: created.discountPercentage };
  }

  /** Updates the store-wide discount percentage. */
  async updateSettings(discountPercentage: number): Promise<StoreSettingsView> {
    await this.getSettings();

    const updated = await this.prisma.storeSettings.update({
      where: { id: SETTINGS_ID },
      data: { discountPercentage },
    });

    return { discountPercentage: updated.discountPercentage };
  }

  /**
   * Resolves the discount percentage currently in force.
   *
   * The value is always read from the database — the client never sends the
   * percentage it wants applied, so a tampered request cannot change what the
   * customer is charged.
   */
  async getDiscountPercentage(): Promise<number> {
    const settings = await this.getSettings();
    return settings.discountPercentage;
  }
}
