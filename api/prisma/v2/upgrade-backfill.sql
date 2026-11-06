-- VND is a denomination decision supplied by the user, not an FX conversion.
-- Decimal values must be integral (checked before moving source tables); do not round.
INSERT INTO public.currencies (code,name,minor_unit,is_active,updated_at)
VALUES ('VND','Vietnamese dong',0,true,now());

INSERT INTO public.roles (id,code,name,is_system,updated_at)
VALUES (md5('v2:role:CUSTOMER')::uuid,'CUSTOMER','Customer',true,now()),
       (md5('v2:role:ADMIN')::uuid,'ADMIN','Administrator',true,now());

INSERT INTO public.users (id,email,password_hash,first_name,last_name,status,created_at,updated_at)
SELECT id::uuid,lower(trim(email)),password,"firstName","lastName",'ACTIVE',
  "createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC'
FROM legacy_v1.users;
-- Legacy refresh tokens intentionally do not become v2 sessions.
INSERT INTO public.user_roles (user_id,role_id,created_at)
SELECT u.id::uuid,r.id,u."createdAt" AT TIME ZONE 'UTC'
FROM legacy_v1.users u JOIN public.roles r ON r.code=CASE u.role::text WHEN 'ADMIN' THEN 'ADMIN' ELSE 'CUSTOMER' END;

INSERT INTO public.categories (id,name,slug,description,sort_order,status,created_at,updated_at)
SELECT id::uuid,name,slug,description,0,CASE WHEN "isActive" THEN 'ACTIVE' ELSE 'ARCHIVED' END,
  "createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC'
FROM legacy_v1.categories;

INSERT INTO public.products (id,name,slug,description,status,published_at,archived_at,created_at,updated_at)
SELECT id::uuid,name,'legacy-'||id,description,CASE WHEN "isActive" THEN 'ACTIVE' ELSE 'ARCHIVED' END,
  CASE WHEN "isActive" THEN "createdAt" AT TIME ZONE 'UTC' END,
  CASE WHEN NOT "isActive" THEN "updatedAt" AT TIME ZONE 'UTC' END,
  "createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC'
FROM legacy_v1.products;
INSERT INTO public.product_categories (product_id,category_id,is_primary,created_at)
SELECT id::uuid,"categoryId"::uuid,true,"createdAt" AT TIME ZONE 'UTC' FROM legacy_v1.products;
INSERT INTO public.product_variants (id,product_id,sku,option_signature,status,track_serial,created_at,updated_at)
SELECT md5('v2:variant:'||id)::uuid,id::uuid,sku,'default',CASE WHEN "isActive" THEN 'ACTIVE' ELSE 'ARCHIVED' END,false,
  "createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC' FROM legacy_v1.products;
INSERT INTO public.variant_prices (id,variant_id,currency_code,amount,created_at,updated_at)
SELECT md5('v2:price:'||id)::uuid,md5('v2:variant:'||id)::uuid,'VND',price::bigint,
  "createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC' FROM legacy_v1.products;

-- Source URL remains in legacy_v1. A pending import key is not treated as a valid uploaded image.
INSERT INTO public.media_assets (id,storage_key,original_name,mime_type,size_bytes,status,created_at,updated_at)
SELECT md5('v2:product-image:'||id)::uuid,'pending/legacy-products/'||id,id||'.legacy',
  'application/octet-stream',0,'PENDING',"createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC'
FROM legacy_v1.products WHERE "imageUrl" IS NOT NULL;
INSERT INTO public.product_media (id,product_id,asset_id,alt_text,sort_order,is_primary,created_at,updated_at)
SELECT md5('v2:product-media:'||id)::uuid,id::uuid,md5('v2:product-image:'||id)::uuid,name,0,true,
  "createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC'
FROM legacy_v1.products WHERE "imageUrl" IS NOT NULL;
INSERT INTO public.media_assets (id,storage_key,original_name,mime_type,size_bytes,status,created_at,updated_at)
SELECT md5('v2:category-image:'||id)::uuid,'pending/legacy-categories/'||id,id||'.legacy',
  'application/octet-stream',0,'PENDING',"createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC'
FROM legacy_v1.categories WHERE "imageUrl" IS NOT NULL;
UPDATE public.categories c SET image_asset_id=md5('v2:category-image:'||s.id)::uuid
FROM legacy_v1.categories s WHERE c.id=s.id::uuid AND s."imageUrl" IS NOT NULL;

INSERT INTO public.warehouses (id,code,name,address_snapshot,status,updated_at)
VALUES (md5('v2:warehouse:legacy')::uuid,'LEGACY','Migrated stock',
  '{"source":"legacy_v1.products.stock","addressNotProvided":true}'::jsonb,'ACTIVE',now());
INSERT INTO public.inventory_balances (id,warehouse_id,variant_id,on_hand,reserved,unavailable,version,updated_at)
SELECT md5('v2:balance:'||id)::uuid,md5('v2:warehouse:legacy')::uuid,md5('v2:variant:'||id)::uuid,
  stock,0,0,0,now() FROM legacy_v1.products;
