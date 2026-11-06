import { ApiData, MessageDto } from '../../platform/api-response.js';
import {
  AccountResponseDto,
  AccountPageDto,
  SessionResponseDto,
  AddressResponseDto,
} from './account-response.dto.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DatabaseUuidPipe } from '../../common/database-uuid.pipe.js';
import { CurrentUser } from '../../common/decorators/get-user.decorator.js';
import type { Principal } from '../../common/interfaces/request-with-user.interface.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import {
  PermissionGuard,
  RequirePermissions,
} from '../access/permission.guard.js';
import { AccountsService } from './accounts.service.js';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  ArchiveAccountDto,
  CreateAddressDto,
  UpdateAddressDto,
  AccountStatusDto,
  ListAccountsDto,
} from './accounts.dto.js';
@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class AccountsController {
  constructor(
    @Inject(AccountsService) private readonly accounts: AccountsService,
  ) {}
  @ApiData(AccountResponseDto)
  @Get()
  profile(@CurrentUser() user: Principal) {
    return this.accounts.profile(user.id);
  }
  @ApiData(AccountResponseDto)
  @Patch()
  update(@CurrentUser() user: Principal, @Body() dto: UpdateProfileDto) {
    return this.accounts.update(user.id, dto);
  }
  @ApiData(AccountResponseDto, 201, false)
  @Post('archive')
  archive(@CurrentUser() user: Principal, @Body() dto: ArchiveAccountDto) {
    return this.accounts.setStatus(
      user.id,
      user.id,
      'ARCHIVED',
      dto.currentPassword,
    );
  }
  @ApiData(MessageDto, 200, false)
  @Patch('password')
  password(@CurrentUser() user: Principal, @Body() dto: ChangePasswordDto) {
    return this.accounts.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
  @ApiData(SessionResponseDto, 200, true)
  @Get('sessions')
  sessions(@CurrentUser() user: Principal) {
    return this.accounts.sessions(user.id);
  }
  @ApiData(MessageDto, 200, false)
  @Delete('sessions/:id')
  revoke(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.accounts.revokeSession(user.id, id);
  }
  @ApiData(AddressResponseDto, 200, true)
  @Get('addresses')
  addresses(@CurrentUser() user: Principal) {
    return this.accounts.addresses(user.id);
  }
  @ApiData(AddressResponseDto, 201, false)
  @Post('addresses')
  createAddress(@CurrentUser() user: Principal, @Body() dto: CreateAddressDto) {
    return this.accounts.saveAddress(user.id, dto);
  }
  @ApiData(AddressResponseDto, 200, false)
  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.accounts.saveAddress(user.id, dto, id);
  }
  @ApiData(MessageDto, 200, false)
  @Delete('addresses/:id')
  deleteAddress(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.accounts.archiveAddress(user.id, id);
  }
}
@ApiTags('admin-accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin/accounts')
export class AdminAccountsController {
  constructor(
    @Inject(AccountsService) private readonly accounts: AccountsService,
  ) {}
  @ApiData(AccountPageDto)
  @Get()
  @RequirePermissions('accounts.read')
  list(@Query() query: ListAccountsDto) {
    return this.accounts.list(query);
  }
  @ApiData(AccountResponseDto, 200, false)
  @Get(':id')
  @RequirePermissions('accounts.read')
  profile(@Param('id', DatabaseUuidPipe) id: string) {
    return this.accounts.profile(id);
  }
  @ApiData(AccountResponseDto, 200, false)
  @Patch(':id/status')
  @RequirePermissions('accounts.manage')
  status(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
    @Body() dto: AccountStatusDto,
  ) {
    return this.accounts.setStatus(user.id, id, dto.status);
  }
}
