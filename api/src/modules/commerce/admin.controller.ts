import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import {
  PermissionGuard,
  RequirePermissions,
} from '../access/permission.guard.js';
@ApiTags('admin-store')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('accounts.read', 'catalog.read')
@Controller('admin/store')
export class AdminStoreController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  @Get('overview') async overview() {
    const [products, orders, accounts, stock, totals] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.inventoryBalance.aggregate({
        _sum: { onHand: true, reserved: true, unavailable: true },
      }),
      this.prisma.payment.aggregate({
        _sum: { capturedAmount: true, refundedAmount: true },
      }),
    ]);
    return {
      products,
      orders,
      accounts,
      stock: stock._sum,
      captured: totals._sum.capturedAmount ?? 0n,
      refunded: totals._sum.refundedAmount ?? 0n,
    };
  }
}
