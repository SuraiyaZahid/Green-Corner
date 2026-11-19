import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateSettingsDto } from '../settings/dto/update-settings.dto';
import { SettingsService } from '../settings/settings.service';

@ApiTags('Admin — Settings')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('api/v1/admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Read the store settings (admin)' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiOperation({
    summary: 'Set the store-wide discount (admin)',
    description:
      'Sets the percentage off every product. Send 0 to remove the discount.',
  })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto.discountPercentage);
  }
}
