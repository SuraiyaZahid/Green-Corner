/**
 * Fixed Admin account for Green Corner.
 *
 * These values are the single source of truth for the seeded administrator
 * and are shared by the Prisma seed script and the boot-time seeding service,
 * so the two can never drift apart.
 */
export const ADMIN_EMAIL = 'admin@greencorner.bd';
export const ADMIN_PASSWORD = 'AdminPassword123!';
export const ADMIN_NAME = 'Green Corner Admin';
export const ADMIN_PHONE = '01735262232';

/** Cost factor used when hashing the admin password. */
export const ADMIN_BCRYPT_ROUNDS = 10;
