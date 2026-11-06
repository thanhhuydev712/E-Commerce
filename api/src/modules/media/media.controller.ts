import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiData } from '../../platform/api-response.js';
import { MediaResponseDto } from './media-response.dto.js';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/get-user.decorator.js';
import { DatabaseUuidPipe } from '../../common/database-uuid.pipe.js';
import type { Principal } from '../../common/interfaces/request-with-user.interface.js';
import {
  PermissionGuard,
  RequirePermissions,
} from '../access/permission.guard.js';
import { MediaService, type ImageUpload } from './media.service.js';
@ApiTags('media')
@Controller('media')
export class PublicMediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}
  @Get(':id') async content(
    @Param('id', DatabaseUuidPipe) id: string,
    @Res() response: Response,
  ) {
    const file = await this.media.content(id);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.type(file.mimeType).send(file.bytes);
  }
}
@ApiTags('admin-media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('media.write')
@Controller('admin/media')
export class MediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}
  @Post()
  @ApiData(MediaResponseDto, 201)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
    }),
  )
  upload(
    @CurrentUser() user: Principal,
    @UploadedFile() file: ImageUpload | undefined,
  ) {
    return this.media.upload(user.id, file);
  }
  @ApiData(MediaResponseDto)
  @Get(':id')
  metadata(@Param('id', DatabaseUuidPipe) id: string) {
    return this.media.metadata(id);
  }
  @Get(':id/content') async preview(
    @Param('id', DatabaseUuidPipe) id: string,
    @Res() response: Response,
  ) {
    const file = await this.media.content(id, true);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.type(file.mimeType).send(file.bytes);
  }
}
