import { Module } from '@nestjs/common';
import {
  AccountsController,
  AdminAccountsController,
} from './accounts.controller.js';
import { AccountsService } from './accounts.service.js';
@Module({
  controllers: [AccountsController, AdminAccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
