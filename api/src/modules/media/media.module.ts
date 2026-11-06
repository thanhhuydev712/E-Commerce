import { Module } from '@nestjs/common';
import { MediaService } from './media.service.js';
import { MediaController, PublicMediaController } from './media.controller.js';
@Module({
  providers: [MediaService],
  controllers: [MediaController, PublicMediaController],
})
export class MediaModule {}
