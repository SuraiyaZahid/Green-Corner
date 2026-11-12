import {
  BadRequestException,
  Controller,
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
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../common/decorators/roles.decorator';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

@Controller('api/v1/admin/upload')
@ApiTags('Admin — Upload')
@ApiBearerAuth()
@Roles(Role.ADMIN)
export class UploadController {
  private readonly uploadDir: string;

  constructor(config: ConfigService) {
    this.uploadDir = resolve(
      process.cwd(),
      config.get<string>('UPLOAD_DIR', 'uploads'),
    );
    mkdirSync(this.uploadDir, { recursive: true });
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerStorage(),
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

    return {
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      size: file.size,
    };
  }
}

/**
 * Builds the multer disk storage. Kept outside the class so the decorator
 * metadata is evaluated once, without depending on instance state.
 */
function multerStorage() {
  const uploadDir = resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
  mkdirSync(uploadDir, { recursive: true });

  return diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname ?? '').toLowerCase();
      const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
      cb(null, `${randomUUID()}${safeExt}`);
    },
  });
}
