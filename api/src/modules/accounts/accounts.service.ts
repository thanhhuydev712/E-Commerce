import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { lockUser, type DbTransaction } from '../../common/database.js';
import { accountSelect, accountView } from './account-view.js';
import type {
  CreateAddressDto,
  UpdateAddressDto,
  UpdateProfileDto,
  ListAccountsDto,
} from './accounts.dto.js';

@Injectable()
export class AccountsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async profile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: accountSelect,
    });
    if (!user) throw new NotFoundException('Account not found');
    return accountView(user);
  }
  async list(query: ListAccountsDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: accountSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count(),
    ]);
    return {
      items: items.map(accountView),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
  private async activeUser(tx: DbTransaction, id: string) {
    await lockUser(tx, this.prisma.schema, id);
    const user = await tx.user.findUnique({ where: { id } });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException();
    return user;
  }
  async update(id: string, dto: UpdateProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.activeUser(tx, id);
      const user = await tx.user.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
        select: accountSelect,
      });
      await tx.auditLog.create({
        data: {
          actorId: id,
          actorType: 'USER',
          action: 'PROFILE_UPDATE',
          entityType: 'USER',
          entityId: id,
        },
      });
      return accountView(user);
    });
  }
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction(async (tx) => {
      const user = await this.activeUser(tx, id);
      if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
        throw new UnauthorizedException('Current password is incorrect');
      if (await bcrypt.compare(newPassword, user.passwordHash))
        throw new BadRequestException('New password must differ');
      await tx.user.update({
        where: { id },
        data: { passwordHash, passwordChangedAt: new Date() },
      });
      await tx.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'PASSWORD_CHANGE' },
      });
      await tx.authChallenge.updateMany({
        where: { userId: id, purpose: 'RESET_PASSWORD', consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorId: id,
          actorType: 'USER',
          action: 'PASSWORD_CHANGE',
          entityType: 'USER',
          entityId: id,
        },
      });
    });
    return { message: 'Password changed; sign in again' };
  }
  async sessions(userId: string) {
    return this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceLabel: true,
        createdAt: true,
        expiresAt: true,
        rotatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async revokeSession(userId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      await this.activeUser(tx, userId);
      const result = await tx.authSession.updateMany({
        where: { id, userId },
        data: { revokedAt: new Date(), revokeReason: 'USER_REVOKED' },
      });
      if (!result.count) throw new NotFoundException('Session not found');
    });
    return { message: 'Session revoked' };
  }
  async addresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId, archivedAt: null },
      orderBy: [{ isDefaultShipping: 'desc' }, { createdAt: 'desc' }],
    });
  }
  async saveAddress(
    userId: string,
    dto: CreateAddressDto | UpdateAddressDto,
    id?: string,
  ) {
    if (dto.isDefaultShipping === null || dto.isDefaultBilling === null)
      throw new BadRequestException('Default flags must be boolean');
    const data = {
      label: dto.label,
      recipientName: dto.recipientName,
      phone: dto.phone,
      countryCode: dto.countryCode?.toUpperCase(),
      regionCode: dto.regionCode,
      regionName: dto.regionName,
      locality: dto.locality,
      postalCode: dto.postalCode,
      line1: dto.line1,
      line2: dto.line2,
      isDefaultShipping: dto.isDefaultShipping,
      isDefaultBilling: dto.isDefaultBilling,
    };
    return this.prisma.$transaction(async (tx) => {
      await this.activeUser(tx, userId);
      if (
        id &&
        !(await tx.address.findFirst({
          where: { id, userId, archivedAt: null },
        }))
      )
        throw new NotFoundException('Address not found');
      if (dto.isDefaultShipping)
        await tx.address.updateMany({
          where: { userId, isDefaultShipping: true, archivedAt: null },
          data: { isDefaultShipping: false },
        });
      if (dto.isDefaultBilling)
        await tx.address.updateMany({
          where: { userId, isDefaultBilling: true, archivedAt: null },
          data: { isDefaultBilling: false },
        });
      if (id)
        return tx.address.update({
          where: { id },
          data,
        });
      const create = dto as CreateAddressDto;
      return tx.address.create({
        data: {
          ...data,
          recipientName: create.recipientName,
          phone: create.phone,
          line1: create.line1,
          countryCode: create.countryCode.toUpperCase(),
          userId,
          isDefaultShipping: create.isDefaultShipping ?? false,
          isDefaultBilling: create.isDefaultBilling ?? false,
        },
      });
    });
  }
  async archiveAddress(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.activeUser(tx, userId);
      const result = await tx.address.updateMany({
        where: { id, userId, archivedAt: null },
        data: {
          archivedAt: new Date(),
          isDefaultShipping: false,
          isDefaultBilling: false,
        },
      });
      if (!result.count) throw new NotFoundException('Address not found');
      return { message: 'Address archived' };
    });
  }
  async setStatus(
    actorId: string,
    id: string,
    status: string,
    password?: string,
  ) {
    if (actorId === id && password === undefined)
      throw new ForbiddenException(
        'Use the password-confirmed self archive route',
      );
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261106,1)`;
      await lockUser(tx, this.prisma.schema, id);
      const user = await tx.user.findUnique({
        where: { id },
        include: { userRolesByUser: { include: { role: true } } },
      });
      if (!user) throw new NotFoundException('Account not found');
      if (
        password !== undefined &&
        !(await bcrypt.compare(password, user.passwordHash))
      )
        throw new UnauthorizedException('Current password is incorrect');
      if (
        status !== 'ACTIVE' &&
        user.status === 'ACTIVE' &&
        user.userRolesByUser.some((item) => item.role.code === 'ADMIN')
      ) {
        const other = await tx.user.count({
          where: {
            id: { not: id },
            status: 'ACTIVE',
            userRolesByUser: { some: { role: { code: 'ADMIN' } } },
          },
        });
        if (!other)
          throw new ConflictException(
            'Cannot disable the last active administrator',
          );
      }
      const updated = await tx.user.update({
        where: { id },
        data: { status, archivedAt: status === 'ARCHIVED' ? new Date() : null },
        select: accountSelect,
      });
      if (status !== 'ACTIVE')
        await tx.authSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date(), revokeReason: status },
        });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'USER',
          action: 'ACCOUNT_STATUS_SET',
          entityType: 'USER',
          entityId: id,
          afterRedacted: { status },
        },
      });
      return accountView(updated);
    });
  }
}
