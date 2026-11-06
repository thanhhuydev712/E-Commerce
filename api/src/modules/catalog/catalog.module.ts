import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import {
  AdminCatalogController,
  PublicCatalogController,
} from './catalog.controller.js';
@Module({
  providers: [CatalogService],
  controllers: [AdminCatalogController, PublicCatalogController],
})
export class CatalogModule {}
