import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  /**
   * Version of the user's token counter at the time the token was issued.
   * Bumping the counter invalidates every token issued before that point.
   */
  ver?: number;
}
