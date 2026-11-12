import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma-v2/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type Variant = {
  id: string;
  sku: string;
  label: string;
  price: string;
  oldPrice: string | null;
  stock: number;
};
type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  image: string | null;
  variants: Variant[];
  attributes: Record<string, string | number | boolean>;
  reviews: { id: string; rating: number; title: string | null; body: string }[];
};
@Injectable()
export class StorefrontService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async snapshot() {
    const table = (name: string) =>
      Prisma.raw(`"${this.prisma.schema}"."${name}"`);
    // Run independent reads concurrently; keep prices and stock fresh per request.
    const [
      rows,
      presentation,
      banners,
      collections,
      categories,
      articles,
      pages,
    ] = await Promise.all([
      this.prisma.$queryRaw<CatalogRow[]>(Prisma.sql`
        WITH RECURSIVE visible AS (
          SELECT id, slug, 1 AS depth FROM ${table('categories')} WHERE parent_id IS NULL AND status='ACTIVE'
          UNION ALL SELECT c.id,c.slug,v.depth+1 FROM ${table('categories')} c JOIN visible v ON c.parent_id=v.id WHERE c.status='ACTIVE' AND v.depth<16
        )
        SELECT p.id::text,p.slug,p.name,b.name AS brand,c.slug AS category,
          (SELECT '/api/v1/media/'||pm.asset_id::text FROM ${table('product_media')} pm
           JOIN ${table('media_assets')} ma ON ma.id=pm.asset_id AND ma.status='READY'
           WHERE pm.product_id=p.id AND pm.variant_id IS NULL ORDER BY pm.is_primary DESC,pm.sort_order,pm.id LIMIT 1) AS image,
          (SELECT jsonb_agg(jsonb_build_object('id',v.id::text,'sku',v.sku,'label',COALESCE(v.name,v.sku),'price',vp.amount::text,'oldPrice',vp.compare_at_amount::text,
            'stock',COALESCE((SELECT sum(ib.on_hand-ib.reserved-ib.unavailable) FROM ${table('inventory_balances')} ib JOIN ${table('warehouses')} w ON w.id=ib.warehouse_id AND w.status='ACTIVE' WHERE ib.variant_id=v.id),0)) ORDER BY vp.amount,v.id)
           FROM ${table('product_variants')} v JOIN ${table('variant_prices')} vp ON vp.variant_id=v.id AND vp.currency_code='VND'
           WHERE v.product_id=p.id AND v.status='ACTIVE') AS variants,
          COALESCE((SELECT jsonb_object_agg(a.code,CASE a.data_type WHEN 'BOOLEAN' THEN to_jsonb(av.boolean_value) WHEN 'NUMBER' THEN to_jsonb(av.number_value::text) ELSE to_jsonb(av.text_value) END)
            FROM ${table('product_attribute_values')} av JOIN ${table('attribute_definitions')} a ON a.id=av.attribute_id WHERE av.product_id=p.id),'{}'::jsonb) AS attributes,
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.id,'rating',r.rating,'title',r.title,'body',r.body))
            FROM (SELECT id,rating,title,body FROM ${table('reviews')} WHERE product_id=p.id AND status='PUBLISHED' ORDER BY created_at DESC,id LIMIT 20) r),'[]'::jsonb) AS reviews
        FROM ${table('products')} p
        JOIN ${table('product_categories')} pc ON pc.product_id=p.id AND pc.is_primary=true JOIN visible c ON c.id=pc.category_id
        LEFT JOIN ${table('brands')} b ON b.id=p.brand_id
        WHERE p.status='ACTIVE' AND p.published_at<=now() AND (p.brand_id IS NULL OR b.status='ACTIVE')
          AND EXISTS (SELECT 1 FROM ${table('currencies')} WHERE code='VND' AND is_active=true AND minor_unit=0)
          AND EXISTS (SELECT 1 FROM ${table('product_variants')} v JOIN ${table('variant_prices')} vp ON vp.variant_id=v.id AND vp.currency_code='VND' WHERE v.product_id=p.id AND v.status='ACTIVE')
        ORDER BY p.created_at,p.id LIMIT 1000
      `),
      this.prisma.storeSetting.findUnique({
        where: { key: 'storefront.presentation' },
        select: { value: true },
      }),
      this.prisma.banner.findMany({
        where: {
          placement: 'HOME_HERO',
          status: 'ACTIVE',
          startsAt: { lte: new Date() },
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
          asset: { status: 'READY' },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.collection.findMany({
        where: {
          status: 'ACTIVE',
          slug: { in: ['featureddeals', 'upgradeproducts'] },
        },
        include: {
          collectionProducts: {
            include: { product: { select: { slug: true } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.prisma.$queryRaw<
        { id: string; slug: string; name: string }[]
      >(Prisma.sql`
        WITH RECURSIVE visible AS (
          SELECT id,slug,name,sort_order,1 AS depth FROM ${table('categories')} WHERE parent_id IS NULL AND status='ACTIVE'
          UNION ALL SELECT c.id,c.slug,c.name,c.sort_order,v.depth+1 FROM ${table('categories')} c JOIN visible v ON c.parent_id=v.id WHERE c.status='ACTIVE' AND v.depth<16
        ) SELECT id::text,slug,name FROM visible ORDER BY sort_order,slug
      `),
      this.prisma.article.findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
        select: {
          id: true,
          slug: true,
          title: true,
          body: true,
          coverAssetId: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 100,
      }),
      this.prisma.contentPage.findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
        select: { slug: true, title: true, body: true },
        take: 100,
      }),
    ]);
    const config = (presentation?.value ?? {}) as Record<
      string,
      Prisma.JsonValue
    >;
    const bannerMetadata = (
      Array.isArray(config.bannerCampaigns) ? config.bannerCampaigns : []
    ) as { id: string; title: string; subtitle: string }[];
    config.bannerCampaigns = banners.map((b) => ({
      id: bannerMetadata.find((meta) => meta.title === b.title)?.id ?? b.id,
      databaseId: b.id,
      title: b.title,
      subtitle:
        bannerMetadata.find((meta) => meta.title === b.title)?.subtitle ?? '',
      image: `/api/v1/media/${b.assetId}`,
      alt: b.title,
      href: b.targetUrl ?? '/products',
    }));
    config.featuredDeals =
      collections
        .find((c) => c.slug === 'featureddeals')
        ?.collectionProducts.map((p) => p.product.slug) ?? [];
    config.upgradeProducts =
      collections
        .find((c) => c.slug === 'upgradeproducts')
        ?.collectionProducts.map((p) => p.product.slug) ?? [];
    const categoryMetadata = Array.isArray(config.categories)
      ? (config.categories as { id: string; short: string; icon: string }[])
      : [];
    const products = rows.map((row) => {
      const attrs = row.attributes;
      const technical: Record<string, string | number | boolean> = {};
      for (const key of [
        'socket',
        'ddr',
        'form',
        'watts',
        'length',
        'clearance',
        'gpuMax',
        'coolerMax',
        'capacity',
        'slots',
        'integrated',
      ]) {
        const value = attrs[`store_${key}`];
        if (value !== undefined)
          technical[key] = ['socket', 'ddr', 'form'].includes(key)
            ? String(value)
            : key === 'integrated'
              ? Boolean(value)
              : Number(value);
      }
      return {
        id: row.slug,
        databaseId: row.id,
        slug: row.slug,
        name: row.name,
        category: row.category,
        brand: row.brand ?? '',
        price: row.variants[0].price,
        oldPrice: row.variants[0].oldPrice ?? row.variants[0].price,
        image: row.image ?? '',
        specs: String(attrs.store_display_specs ?? '')
          .split('\n')
          .filter(Boolean),
        technical,
        builderEligible: attrs.store_builder_eligible === true,
        variants: row.variants.map((variant) => ({
          ...variant,
          oldPrice: variant.oldPrice ?? variant.price,
        })),
        stock: row.variants.reduce((sum, v) => sum + v.stock, 0),
        warranty: String(attrs.store_warranty ?? ''),
        reviews: row.reviews,
        badge: attrs.store_badge ? String(attrs.store_badge) : undefined,
      };
    });
    return {
      products,
      categories: categories.map((c) => {
        const meta = categoryMetadata.find((m) => m.id === c.slug);
        return {
          id: c.slug,
          databaseId: c.id,
          name: c.name,
          short: meta?.short ?? c.name,
          icon: meta?.icon ?? 'accessory',
        };
      }),
      articles: articles.map((a) => {
        const body = a.body as { tag?: string; paragraphs?: string[] };
        return {
          id: a.slug,
          databaseId: a.id,
          title: a.title,
          tag: body.tag ?? '',
          image: a.coverAssetId ? `/api/v1/media/${a.coverAssetId}` : '',
          content: (body.paragraphs ?? []).join('\n\n'),
        };
      }),
      pages: pages.map((p) => ({ slug: p.slug, title: p.title, body: p.body })),
      presentation: config,
    };
  }
}
