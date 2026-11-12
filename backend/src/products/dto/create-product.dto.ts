import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Money Plant (Pothos)' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    example: 'money-plant-pothos',
    description: 'URL slug. Generated from the name when omitted.',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    example:
      'A hardy trailing vine that tolerates low light and occasional neglect.',
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiPropertyOptional({
    example:
      'Water when the top 2cm of soil is dry. Bright indirect light. Fertilise monthly.',
  })
  @IsOptional()
  @IsString()
  careInstructions?: string;

  @ApiProperty({ example: 450, description: 'Price in BDT' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 25 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'https://images.example.com/money-plant.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: ['https://images.example.com/money-plant-1.jpg'],
    description: 'Additional product photos (max 6).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ example: '1f2e3d4c-5b6a-7988-9a0b-1c2d3e4f5a6b' })
  @IsUUID()
  categoryId: string;
}
