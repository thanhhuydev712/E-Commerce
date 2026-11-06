import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StorefrontService } from './storefront.service.js';
import { ApiData } from '../../platform/api-response.js';
import { StorefrontResponseDto } from './storefront-response.dto.js';
@ApiTags('storefront')
@Controller('storefront')
export class StorefrontController {
  constructor(
    @Inject(StorefrontService) private readonly store: StorefrontService,
  ) {}
  @Get()
  @ApiData(StorefrontResponseDto)
  @ApiOperation({
    summary:
      'Published catalog, content and public presentation; VND amounts are strings',
  })
  snapshot() {
    return this.store.snapshot();
  }
}
