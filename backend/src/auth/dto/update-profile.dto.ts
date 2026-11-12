import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Rakib Hasan' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'rakib@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email?: string;

  @ApiPropertyOptional({ example: '01735262232' })
  @IsOptional()
  @Matches(/^(\+?88)?01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number.',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'StrongPass@123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @MaxLength(72)
  password?: string;
}
