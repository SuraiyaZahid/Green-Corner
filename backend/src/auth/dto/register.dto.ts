import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Rakib Hasan' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'rakib@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @ApiProperty({ example: 'StrongPass@123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: '01735262232', required: false })
  @IsOptional()
  @Matches(/^(\+?88)?01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number.',
  })
  phone?: string;
}
