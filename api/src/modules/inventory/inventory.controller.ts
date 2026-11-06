import { ApiData } from '../../platform/api-response.js';
import { AdjustmentResponseDto } from './inventory-response.dto.js';
import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/get-user.decorator.js';
import type { Principal } from '../../common/interfaces/request-with-user.interface.js';
import {
  PermissionGuard,
  RequirePermissions,
} from '../access/permission.guard.js';
import { InventoryService } from './inventory.service.js';
import { WarehouseDto, BalanceQuery, AdjustStockDto } from './inventory.dto.js';
@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin/inventory')
export class InventoryController {
  constructor(
    @Inject(InventoryService) private readonly inventory: InventoryService,
  ) {}
  @Get('warehouses') @RequirePermissions('inventory.read') warehouses() {
    return this.inventory.warehouses();
  }
  @Post('warehouses') @RequirePermissions('inventory.adjust') create(
    @CurrentUser() user: Principal,
    @Body() dto: WarehouseDto,
  ) {
    return this.inventory.createWarehouse(user.id, dto);
  }
  @Get('balances') @RequirePermissions('inventory.read') balances(
    @Query() query: BalanceQuery,
  ) {
    return this.inventory.balances(query);
  }
  @Get('movements') @RequirePermissions('inventory.read') movements(
    @Query() query: BalanceQuery,
  ) {
    return this.inventory.movements(query);
  }
  @ApiData(AdjustmentResponseDto)
  @Post('adjustments')
  @HttpCode(200)
  @RequirePermissions('inventory.adjust')
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  adjust(
    @CurrentUser() user: Principal,
    @Headers('idempotency-key') key: string | undefined,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventory.adjust(user.id, key, dto);
  }
}