INSERT INTO public.inventory_movements
  (id,balance_id,on_hand_delta,reserved_delta,unavailable_delta,kind,operation_key,source_type,source_id,reason,occurred_at)
SELECT md5('v2:opening:'||id)::uuid,md5('v2:balance:'||id)::uuid,stock,0,0,'OPENING',
  'v2:opening:'||id,'LEGACY_PRODUCT',id::uuid,'Opening balance; old orders excluded at user request',now()
FROM legacy_v1.products WHERE stock>0;

WITH source AS (
  SELECT *,row_number() OVER (PARTITION BY "userId","checkedOut" ORDER BY "updatedAt" DESC,id) AS position
  FROM legacy_v1.carts
)
INSERT INTO public.carts (id,user_id,currency_code,status,version,created_at,updated_at)
SELECT id::uuid,"userId"::uuid,'VND',
  CASE WHEN "checkedOut" THEN 'CONVERTED' WHEN position=1 THEN 'ACTIVE' ELSE 'ABANDONED' END,0,
  "createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC' FROM source;
INSERT INTO public.cart_items (id,cart_id,variant_id,quantity,created_at,updated_at)
SELECT id::uuid,"cartId"::uuid,md5('v2:variant:'||"productId")::uuid,quantity,
  "createdAt" AT TIME ZONE 'UTC',"updatedAt" AT TIME ZONE 'UTC' FROM legacy_v1.carts_items;

INSERT INTO public.audit_logs (id,actor_type,action,entity_type,entity_id,after_redacted,reason)
VALUES (md5('v2:migration:vnd')::uuid,'SYSTEM','MIGRATE_V1_TO_V2','DATABASE','20261105010000_upgrade_v2_vnd',
  jsonb_build_object('currency','VND','fxConversion',false,'legacySchema','legacy_v1',
    'ordersExcluded',(SELECT count(*) FROM legacy_v1.orders),
    'paymentsExcluded',(SELECT count(*) FROM legacy_v1.payments)),
  'User requested VND and removal of old orders from the active dataset; source retained for recovery');

-- Counts alone are insufficient: verify identity, prices, password hashes, roles and stock per source row.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.users)<>(SELECT count(*) FROM legacy_v1.users)
    OR EXISTS (SELECT 1 FROM legacy_v1.users s LEFT JOIN public.users t ON t.id=s.id::uuid
      WHERE t.id IS NULL OR t.password_hash IS DISTINCT FROM s.password OR t.email<>lower(trim(s.email))) THEN
    RAISE EXCEPTION 'Account backfill mismatch';
  END IF;
  IF (SELECT count(*) FROM public.user_roles)<>(SELECT count(*) FROM legacy_v1.users) THEN
    RAISE EXCEPTION 'Role backfill mismatch';
  END IF;
  IF (SELECT count(*) FROM public.categories)<>(SELECT count(*) FROM legacy_v1.categories)
    OR (SELECT count(*) FROM public.products)<>(SELECT count(*) FROM legacy_v1.products)
    OR (SELECT count(*) FROM public.product_variants)<>(SELECT count(*) FROM legacy_v1.products)
    OR (SELECT count(*) FROM public.carts)<>(SELECT count(*) FROM legacy_v1.carts)
    OR (SELECT count(*) FROM public.cart_items)<>(SELECT count(*) FROM legacy_v1.carts_items) THEN
    RAISE EXCEPTION 'Catalog/cart backfill count mismatch';
  END IF;
  IF EXISTS (SELECT 1 FROM legacy_v1.products s
    LEFT JOIN public.product_variants v ON v.product_id=s.id::uuid
    LEFT JOIN public.variant_prices p ON p.variant_id=v.id
    LEFT JOIN public.inventory_balances b ON b.variant_id=v.id
    WHERE v.id IS NULL OR v.sku<>s.sku OR p.amount IS DISTINCT FROM s.price::bigint OR p.currency_code<>'VND'
      OR b.on_hand IS DISTINCT FROM s.stock OR b.reserved<>0 OR b.unavailable<>0) THEN
    RAISE EXCEPTION 'Price/stock backfill mismatch';
  END IF;
  IF EXISTS (SELECT 1 FROM public.inventory_balances b
    WHERE b.on_hand<>COALESCE((SELECT sum(m.on_hand_delta) FROM public.inventory_movements m WHERE m.balance_id=b.id),0)) THEN
    RAISE EXCEPTION 'Opening stock ledger mismatch';
  END IF;
  IF EXISTS (SELECT 1 FROM public.orders) OR EXISTS (SELECT 1 FROM public.payments)
    OR EXISTS (SELECT 1 FROM public.order_items) OR EXISTS (SELECT 1 FROM public.auth_sessions) THEN
    RAISE EXCEPTION 'Old order/payment/session unexpectedly copied';
  END IF;
END $$;
COMMIT;
