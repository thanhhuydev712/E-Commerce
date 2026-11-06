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
import { DatabaseUuidPipe } from '../../common/database-uuid.pipe.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/get-user.decorator.js';
import type { Principal } from '../../common/interfaces/request-with-user.interface.js';
import { AccessService } from './access.service.js';
import { PermissionGuard, RequirePermissions } from './permission.guard.js';
import { CreateRoleDto, SetPermissionsDto, SetRolesDto } from './access.dto.js';
@ApiTags('access')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin/access')
export class AccessController {
  constructor(@Inject(AccessService) private readonly access: AccessService) {}
  @Get('roles') @RequirePermissions('access.read') roles() {
    return this.access.listRoles();
  }
  @Get('permissions') @RequirePermissions('access.read') permissions() {
    return this.access.listPermissions();
  }
  @Post('roles') @RequirePermissions('access.manage') create(
    @CurrentUser() user: Principal,
    @Body() dto: CreateRoleDto,
  ) {
    return this.access.createRole(user.id, dto);
  }
  @Put('roles/:id/permissions') @RequirePermissions('access.manage') grants(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    return this.access.setPermissions(user.id, id, dto.codes);
  }
  @Put('users/:id/roles') @RequirePermissions('access.manage') assign(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: SetRolesDto,
  ) {
    return this.access.setRoles(user.id, id, dto.roleIds);
  }
}
