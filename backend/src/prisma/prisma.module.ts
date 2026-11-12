import { Global, Module } from '@nestjs/common';
import { AdminSeedService } from './admin-seed.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, AdminSeedService],
  exports: [PrismaService, AdminSeedService],
})
export class PrismaModule {}
