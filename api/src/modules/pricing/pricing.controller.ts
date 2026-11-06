import { ApiData } from '../../platform/api-response.js';
import {
  VariantPriceResponseDto,
  CurrencyResponseDto,
} from './pricing-response.dto.js';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/get-user.decorator.js';
import { DatabaseUuidPipe } from '../../common/database-uuid.pipe.js';
import type { Principal } from '../../common/interfaces/request-with-user.interface.js';
import {
  PermissionGuard,
  RequirePermissions,
} from '../access/permission.guard.js';
import { PricingService } from './pricing.service.js';
import { SetPriceDto, TaxClassDto, TaxRateDto } from './pricing.dto.js';
@ApiTags('settings')
@Controller('currencies')
export class CurrencyController {
  constructor(
    @Inject(PricingService) private readonly pricing: PricingService,
  ) {}
  @ApiData(CurrencyResponseDto, 200, true)
  @Get()
  currencies() {
    return this.pricing.currencies();
  }
}
@ApiTags('pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin')
export class PricingController {
  constructor(
    @Inject(PricingService) private readonly pricing: PricingService,
  ) {}
  @ApiData(VariantPriceResponseDto)
  @Put('variants/:id/price')
  @RequirePermissions('pricing.write')
  price(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: SetPriceDto,
  ) {
    return this.pricing.setPrice(user.id, id, dto);
  }
  @Get('tax-classes') @RequirePermissions('catalog.read') classes() {
    return this.pricing.taxClasses();
  }
  @Post('tax-classes') @RequirePermissions('pricing.write') createClass(
    @CurrentUser() user: Principal,
    @Body() dto: TaxClassDto,
  ) {
    return this.pricing.createTaxClass(user.id, dto);
  }
  @Get('tax-classes/:id/rates') @RequirePermissions('catalog.read') rates(
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.pricing.rates(id);
  }
  @Post('tax-classes/:id/rates')
  @RequirePermissions('pricing.write')
  createRate(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: TaxRateDto,
  ) {
    return this.pricing.createRate(user.id, id, dto);
  }
}
