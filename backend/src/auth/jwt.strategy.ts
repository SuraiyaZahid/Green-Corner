import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change-me-to-a-long-random-string'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });

    if (!user) {
      throw new UnauthorizedException('Account no longer exists.');
    }

    // A token issued before the user's latest logout must no longer validate.
    const tokenVersion = payload.ver ?? 0;
    if (user.tokenVersion !== tokenVersion) {
      throw new UnauthorizedException(
        'This session has expired. Please sign in again.',
      );
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      ver: user.tokenVersion,
    };
  }
}
