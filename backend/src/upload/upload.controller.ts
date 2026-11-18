import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Roles } from '../common/decorators/roles.decorator';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

@Controller('api/v1/admin/upload')
@ApiTags('Admin — Upload')
@ApiBearerAuth()
@Roles(Role.ADMIN)
export class UploadController {
  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      // The file is kept in memory so it can be streamed to Cloudinary
      // instead of being written to the local uploads/ directory.
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype ?? '')) {
          cb(
            new BadRequestException(
              'Only JPG, PNG, WEBP or GIF images are allowed.',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload a product image (admin)' })
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file was provided.');
    }

    let result: UploadApiResponse;
    try {
      result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'green-corner/products',
            resource_type: 'image',
            overwrite: false,
            use_filename: true,
            unique_filename: true,
          },
          (error, uploadResult) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(uploadResult as UploadApiResponse);
          },
        );

        stream.end(file.buffer);
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Image upload failed: ${describeError(error)}`,
      );
    }

    return {
      filename: file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      size: file.size,
    };
  }
}

/**
 * Cloudinary rejects with a plain object (not an `Error`), so the useful
 * message lives on `error.message` / `error.error.message` instead of being
 * available through `instanceof`.
 */
function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: unknown; error?: { message?: unknown } };
    if (typeof candidate.message === 'string') {
      return candidate.message;
    }
    if (typeof candidate.error?.message === 'string') {
      return candidate.error.message;
    }
  }

  return 'unknown error';
}
