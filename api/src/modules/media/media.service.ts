import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { PrismaService } from '../../prisma/prisma.service.js';
import { inspectImage } from './image.rules.js';
import { Prisma } from '../../../generated/prisma-v2/index.js';
export interface ImageUpload {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}
@Injectable()
export class MediaService {
  private readonly root: string;
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) config: ConfigService,
  ) {
    this.root = resolve(config.get<string>('MEDIA_ROOT') ?? '.local-media');
  }
  async upload(actorId: string, file: ImageUpload | undefined) {
    if (!file) throw new BadRequestException('Image file is required');
    const image = inspectImage(file.buffer, file.mimetype),
      id = randomUUID(),
      storageKey = `${id}.${image.extension}`;
    await mkdir(this.root, { recursive: true });
    const destination = resolve(this.root, storageKey);
    await writeFile(destination, file.buffer, { flag: 'wx' });
    try {
      return await this.prisma.$transaction(async (tx) => {
        const originalName =
          basename(file.originalname)
            .replace(/\p{Cc}/gu, '')
            .slice(0, 255) || id;
        const row = await tx.mediaAsset.create({
          data: {
            id,
            storageKey,
            originalName,
            mimeType: image.mimeType,
            sizeBytes: BigInt(file.buffer.length),
            width: image.width,
            height: image.height,
            checksum: createHash('sha256').update(file.buffer).digest('hex'),
            status: 'READY',
            uploadedBy: actorId,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            actorType: 'USER',
            action: 'MEDIA_UPLOAD',
            entityType: 'MEDIA_ASSET',
            entityId: id,
          },
        });
        return {
          id: row.id,
          status: row.status,
          mimeType: row.mimeType,
          width: row.width,
          height: row.height,
          sizeBytes: row.sizeBytes,
        };
      });
    } catch (error) {
      await unlink(destination).catch(() => {});
      throw error;
    }
  }
  async metadata(id: string) {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Media not found');
    return {
      id: row.id,
      status: row.status,
      originalName: row.originalName,
      mimeType: row.mimeType,
      width: row.width,
      height: row.height,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt,
    };
  }
  async content(id: string, admin = false) {
    const table = (name: string) =>
      Prisma.raw(`"${this.prisma.schema}"."${name}"`);
    // Kiểm visibility trong cùng một SQL, tránh mỗi ảnh mở một transaction nhiều round trip.
    const row = admin
      ? await this.prisma.mediaAsset.findFirst({
          where: { id, status: 'READY' },
        })
      : (
          await this.prisma.$queryRaw<
            { storageKey: string; mimeType: string }[]
          >(Prisma.sql`
      WITH RECURSIVE visible AS (
        SELECT id,1 AS depth FROM ${table('categories')} WHERE parent_id IS NULL AND status='ACTIVE'
        UNION ALL SELECT c.id,v.depth+1 FROM ${table('categories')} c JOIN visible v ON c.parent_id=v.id WHERE c.status='ACTIVE' AND v.depth<16
      ) SELECT ma.storage_key AS "storageKey",ma.mime_type AS "mimeType" FROM ${table('media_assets')} ma
      WHERE ma.id=${id}::uuid AND ma.status='READY' AND (
        EXISTS (SELECT 1 FROM ${table('brands')} b WHERE b.logo_asset_id=ma.id AND b.status='ACTIVE')
        OR EXISTS (SELECT 1 FROM ${table('categories')} c JOIN visible v ON v.id=c.id WHERE c.image_asset_id=ma.id)
        OR EXISTS (SELECT 1 FROM ${table('articles')} a WHERE a.cover_asset_id=ma.id AND a.status='PUBLISHED' AND a.published_at<=now())
        OR EXISTS (SELECT 1 FROM ${table('banners')} b WHERE b.asset_id=ma.id AND b.status='ACTIVE' AND b.starts_at<=now() AND (b.ends_at IS NULL OR b.ends_at>now()))
        OR EXISTS (
          SELECT 1 FROM ${table('product_media')} pm JOIN ${table('products')} p ON p.id=pm.product_id
          LEFT JOIN ${table('brands')} b ON b.id=p.brand_id
          WHERE pm.asset_id=ma.id AND p.status='ACTIVE' AND p.published_at<=now()
            AND (p.brand_id IS NULL OR b.status='ACTIVE')
            AND (pm.variant_id IS NULL OR EXISTS (SELECT 1 FROM ${table('product_variants')} v WHERE v.id=pm.variant_id AND v.status='ACTIVE'))
            AND EXISTS (SELECT 1 FROM ${table('product_categories')} pc JOIN visible c ON c.id=pc.category_id WHERE pc.product_id=p.id AND pc.is_primary=true)
            AND EXISTS (SELECT 1 FROM ${table('currencies')} WHERE code='VND' AND is_active=true AND minor_unit=0)
            AND EXISTS (SELECT 1 FROM ${table('product_variants')} v JOIN ${table('variant_prices')} vp ON vp.variant_id=v.id AND vp.currency_code='VND' WHERE v.product_id=p.id AND v.status='ACTIVE')
        )
      ) LIMIT 1
    `)
        )[0];
    if (
      !row ||
      !new RegExp(`^${id}\\.(png|jpg|webp)$`, 'i').test(row.storageKey)
    )
      throw new NotFoundException('Published media not found');
    try {
      return {
        bytes: await readFile(resolve(this.root, row.storageKey)),
        mimeType: row.mimeType,
      };
    } catch {
      throw new NotFoundException('Media file is unavailable');
    }
  }
}
