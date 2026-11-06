import { Global, Module } from '@nestjs/common';
import { AccessController } from './access.controller.js';
import { AccessService } from './access.service.js';
import { PermissionGuard } from './permission.guard.js';
@Global()
@Module({
  controllers: [AccessController],
  providers: [AccessService, PermissionGuard],
  exports: [AccessService, PermissionGuard],
})
export class AccessModule {}
