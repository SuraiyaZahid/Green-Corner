import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    example: 15,
    minimum: 0,
    maximum: 100,
    description:
      'Store-wide discount percentage applied to every product. Use 0 to remove the discount.',
  })
  @IsInt({ message: 'The discount percentage must be a whole number.' })
  @Min(0, { message: 'The discount percentage cannot be negative.' })
  @Max(100, { message: 'The discount percentage cannot exceed 100.' })
  discountPercentage: number;
}
