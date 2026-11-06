-- User decision: VND, retain accounts/catalog/cart, exclude old orders from the active v2 dataset.
-- Preserve all v1 source tables in a private archive for recovery/provider reconciliation.
-- No original order/payment record is copied into public v2 or silently re-denominated.
BEGIN;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '120s';
SELECT pg_advisory_xact_lock(20261105, 2);
LOCK TABLE public.users, public.categories, public.products, public.carts,
  public.carts_items, public.orders, public.order_items, public.payments IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'legacy_v1') THEN
    RAISE EXCEPTION 'legacy_v1 already exists; review migration state before proceeding';
  END IF;
  IF EXISTS (SELECT 1 FROM public.orders WHERE status::text NOT IN ('CANCALLED','DELIVERED')) THEN
    RAISE EXCEPTION 'Active legacy orders require stock/payment review before migration';
  END IF;
  IF EXISTS (SELECT 1 FROM public.products WHERE price < 0 OR price <> trunc(price) OR stock < 0) THEN
    RAISE EXCEPTION 'VND requires nonnegative integer product prices and nonnegative stock';
  END IF;
  IF EXISTS (SELECT 1 FROM public.users GROUP BY lower(trim(email)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Normalized user email collisions must be resolved first';
  END IF;
END $$;

CREATE SCHEMA legacy_v1;
REVOKE ALL ON SCHEMA legacy_v1 FROM PUBLIC;
ALTER TABLE public.users SET SCHEMA legacy_v1;
ALTER TABLE public.categories SET SCHEMA legacy_v1;
ALTER TABLE public.products SET SCHEMA legacy_v1;
ALTER TABLE public.carts SET SCHEMA legacy_v1;
ALTER TABLE public.carts_items SET SCHEMA legacy_v1;
ALTER TABLE public.orders SET SCHEMA legacy_v1;
ALTER TABLE public.order_items SET SCHEMA legacy_v1;
ALTER TABLE public.payments SET SCHEMA legacy_v1;
ALTER TYPE public."Role" SET SCHEMA legacy_v1;
ALTER TYPE public."OrderStatus" SET SCHEMA legacy_v1;
ALTER TYPE public."PaymentStatus" SET SCHEMA legacy_v1;


-- Baseline for an EMPTY v2 schema only. Existing v1 data is not converted by this migration.

-- Target schema is selected by the Prisma v2 configuration, not hardcoded to public.

-- Generated from schema.prisma and followed by reviewed PostgreSQL constraints.


-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone" VARCHAR(32),
    "status" VARCHAR(32) NOT NULL,
    "email_verified_at" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "previous_token_hash" TEXT,
    "device_label" VARCHAR(200),
    "user_agent" VARCHAR(512),
    "ip_hash" VARCHAR(128),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "rotated_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "revoke_reason" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" VARCHAR(32) NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(100),
    "recipient_name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "region_code" VARCHAR(32),
    "region_name" VARCHAR(150),
    "locality" VARCHAR(150),
    "postal_code" VARCHAR(32),
    "line1" VARCHAR(300) NOT NULL,
    "line2" VARCHAR(300),
    "is_default_shipping" BOOLEAN NOT NULL,
    "is_default_billing" BOOLEAN NOT NULL,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "minor_unit" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "logo_asset_id" UUID,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "image_asset_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "brand_id" UUID,
    "name" VARCHAR(250) NOT NULL,
    "slug" VARCHAR(280) NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "status" VARCHAR(32) NOT NULL,
    "tax_class_id" UUID,
    "warranty_policy_id" UUID,
    "published_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "storage_key" VARCHAR(512) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" VARCHAR(128),
    "status" VARCHAR(32) NOT NULL,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "asset_id" UUID NOT NULL,
    "alt_text" VARCHAR(300),
    "sort_order" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "barcode" VARCHAR(100),
    "name" VARCHAR(200),
    "option_signature" VARCHAR(512) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "weight_grams" INTEGER,
    "length_mm" INTEGER,
    "width_mm" INTEGER,
    "height_mm" INTEGER,
    "track_serial" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_options" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_values" (
    "id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_option_values" (
    "variant_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "value_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_option_values_pkey" PRIMARY KEY ("variant_id","option_id")
);

-- CreateTable
CREATE TABLE "attribute_definitions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "data_type" VARCHAR(32) NOT NULL,
    "unit" VARCHAR(32),
    "is_filterable" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attribute_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attributes" (
    "category_id" UUID NOT NULL,
    "attribute_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("category_id","attribute_id")
);

-- CreateTable
CREATE TABLE "product_attribute_values" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "attribute_id" UUID NOT NULL,
    "text_value" TEXT,
    "number_value" DECIMAL(20,6),
    "boolean_value" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_attribute_values" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "attribute_id" UUID NOT NULL,
    "text_value" TEXT,
    "number_value" DECIMAL(20,6),
    "boolean_value" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "variant_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_prices" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "compare_at_amount" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "variant_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_classes" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tax_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" UUID NOT NULL,
    "tax_class_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "region_code" VARCHAR(32),
    "rate" DECIMAL(12,6) NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "effective_to" TIMESTAMPTZ(6),
    "priority" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "address_snapshot" JSONB NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_balances" (
    "id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "unavailable" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservations" (
    "id" UUID NOT NULL,
    "balance_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "operation_key" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "balance_id" UUID NOT NULL,
    "on_hand_delta" INTEGER NOT NULL,
    "reserved_delta" INTEGER NOT NULL,
    "unavailable_delta" INTEGER NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "operation_key" VARCHAR(150) NOT NULL,
    "source_type" VARCHAR(64) NOT NULL,
    "source_id" UUID NOT NULL,
    "reason" TEXT,
    "actor_id" UUID,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "contact_name" VARCHAR(150),
    "email" VARCHAR(254),
    "phone" VARCHAR(32),
    "tax_identifier" VARCHAR(64),
    "address_snapshot" JSONB,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_variants" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "supplier_sku" VARCHAR(100),
    "lead_time_days" INTEGER,
    "minimum_order_qty" INTEGER NOT NULL DEFAULT 1,
    "last_cost" BIGINT,
    "currency_code" VARCHAR(3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "supplier_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "number" VARCHAR(64) NOT NULL,
    "supplier_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "expected_at" TIMESTAMPTZ(6),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "sku_snapshot" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" BIGINT NOT NULL,
    "tax_amount" BIGINT NOT NULL,
    "discount_amount" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" UUID NOT NULL,
    "number" VARCHAR(64) NOT NULL,
    "purchase_order_id" UUID,
    "warehouse_id" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL,
    "posted_at" TIMESTAMPTZ(6),
    "posted_by" UUID,
    "reason" TEXT,
    "operation_key" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_items" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "purchase_order_item_id" UUID,
    "variant_id" UUID NOT NULL,
    "accepted_qty" INTEGER NOT NULL,
    "rejected_qty" INTEGER NOT NULL,
    "unit_cost" BIGINT NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" UUID NOT NULL,
    "number" VARCHAR(64) NOT NULL,
    "from_warehouse_id" UUID NOT NULL,
    "to_warehouse_id" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "dispatched_at" TIMESTAMPTZ(6),
    "received_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_items" (
    "id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "received_qty" INTEGER NOT NULL DEFAULT 0,
    "lost_qty" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_counts" (
    "id" UUID NOT NULL,
    "number" VARCHAR(64) NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "counted_at" TIMESTAMPTZ(6),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_count_items" (
    "id" UUID NOT NULL,
    "count_id" UUID NOT NULL,
    "balance_id" UUID NOT NULL,
    "expected_on_hand" INTEGER NOT NULL,
    "counted_on_hand" INTEGER,
    "balance_version" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_count_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "guest_token_hash" TEXT,
    "currency_code" VARCHAR(3) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "cart_version" INTEGER NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "quote_snapshot" JSONB NOT NULL,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "quote_hash" VARCHAR(128) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "converted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "number" VARCHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "checkout_session_id" UUID,
    "source" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "subtotal" BIGINT NOT NULL,
    "discount_total" BIGINT NOT NULL,
    "shipping_total" BIGINT NOT NULL,
    "tax_total" BIGINT NOT NULL,
    "grand_total" BIGINT NOT NULL,
    "customer_email_snapshot" VARCHAR(254) NOT NULL,
    "customer_note" TEXT,
    "pricing_snapshot" JSONB NOT NULL,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "placed_at" TIMESTAMPTZ(6) NOT NULL,
    "payment_deadline" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancellation_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "product_name_snapshot" VARCHAR(250) NOT NULL,
    "variant_name_snapshot" VARCHAR(200),
    "sku_snapshot" VARCHAR(100) NOT NULL,
    "option_snapshot" JSONB NOT NULL,
    "image_key_snapshot" VARCHAR(512),
    "quantity" INTEGER NOT NULL,
    "unit_price" BIGINT NOT NULL,
    "line_subtotal" BIGINT NOT NULL,
    "discount_amount" BIGINT NOT NULL,
    "tax_amount" BIGINT NOT NULL,
    "line_total" BIGINT NOT NULL,
    "warranty_snapshot" JSONB,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_addresses" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "recipient_name" VARCHAR(200),
    "phone" VARCHAR(32),
    "email" VARCHAR(254),
    "country_code" VARCHAR(2),
    "region_code" VARCHAR(32),
    "region_name" VARCHAR(150),
    "locality" VARCHAR(150),
    "postal_code" VARCHAR(32),
    "line1" VARCHAR(300),
    "line2" VARCHAR(300),
    "company_name" VARCHAR(250),
    "tax_identifier" VARCHAR(64),
    "original_text" TEXT,
    "completeness" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_taxes" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "tax_rate_id" UUID,
    "code_snapshot" VARCHAR(64) NOT NULL,
    "rate_snapshot" DECIMAL(12,6) NOT NULL,
    "taxable_amount" BIGINT NOT NULL,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" VARCHAR(32),
    "to_status" VARCHAR(32) NOT NULL,
    "reason" TEXT,
    "actor_id" UUID,
    "operation_key" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_notes" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "visibility" VARCHAR(32) NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "percent_bps" INTEGER,
    "fixed_amount" BIGINT,
    "currency_code" VARCHAR(3),
    "min_subtotal" BIGINT,
    "max_discount" BIGINT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "priority" INTEGER NOT NULL,
    "stacking_group" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "global_limit" INTEGER,
    "per_user_limit" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_products" (
    "promotion_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("promotion_id","product_id")
);

-- CreateTable
CREATE TABLE "promotion_categories" (
    "promotion_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_categories_pkey" PRIMARY KEY ("promotion_id","category_id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "usage_limit" INTEGER,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_redemptions" (
    "id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "coupon_id" UUID,
    "user_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "reserved_until" TIMESTAMPTZ(6),
    "operation_key" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotion_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_discounts" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID,
    "promotion_id" UUID,
    "coupon_id" UUID,
    "target" VARCHAR(32) NOT NULL,
    "code_snapshot" VARCHAR(64) NOT NULL,
    "rule_snapshot" JSONB NOT NULL,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "amount_due" BIGINT NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "captured_amount" BIGINT NOT NULL DEFAULT 0,
    "refunded_amount" BIGINT NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "provider_account" VARCHAR(150) NOT NULL,
    "mode" VARCHAR(32) NOT NULL,
    "method" VARCHAR(32) NOT NULL,
    "provider_intent_id" VARCHAR(255),
    "idempotency_key" VARCHAR(150) NOT NULL,
    "requested_amount" BIGINT NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "failure_code" VARCHAR(100),
    "expires_at" TIMESTAMPTZ(6),
    "settled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "refund_id" UUID,
    "provider" VARCHAR(32) NOT NULL,
    "provider_account" VARCHAR(150) NOT NULL,
    "mode" VARCHAR(32) NOT NULL,
    "external_id" VARCHAR(255) NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "source_event_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_events" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "provider_account" VARCHAR(150) NOT NULL,
    "mode" VARCHAR(32) NOT NULL,
    "external_event_id" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(150) NOT NULL,
    "object_id" VARCHAR(255),
    "payload_redacted" JSONB NOT NULL,
    "payload_hash" VARCHAR(128) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6),
    "lease_until" TIMESTAMPTZ(6),
    "processed_at" TIMESTAMPTZ(6),
    "last_error_code" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "provider_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "return_request_id" UUID,
    "amount" BIGINT NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "requested_by" UUID,
    "approved_by" UUID,
    "provider_refund_id" VARCHAR(255),
    "idempotency_key" VARCHAR(150) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_allocations" (
    "id" UUID NOT NULL,
    "refund_id" UUID NOT NULL,
    "order_item_id" UUID,
    "target" VARCHAR(32) NOT NULL,
    "quantity" INTEGER,
    "amount" BIGINT NOT NULL,
    "tax_amount" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_runs" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "provider_account" VARCHAR(150) NOT NULL,
    "mode" VARCHAR(32) NOT NULL,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "window_end" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "summary" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reconciliation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_issues" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "payment_id" UUID,
    "external_object_id" VARCHAR(255) NOT NULL,
    "dedupe_key" VARCHAR(255) NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "detail_redacted" JSONB NOT NULL,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reconciliation_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "carrier_code" VARCHAR(64),
    "service_code" VARCHAR(100),
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_zones" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "region_code" VARCHAR(32),
    "postal_pattern" VARCHAR(100),
    "priority" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rates" (
    "id" UUID NOT NULL,
    "method_id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "min_weight_grams" INTEGER NOT NULL,
    "max_weight_grams" INTEGER,
    "min_subtotal" BIGINT NOT NULL,
    "max_subtotal" BIGINT,
    "base_amount" BIGINT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "shipping_method_id" UUID,
    "number" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "carrier_code" VARCHAR(64),
    "carrier_account" VARCHAR(150),
    "tracking_number" VARCHAR(150),
    "provider_shipment_id" VARCHAR(255),
    "address_snapshot" JSONB NOT NULL,
    "method_snapshot" JSONB NOT NULL,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "shipped_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "operation_key" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_items" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "external_event_id" VARCHAR(255),
    "dedupe_key" VARCHAR(255) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(200),
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL,
    "payload_redacted" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" UUID NOT NULL,
    "number" VARCHAR(64) NOT NULL,
    "order_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "reason" TEXT NOT NULL,
    "resolution" VARCHAR(32) NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" UUID NOT NULL,
    "return_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "requested_condition" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_inspections" (
    "id" UUID NOT NULL,
    "return_item_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "inspector_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "disposition" VARCHAR(32) NOT NULL,
    "condition_notes" TEXT NOT NULL,
    "inspected_at" TIMESTAMPTZ(6) NOT NULL,
    "operation_key" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_receipts" (
    "id" UUID NOT NULL,
    "return_item_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "received_by" UUID NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL,
    "tracking_number" VARCHAR(150),
    "operation_key" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_links" (
    "id" UUID NOT NULL,
    "source_order_id" UUID NOT NULL,
    "target_order_id" UUID NOT NULL,
    "return_request_id" UUID,
    "kind" VARCHAR(32) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_policies" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "starts_on" VARCHAR(32) NOT NULL,
    "terms" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warranty_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serial_units" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "serial_number" VARCHAR(150) NOT NULL,
    "warehouse_id" UUID,
    "receipt_item_id" UUID,
    "status" VARCHAR(32) NOT NULL,
    "current_order_item_id" UUID,
    "warranty_start" DATE,
    "warranty_end" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "serial_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serial_unit_events" (
    "id" UUID NOT NULL,
    "serial_unit_id" UUID NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "order_item_id" UUID,
    "shipment_item_id" UUID,
    "return_item_id" UUID,
    "actor_id" UUID,
    "operation_key" VARCHAR(150) NOT NULL,
    "detail" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serial_unit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_claims" (
    "id" UUID NOT NULL,
    "number" VARCHAR(64) NOT NULL,
    "serial_unit_id" UUID,
    "order_item_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "issue" TEXT NOT NULL,
    "coverage_snapshot" JSONB NOT NULL,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(32) NOT NULL,
    "resolution" VARCHAR(32),
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warranty_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_events" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "actor_id" UUID,
    "from_status" VARCHAR(32),
    "to_status" VARCHAR(32) NOT NULL,
    "note" TEXT,
    "asset_id" UUID,
    "operation_key" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranty_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "number" VARCHAR(64),
    "status" VARCHAR(32) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "seller_snapshot" JSONB NOT NULL,
    "buyer_snapshot" JSONB NOT NULL,
    "totals_snapshot" JSONB NOT NULL,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "total_amount" BIGINT NOT NULL,
    "issued_at" TIMESTAMPTZ(6),
    "void_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "order_item_id" UUID,
    "kind" VARCHAR(32) NOT NULL,
    "line_number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" BIGINT NOT NULL,
    "discount_amount" BIGINT NOT NULL,
    "tax_amount" BIGINT NOT NULL,
    "total_amount" BIGINT NOT NULL,
    "tax_snapshot" JSONB NOT NULL,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "refund_id" UUID,
    "number" VARCHAR(64) NOT NULL,
    "reason" TEXT NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "lines_snapshot" JSONB NOT NULL,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "is_default" BOOLEAN NOT NULL,
    "visibility" VARCHAR(32) NOT NULL,
    "share_token_hash" VARCHAR(128),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "wishlist_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("wishlist_id","variant_id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "body" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "moderated_by" UUID,
    "moderated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_media" (
    "review_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_media_pkey" PRIMARY KEY ("review_id","asset_id")
);

-- CreateTable
CREATE TABLE "review_votes" (
    "review_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("review_id","user_id")
);

-- CreateTable
CREATE TABLE "content_pages" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "body" JSONB NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "author_id" UUID NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "seo_title" VARCHAR(250),
    "seo_description" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "excerpt" TEXT,
    "body" JSONB NOT NULL,
    "cover_asset_id" UUID,
    "author_id" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "seo_title" VARCHAR(250),
    "seo_description" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "asset_id" UUID NOT NULL,
    "placement" VARCHAR(64) NOT NULL,
    "target_url" VARCHAR(2048),
    "sort_order" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "status" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(32) NOT NULL,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_products" (
    "collection_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_products_pkey" PRIMARY KEY ("collection_id","product_id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "number" VARCHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "subject" VARCHAR(250) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "priority" VARCHAR(32) NOT NULL,
    "assigned_to" UUID,
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "visibility" VARCHAR(32) NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_attachments" (
    "message_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_attachments_pkey" PRIMARY KEY ("message_id","asset_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "resource_type" VARCHAR(64),
    "resource_id" UUID,
    "dedupe_key" VARCHAR(200) NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "topic" VARCHAR(64) NOT NULL,
    "channel" VARCHAR(32) NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "outbox_event_id" UUID NOT NULL,
    "channel" VARCHAR(32) NOT NULL,
    "recipient_encrypted" TEXT NOT NULL,
    "template_code" VARCHAR(100) NOT NULL,
    "template_version" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "provider_message_id" VARCHAR(255),
    "idempotency_key" VARCHAR(150) NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "last_error_code" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "actor_scope" VARCHAR(150) NOT NULL,
    "operation" VARCHAR(100) NOT NULL,
    "key" VARCHAR(150) NOT NULL,
    "request_hash" VARCHAR(128) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "resource_type" VARCHAR(64),
    "resource_id" UUID,
    "response_code" INTEGER,
    "response_redacted" JSONB,
    "lease_until" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "aggregate_type" VARCHAR(64) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "schema_version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "dedupe_key" VARCHAR(200) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(6) NOT NULL,
    "lease_until" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "last_error_code" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_type" VARCHAR(32) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" VARCHAR(150) NOT NULL,
    "request_id" VARCHAR(100),
    "before_redacted" JSONB,
    "after_redacted" JSONB,
    "reason" TEXT,
    "ip_hash" VARCHAR(128),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "schema_version" INTEGER NOT NULL,
    "changed_by" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_assigned_by_idx" ON "user_roles"("assigned_by");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_revoked_at_idx" ON "auth_sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_challenges_token_hash_key" ON "auth_challenges"("token_hash");

-- CreateIndex
CREATE INDEX "auth_challenges_user_id_idx" ON "auth_challenges"("user_id");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_logo_asset_id_idx" ON "brands"("logo_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_image_asset_id_idx" ON "categories"("image_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_status_published_at_id_idx" ON "products"("status", "published_at", "id");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_tax_class_id_idx" ON "products"("tax_class_id");

-- CreateIndex
CREATE INDEX "products_warranty_policy_id_idx" ON "products"("warranty_policy_id");

-- CreateIndex
CREATE INDEX "product_categories_category_id_idx" ON "product_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");

-- CreateIndex
CREATE INDEX "media_assets_uploaded_by_idx" ON "media_assets"("uploaded_by");

-- CreateIndex
CREATE INDEX "product_media_variant_id_idx" ON "product_media"("variant_id");

-- CreateIndex
CREATE INDEX "product_media_asset_id_idx" ON "product_media"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_media_product_id_asset_id_key" ON "product_media"("product_id", "asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_option_signature_key" ON "product_variants"("product_id", "option_signature");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_id_product_id_key" ON "product_variants"("id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_options_product_id_code_key" ON "product_options"("product_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_values_option_id_code_key" ON "product_option_values"("option_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_values_id_option_id_key" ON "product_option_values"("id", "option_id");

-- CreateIndex
CREATE INDEX "variant_option_values_option_id_idx" ON "variant_option_values"("option_id");

-- CreateIndex
CREATE INDEX "variant_option_values_value_id_idx" ON "variant_option_values"("value_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definitions_code_key" ON "attribute_definitions"("code");

-- CreateIndex
CREATE INDEX "category_attributes_attribute_id_idx" ON "category_attributes"("attribute_id");

-- CreateIndex
CREATE INDEX "product_attribute_values_attribute_id_idx" ON "product_attribute_values"("attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_values_product_id_attribute_id_key" ON "product_attribute_values"("product_id", "attribute_id");

-- CreateIndex
CREATE INDEX "variant_attribute_values_attribute_id_idx" ON "variant_attribute_values"("attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_attribute_values_variant_id_attribute_id_key" ON "variant_attribute_values"("variant_id", "attribute_id");

-- CreateIndex
CREATE INDEX "variant_prices_currency_code_idx" ON "variant_prices"("currency_code");

-- CreateIndex
CREATE UNIQUE INDEX "variant_prices_variant_id_currency_code_key" ON "variant_prices"("variant_id", "currency_code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_classes_code_key" ON "tax_classes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_tax_class_id_code_effective_from_key" ON "tax_rates"("tax_class_id", "code", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "inventory_balances_variant_id_idx" ON "inventory_balances"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balances_warehouse_id_variant_id_key" ON "inventory_balances"("warehouse_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_reservations_operation_key_key" ON "stock_reservations"("operation_key");

-- CreateIndex
CREATE INDEX "stock_reservations_balance_id_idx" ON "stock_reservations"("balance_id");

-- CreateIndex
CREATE INDEX "stock_reservations_order_item_id_idx" ON "stock_reservations"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_operation_key_key" ON "inventory_movements"("operation_key");

-- CreateIndex
CREATE INDEX "inventory_movements_balance_id_occurred_at_id_idx" ON "inventory_movements"("balance_id", "occurred_at", "id");

-- CreateIndex
CREATE INDEX "inventory_movements_actor_id_idx" ON "inventory_movements"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "supplier_variants_variant_id_idx" ON "supplier_variants"("variant_id");

-- CreateIndex
CREATE INDEX "supplier_variants_currency_code_idx" ON "supplier_variants"("currency_code");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_variants_supplier_id_variant_id_key" ON "supplier_variants"("supplier_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_number_key" ON "purchase_orders"("number");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_warehouse_id_idx" ON "purchase_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "purchase_orders_currency_code_idx" ON "purchase_orders"("currency_code");

-- CreateIndex
CREATE INDEX "purchase_orders_approved_by_idx" ON "purchase_orders"("approved_by");

-- CreateIndex
CREATE INDEX "purchase_order_items_variant_id_idx" ON "purchase_order_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_items_purchase_order_id_variant_id_key" ON "purchase_order_items"("purchase_order_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_number_key" ON "goods_receipts"("number");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_operation_key_key" ON "goods_receipts"("operation_key");

-- CreateIndex
CREATE INDEX "goods_receipts_purchase_order_id_idx" ON "goods_receipts"("purchase_order_id");

-- CreateIndex
CREATE INDEX "goods_receipts_warehouse_id_idx" ON "goods_receipts"("warehouse_id");

-- CreateIndex
CREATE INDEX "goods_receipts_posted_by_idx" ON "goods_receipts"("posted_by");

-- CreateIndex
CREATE INDEX "goods_receipt_items_receipt_id_idx" ON "goods_receipt_items"("receipt_id");

-- CreateIndex
CREATE INDEX "goods_receipt_items_purchase_order_item_id_idx" ON "goods_receipt_items"("purchase_order_item_id");

-- CreateIndex
CREATE INDEX "goods_receipt_items_variant_id_idx" ON "goods_receipt_items"("variant_id");

-- CreateIndex
CREATE INDEX "goods_receipt_items_currency_code_idx" ON "goods_receipt_items"("currency_code");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_number_key" ON "stock_transfers"("number");

-- CreateIndex
CREATE INDEX "stock_transfers_from_warehouse_id_idx" ON "stock_transfers"("from_warehouse_id");

-- CreateIndex
CREATE INDEX "stock_transfers_to_warehouse_id_idx" ON "stock_transfers"("to_warehouse_id");

-- CreateIndex
CREATE INDEX "stock_transfers_created_by_idx" ON "stock_transfers"("created_by");

-- CreateIndex
CREATE INDEX "stock_transfer_items_variant_id_idx" ON "stock_transfer_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_items_transfer_id_variant_id_key" ON "stock_transfer_items"("transfer_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_counts_number_key" ON "stock_counts"("number");

-- CreateIndex
CREATE INDEX "stock_counts_warehouse_id_idx" ON "stock_counts"("warehouse_id");

-- CreateIndex
CREATE INDEX "stock_counts_approved_by_idx" ON "stock_counts"("approved_by");

-- CreateIndex
CREATE INDEX "stock_count_items_balance_id_idx" ON "stock_count_items"("balance_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_count_items_count_id_balance_id_key" ON "stock_count_items"("count_id", "balance_id");

-- CreateIndex
CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "carts_currency_code_idx" ON "carts"("currency_code");

-- CreateIndex
CREATE INDEX "cart_items_variant_id_idx" ON "cart_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_variant_id_key" ON "cart_items"("cart_id", "variant_id");

-- CreateIndex
CREATE INDEX "checkout_sessions_user_id_status_expires_at_idx" ON "checkout_sessions"("user_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "checkout_sessions_cart_id_idx" ON "checkout_sessions"("cart_id");

-- CreateIndex
CREATE INDEX "checkout_sessions_currency_code_idx" ON "checkout_sessions"("currency_code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_number_key" ON "orders"("number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_checkout_session_id_key" ON "orders"("checkout_session_id");

-- CreateIndex
CREATE INDEX "orders_user_id_placed_at_id_idx" ON "orders"("user_id", "placed_at", "id");

-- CreateIndex
CREATE INDEX "orders_status_placed_at_id_idx" ON "orders"("status", "placed_at", "id");

-- CreateIndex
CREATE INDEX "orders_currency_code_idx" ON "orders"("currency_code");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_id_line_number_key" ON "order_items"("order_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "order_addresses_order_id_kind_key" ON "order_addresses"("order_id", "kind");

-- CreateIndex
CREATE INDEX "order_item_taxes_tax_rate_id_idx" ON "order_item_taxes"("tax_rate_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_taxes_order_item_id_code_snapshot_key" ON "order_item_taxes"("order_item_id", "code_snapshot");

-- CreateIndex
CREATE UNIQUE INDEX "order_status_history_operation_key_key" ON "order_status_history"("operation_key");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_created_at_id_idx" ON "order_status_history"("order_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "order_status_history_actor_id_idx" ON "order_status_history"("actor_id");

-- CreateIndex
CREATE INDEX "order_notes_order_id_idx" ON "order_notes"("order_id");

-- CreateIndex
CREATE INDEX "order_notes_author_id_idx" ON "order_notes"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_currency_code_idx" ON "promotions"("currency_code");

-- CreateIndex
CREATE INDEX "promotion_products_product_id_idx" ON "promotion_products"("product_id");

-- CreateIndex
CREATE INDEX "promotion_categories_category_id_idx" ON "promotion_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_promotion_id_idx" ON "coupons"("promotion_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_redemptions_operation_key_key" ON "promotion_redemptions"("operation_key");

-- CreateIndex
CREATE INDEX "promotion_redemptions_promotion_id_idx" ON "promotion_redemptions"("promotion_id");

-- CreateIndex
CREATE INDEX "promotion_redemptions_coupon_id_idx" ON "promotion_redemptions"("coupon_id");

-- CreateIndex
CREATE INDEX "promotion_redemptions_user_id_idx" ON "promotion_redemptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_redemptions_order_id_promotion_id_key" ON "promotion_redemptions"("order_id", "promotion_id");

-- CreateIndex
CREATE INDEX "order_discounts_order_id_idx" ON "order_discounts"("order_id");

-- CreateIndex
CREATE INDEX "order_discounts_order_item_id_idx" ON "order_discounts"("order_item_id");

-- CreateIndex
CREATE INDEX "order_discounts_promotion_id_idx" ON "order_discounts"("promotion_id");

-- CreateIndex
CREATE INDEX "order_discounts_coupon_id_idx" ON "order_discounts"("coupon_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_currency_code_idx" ON "payments"("currency_code");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_idempotency_key_key" ON "payment_attempts"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_attempts_payment_id_idx" ON "payment_attempts"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_provider_provider_account_mode_provider_in_key" ON "payment_attempts"("provider", "provider_account", "mode", "provider_intent_id");

-- CreateIndex
CREATE INDEX "payment_transactions_attempt_id_idx" ON "payment_transactions"("attempt_id");

-- CreateIndex
CREATE INDEX "payment_transactions_refund_id_idx" ON "payment_transactions"("refund_id");

-- CreateIndex
CREATE INDEX "payment_transactions_currency_code_idx" ON "payment_transactions"("currency_code");

-- CreateIndex
CREATE INDEX "payment_transactions_source_event_id_idx" ON "payment_transactions"("source_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_provider_provider_account_mode_externa_key" ON "payment_transactions"("provider", "provider_account", "mode", "external_id", "kind");

-- CreateIndex
CREATE INDEX "provider_events_status_next_attempt_at_idx" ON "provider_events"("status", "next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "provider_events_provider_provider_account_mode_external_eve_key" ON "provider_events"("provider", "provider_account", "mode", "external_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_idempotency_key_key" ON "refunds"("idempotency_key");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "refunds_return_request_id_idx" ON "refunds"("return_request_id");

-- CreateIndex
CREATE INDEX "refunds_currency_code_idx" ON "refunds"("currency_code");

-- CreateIndex
CREATE INDEX "refunds_requested_by_idx" ON "refunds"("requested_by");

-- CreateIndex
CREATE INDEX "refunds_approved_by_idx" ON "refunds"("approved_by");

-- CreateIndex
CREATE INDEX "refund_allocations_refund_id_idx" ON "refund_allocations"("refund_id");

-- CreateIndex
CREATE INDEX "refund_allocations_order_item_id_idx" ON "refund_allocations"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliation_issues_dedupe_key_key" ON "reconciliation_issues"("dedupe_key");

-- CreateIndex
CREATE INDEX "reconciliation_issues_run_id_idx" ON "reconciliation_issues"("run_id");

-- CreateIndex
CREATE INDEX "reconciliation_issues_payment_id_idx" ON "reconciliation_issues"("payment_id");

-- CreateIndex
CREATE INDEX "reconciliation_issues_resolved_by_idx" ON "reconciliation_issues"("resolved_by");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_methods_code_key" ON "shipping_methods"("code");

-- CreateIndex
CREATE INDEX "shipping_rates_method_id_idx" ON "shipping_rates"("method_id");

-- CreateIndex
CREATE INDEX "shipping_rates_zone_id_idx" ON "shipping_rates"("zone_id");

-- CreateIndex
CREATE INDEX "shipping_rates_currency_code_idx" ON "shipping_rates"("currency_code");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_number_key" ON "shipments"("number");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_operation_key_key" ON "shipments"("operation_key");

-- CreateIndex
CREATE INDEX "shipments_order_id_idx" ON "shipments"("order_id");

-- CreateIndex
CREATE INDEX "shipments_warehouse_id_idx" ON "shipments"("warehouse_id");

-- CreateIndex
CREATE INDEX "shipments_shipping_method_id_idx" ON "shipments"("shipping_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_carrier_code_carrier_account_tracking_number_key" ON "shipments"("carrier_code", "carrier_account", "tracking_number");

-- CreateIndex
CREATE INDEX "shipment_items_order_item_id_idx" ON "shipment_items"("order_item_id");

-- CreateIndex
CREATE INDEX "shipment_items_reservation_id_idx" ON "shipment_items"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_items_shipment_id_reservation_id_key" ON "shipment_items"("shipment_id", "reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_events_dedupe_key_key" ON "shipment_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "shipment_events_shipment_id_occurred_at_id_idx" ON "shipment_events"("shipment_id", "occurred_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "return_requests_number_key" ON "return_requests"("number");

-- CreateIndex
CREATE INDEX "return_requests_order_id_idx" ON "return_requests"("order_id");

-- CreateIndex
CREATE INDEX "return_requests_requested_by_idx" ON "return_requests"("requested_by");

-- CreateIndex
CREATE INDEX "return_requests_approved_by_idx" ON "return_requests"("approved_by");

-- CreateIndex
CREATE INDEX "return_items_order_item_id_idx" ON "return_items"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "return_items_return_id_order_item_id_key" ON "return_items"("return_id", "order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "return_inspections_operation_key_key" ON "return_inspections"("operation_key");

-- CreateIndex
CREATE INDEX "return_inspections_return_item_id_idx" ON "return_inspections"("return_item_id");

-- CreateIndex
CREATE INDEX "return_inspections_warehouse_id_idx" ON "return_inspections"("warehouse_id");

-- CreateIndex
CREATE INDEX "return_inspections_inspector_id_idx" ON "return_inspections"("inspector_id");

-- CreateIndex
CREATE UNIQUE INDEX "return_receipts_operation_key_key" ON "return_receipts"("operation_key");

-- CreateIndex
CREATE INDEX "return_receipts_return_item_id_idx" ON "return_receipts"("return_item_id");

-- CreateIndex
CREATE INDEX "return_receipts_warehouse_id_idx" ON "return_receipts"("warehouse_id");

-- CreateIndex
CREATE INDEX "return_receipts_received_by_idx" ON "return_receipts"("received_by");

-- CreateIndex
CREATE INDEX "order_links_target_order_id_idx" ON "order_links"("target_order_id");

-- CreateIndex
CREATE INDEX "order_links_return_request_id_idx" ON "order_links"("return_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_links_source_order_id_target_order_id_kind_key" ON "order_links"("source_order_id", "target_order_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "warranty_policies_code_key" ON "warranty_policies"("code");

-- CreateIndex
CREATE INDEX "serial_units_warehouse_id_idx" ON "serial_units"("warehouse_id");

-- CreateIndex
CREATE INDEX "serial_units_receipt_item_id_idx" ON "serial_units"("receipt_item_id");

-- CreateIndex
CREATE INDEX "serial_units_current_order_item_id_idx" ON "serial_units"("current_order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "serial_units_variant_id_serial_number_key" ON "serial_units"("variant_id", "serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "serial_unit_events_operation_key_key" ON "serial_unit_events"("operation_key");

-- CreateIndex
CREATE INDEX "serial_unit_events_serial_unit_id_idx" ON "serial_unit_events"("serial_unit_id");

-- CreateIndex
CREATE INDEX "serial_unit_events_order_item_id_idx" ON "serial_unit_events"("order_item_id");

-- CreateIndex
CREATE INDEX "serial_unit_events_shipment_item_id_idx" ON "serial_unit_events"("shipment_item_id");

-- CreateIndex
CREATE INDEX "serial_unit_events_return_item_id_idx" ON "serial_unit_events"("return_item_id");

-- CreateIndex
CREATE INDEX "serial_unit_events_actor_id_idx" ON "serial_unit_events"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "warranty_claims_number_key" ON "warranty_claims"("number");

-- CreateIndex
CREATE INDEX "warranty_claims_serial_unit_id_idx" ON "warranty_claims"("serial_unit_id");

-- CreateIndex
CREATE INDEX "warranty_claims_order_item_id_idx" ON "warranty_claims"("order_item_id");

-- CreateIndex
CREATE INDEX "warranty_claims_user_id_idx" ON "warranty_claims"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "warranty_events_operation_key_key" ON "warranty_events"("operation_key");

-- CreateIndex
CREATE INDEX "warranty_events_claim_id_idx" ON "warranty_events"("claim_id");

-- CreateIndex
CREATE INDEX "warranty_events_actor_id_idx" ON "warranty_events"("actor_id");

-- CreateIndex
CREATE INDEX "warranty_events_asset_id_idx" ON "warranty_events"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_order_id_idx" ON "invoices"("order_id");

-- CreateIndex
CREATE INDEX "invoices_currency_code_idx" ON "invoices"("currency_code");

-- CreateIndex
CREATE INDEX "invoice_lines_order_item_id_idx" ON "invoice_lines"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_lines_invoice_id_line_number_key" ON "invoice_lines"("invoice_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_number_key" ON "credit_notes"("number");

-- CreateIndex
CREATE INDEX "credit_notes_invoice_id_idx" ON "credit_notes"("invoice_id");

-- CreateIndex
CREATE INDEX "credit_notes_refund_id_idx" ON "credit_notes"("refund_id");

-- CreateIndex
CREATE INDEX "credit_notes_currency_code_idx" ON "credit_notes"("currency_code");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_share_token_hash_key" ON "wishlists"("share_token_hash");

-- CreateIndex
CREATE INDEX "wishlists_user_id_idx" ON "wishlists"("user_id");

-- CreateIndex
CREATE INDEX "wishlist_items_variant_id_idx" ON "wishlist_items"("variant_id");

-- CreateIndex
CREATE INDEX "reviews_product_id_idx" ON "reviews"("product_id");

-- CreateIndex
CREATE INDEX "reviews_order_item_id_idx" ON "reviews"("order_item_id");

-- CreateIndex
CREATE INDEX "reviews_moderated_by_idx" ON "reviews"("moderated_by");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_product_id_key" ON "reviews"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "review_media_asset_id_idx" ON "review_media"("asset_id");

-- CreateIndex
CREATE INDEX "review_votes_user_id_idx" ON "review_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_pages_slug_key" ON "content_pages"("slug");

-- CreateIndex
CREATE INDEX "content_pages_author_id_idx" ON "content_pages"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_published_at_id_idx" ON "articles"("status", "published_at", "id");

-- CreateIndex
CREATE INDEX "articles_cover_asset_id_idx" ON "articles"("cover_asset_id");

-- CreateIndex
CREATE INDEX "articles_author_id_idx" ON "articles"("author_id");

-- CreateIndex
CREATE INDEX "banners_asset_id_idx" ON "banners"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "collection_products_product_id_idx" ON "collection_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_number_key" ON "support_tickets"("number");

-- CreateIndex
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");

-- CreateIndex
CREATE INDEX "support_tickets_order_id_idx" ON "support_tickets"("order_id");

-- CreateIndex
CREATE INDEX "support_tickets_assigned_to_idx" ON "support_tickets"("assigned_to");

-- CreateIndex
CREATE INDEX "support_messages_ticket_id_created_at_id_idx" ON "support_messages"("ticket_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "support_messages_author_id_idx" ON "support_messages"("author_id");

-- CreateIndex
CREATE INDEX "support_attachments_asset_id_idx" ON "support_attachments"("asset_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_id_idx" ON "notifications"("user_id", "read_at", "created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_dedupe_key_key" ON "notifications"("user_id", "dedupe_key");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_topic_channel_key" ON "notification_preferences"("user_id", "topic", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_idempotency_key_key" ON "notification_deliveries"("idempotency_key");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_created_at_idx" ON "notification_deliveries"("status", "created_at");

-- CreateIndex
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries"("notification_id");

-- CreateIndex
CREATE INDEX "notification_deliveries_outbox_event_id_idx" ON "notification_deliveries"("outbox_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_actor_scope_operation_key_key" ON "idempotency_keys"("actor_scope", "operation", "key");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_dedupe_key_key" ON "outbox_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "outbox_events_status_available_at_idx" ON "outbox_events"("status", "available_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_id_idx" ON "audit_logs"("entity_type", "entity_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "store_settings_key_key" ON "store_settings"("key");

-- CreateIndex
CREATE INDEX "store_settings_changed_by_idx" ON "store_settings"("changed_by");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "auth_challenges" ADD CONSTRAINT "auth_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_asset_id_fkey" FOREIGN KEY ("logo_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_image_asset_id_fkey" FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tax_class_id_fkey" FOREIGN KEY ("tax_class_id") REFERENCES "tax_classes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_warranty_policy_id_fkey" FOREIGN KEY ("warranty_policy_id") REFERENCES "warranty_policies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_product_id_fkey" FOREIGN KEY ("variant_id", "product_id") REFERENCES "product_variants"("id", "product_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_value_id_option_id_fkey" FOREIGN KEY ("value_id", "option_id") REFERENCES "product_option_values"("id", "option_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_definitions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_definitions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_definitions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_tax_class_id_fkey" FOREIGN KEY ("tax_class_id") REFERENCES "tax_classes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_balance_id_fkey" FOREIGN KEY ("balance_id") REFERENCES "inventory_balances"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_balance_id_fkey" FOREIGN KEY ("balance_id") REFERENCES "inventory_balances"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "supplier_variants" ADD CONSTRAINT "supplier_variants_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "supplier_variants" ADD CONSTRAINT "supplier_variants_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "supplier_variants" ADD CONSTRAINT "supplier_variants_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "goods_receipts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "stock_transfers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_count_items" ADD CONSTRAINT "stock_count_items_count_id_fkey" FOREIGN KEY ("count_id") REFERENCES "stock_counts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "stock_count_items" ADD CONSTRAINT "stock_count_items_balance_id_fkey" FOREIGN KEY ("balance_id") REFERENCES "inventory_balances"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_session_id_fkey" FOREIGN KEY ("checkout_session_id") REFERENCES "checkout_sessions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_item_taxes" ADD CONSTRAINT "order_item_taxes_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_item_taxes" ADD CONSTRAINT "order_item_taxes_tax_rate_id_fkey" FOREIGN KEY ("tax_rate_id") REFERENCES "tax_rates"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "promotion_categories" ADD CONSTRAINT "promotion_categories_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "promotion_categories" ADD CONSTRAINT "promotion_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "payment_attempts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_source_event_id_fkey" FOREIGN KEY ("source_event_id") REFERENCES "provider_events"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "refund_allocations" ADD CONSTRAINT "refund_allocations_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "refund_allocations" ADD CONSTRAINT "refund_allocations_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "reconciliation_runs"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_method_id_fkey" FOREIGN KEY ("method_id") REFERENCES "shipping_methods"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "shipping_zones"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shipping_method_id_fkey" FOREIGN KEY ("shipping_method_id") REFERENCES "shipping_methods"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "stock_reservations"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "return_requests"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_inspections" ADD CONSTRAINT "return_inspections_return_item_id_fkey" FOREIGN KEY ("return_item_id") REFERENCES "return_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_inspections" ADD CONSTRAINT "return_inspections_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_inspections" ADD CONSTRAINT "return_inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_receipts" ADD CONSTRAINT "return_receipts_return_item_id_fkey" FOREIGN KEY ("return_item_id") REFERENCES "return_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_receipts" ADD CONSTRAINT "return_receipts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "return_receipts" ADD CONSTRAINT "return_receipts_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_links" ADD CONSTRAINT "order_links_source_order_id_fkey" FOREIGN KEY ("source_order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_links" ADD CONSTRAINT "order_links_target_order_id_fkey" FOREIGN KEY ("target_order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "order_links" ADD CONSTRAINT "order_links_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_receipt_item_id_fkey" FOREIGN KEY ("receipt_item_id") REFERENCES "goods_receipt_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_current_order_item_id_fkey" FOREIGN KEY ("current_order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serial_unit_events" ADD CONSTRAINT "serial_unit_events_serial_unit_id_fkey" FOREIGN KEY ("serial_unit_id") REFERENCES "serial_units"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serial_unit_events" ADD CONSTRAINT "serial_unit_events_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serial_unit_events" ADD CONSTRAINT "serial_unit_events_shipment_item_id_fkey" FOREIGN KEY ("shipment_item_id") REFERENCES "shipment_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serial_unit_events" ADD CONSTRAINT "serial_unit_events_return_item_id_fkey" FOREIGN KEY ("return_item_id") REFERENCES "return_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serial_unit_events" ADD CONSTRAINT "serial_unit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_serial_unit_id_fkey" FOREIGN KEY ("serial_unit_id") REFERENCES "serial_units"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "warranty_events" ADD CONSTRAINT "warranty_events_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "warranty_claims"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "warranty_events" ADD CONSTRAINT "warranty_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "warranty_events" ADD CONSTRAINT "warranty_events_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "review_media" ADD CONSTRAINT "review_media_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "review_media" ADD CONSTRAINT "review_media_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "content_pages" ADD CONSTRAINT "content_pages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_asset_id_fkey" FOREIGN KEY ("cover_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "support_messages"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_outbox_event_id_fkey" FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Supplementary PostgreSQL constraints.

ALTER TABLE "users" ADD CONSTRAINT "users_status_check" CHECK ("status" IN ('ACTIVE', 'LOCKED', 'ARCHIVED'));
ALTER TABLE "auth_challenges" ADD CONSTRAINT "auth_challenges_purpose_check" CHECK ("purpose" IN ('VERIFY_EMAIL', 'RESET_PASSWORD'));
ALTER TABLE "brands" ADD CONSTRAINT "brands_status_check" CHECK ("status" IN ('ACTIVE', 'ARCHIVED'));
ALTER TABLE "categories" ADD CONSTRAINT "categories_status_check" CHECK ("status" IN ('ACTIVE', 'ARCHIVED'));
ALTER TABLE "products" ADD CONSTRAINT "products_status_check" CHECK ("status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED'));
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_status_check" CHECK ("status" IN ('PENDING', 'READY', 'REJECTED', 'ARCHIVED'));
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_status_check" CHECK ("status" IN ('ACTIVE', 'ARCHIVED'));
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_data_type_check" CHECK ("data_type" IN ('TEXT', 'NUMBER', 'BOOLEAN'));
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_compare_at_amount_nonnegative" CHECK ("compare_at_amount" >= 0);
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_rate_range" CHECK ("rate" BETWEEN 0 AND 1);
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'));
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_status_check" CHECK ("status" IN ('ACTIVE', 'COMMITTED', 'CONSUMED', 'RELEASED', 'EXPIRED'));
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_kind_check" CHECK ("kind" IN ('OPENING', 'RECEIPT', 'RESERVE', 'RELEASE', 'SHIP', 'RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUST', 'QUARANTINE'));
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'));
ALTER TABLE "supplier_variants" ADD CONSTRAINT "supplier_variants_last_cost_nonnegative" CHECK ("last_cost" >= 0);
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_status_check" CHECK ("status" IN ('DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'));
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_unit_cost_nonnegative" CHECK ("unit_cost" >= 0);
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_tax_amount_nonnegative" CHECK ("tax_amount" >= 0);
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_discount_amount_nonnegative" CHECK ("discount_amount" >= 0);
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_status_check" CHECK ("status" IN ('DRAFT', 'POSTED', 'REVERSED'));
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_unit_cost_nonnegative" CHECK ("unit_cost" >= 0);
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_status_check" CHECK ("status" IN ('DRAFT', 'DISPATCHED', 'RECEIVED', 'CANCELLED'));
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_status_check" CHECK ("status" IN ('DRAFT', 'COUNTING', 'APPROVED', 'CANCELLED'));
ALTER TABLE "carts" ADD CONSTRAINT "carts_status_check" CHECK ("status" IN ('ACTIVE', 'CONVERTED', 'ABANDONED'));
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_status_check" CHECK ("status" IN ('OPEN', 'CONVERTED', 'EXPIRED'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_check" CHECK ("source" IN ('WEB', 'ADMIN', 'LEGACY'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_check" CHECK ("status" IN ('PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'EXPIRED'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_subtotal_nonnegative" CHECK ("subtotal" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_total_nonnegative" CHECK ("discount_total" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_total_nonnegative" CHECK ("shipping_total" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_tax_total_nonnegative" CHECK ("tax_total" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_grand_total_nonnegative" CHECK ("grand_total" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_nonnegative" CHECK ("unit_price" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_line_subtotal_nonnegative" CHECK ("line_subtotal" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_discount_amount_nonnegative" CHECK ("discount_amount" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tax_amount_nonnegative" CHECK ("tax_amount" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_line_total_nonnegative" CHECK ("line_total" >= 0);
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_kind_check" CHECK ("kind" IN ('SHIPPING', 'BILLING'));
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_completeness_check" CHECK ("completeness" IN ('COMPLETE', 'LEGACY_UNPARSED'));
ALTER TABLE "order_item_taxes" ADD CONSTRAINT "order_item_taxes_rate_snapshot_range" CHECK ("rate_snapshot" BETWEEN 0 AND 1);
ALTER TABLE "order_item_taxes" ADD CONSTRAINT "order_item_taxes_taxable_amount_nonnegative" CHECK ("taxable_amount" >= 0);
ALTER TABLE "order_item_taxes" ADD CONSTRAINT "order_item_taxes_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_visibility_check" CHECK ("visibility" IN ('INTERNAL', 'CUSTOMER'));
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_type_check" CHECK ("type" IN ('PERCENT', 'FIXED', 'FREE_SHIPPING'));
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_fixed_amount_nonnegative" CHECK ("fixed_amount" >= 0);
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_min_subtotal_nonnegative" CHECK ("min_subtotal" >= 0);
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_max_discount_nonnegative" CHECK ("max_discount" >= 0);
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_status_check" CHECK ("status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED'));
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_status_check" CHECK ("status" IN ('ACTIVE', 'DISABLED'));
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_status_check" CHECK ("status" IN ('RESERVED', 'APPLIED', 'RELEASED'));
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_target_check" CHECK ("target" IN ('ITEM', 'SHIPPING'));
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_due_nonnegative" CHECK ("amount_due" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_status_check" CHECK ("status" IN ('UNPAID', 'PENDING', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'));
ALTER TABLE "payments" ADD CONSTRAINT "payments_captured_amount_nonnegative" CHECK ("captured_amount" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_refunded_amount_nonnegative" CHECK ("refunded_amount" >= 0);
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_mode_check" CHECK ("mode" IN ('TEST', 'LIVE'));
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_method_check" CHECK ("method" IN ('CARD', 'COD', 'BANK_TRANSFER'));
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_requested_amount_nonnegative" CHECK ("requested_amount" >= 0);
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_status_check" CHECK ("status" IN ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'UNKNOWN'));
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_mode_check" CHECK ("mode" IN ('TEST', 'LIVE'));
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_kind_check" CHECK ("kind" IN ('CAPTURE', 'REFUND', 'CHARGEBACK', 'CHARGEBACK_REVERSAL'));
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_status_check" CHECK ("status" IN ('SUCCEEDED'));
ALTER TABLE "provider_events" ADD CONSTRAINT "provider_events_mode_check" CHECK ("mode" IN ('TEST', 'LIVE'));
ALTER TABLE "provider_events" ADD CONSTRAINT "provider_events_status_check" CHECK ("status" IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'RETRY', 'DEAD'));
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_status_check" CHECK ("status" IN ('REQUESTED', 'APPROVED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'UNKNOWN'));
ALTER TABLE "refund_allocations" ADD CONSTRAINT "refund_allocations_target_check" CHECK ("target" IN ('ITEM', 'SHIPPING', 'GOODWILL'));
ALTER TABLE "refund_allocations" ADD CONSTRAINT "refund_allocations_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "refund_allocations" ADD CONSTRAINT "refund_allocations_tax_amount_nonnegative" CHECK ("tax_amount" >= 0);
ALTER TABLE "reconciliation_runs" ADD CONSTRAINT "reconciliation_runs_mode_check" CHECK ("mode" IN ('TEST', 'LIVE'));
ALTER TABLE "reconciliation_runs" ADD CONSTRAINT "reconciliation_runs_status_check" CHECK ("status" IN ('RUNNING', 'COMPLETED', 'FAILED'));
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_kind_check" CHECK ("kind" IN ('MISSING_INTERNAL', 'MISSING_EXTERNAL', 'AMOUNT_MISMATCH', 'CURRENCY_MISMATCH', 'STATUS_MISMATCH'));
ALTER TABLE "reconciliation_issues" ADD CONSTRAINT "reconciliation_issues_status_check" CHECK ("status" IN ('OPEN', 'RESOLVED', 'IGNORED'));
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'));
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'));
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_min_subtotal_nonnegative" CHECK ("min_subtotal" >= 0);
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_max_subtotal_nonnegative" CHECK ("max_subtotal" >= 0);
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_base_amount_nonnegative" CHECK ("base_amount" >= 0);
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_status_check" CHECK ("status" IN ('DRAFT', 'READY', 'SHIPPED', 'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED'));
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_status_check" CHECK ("status" IN ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTED', 'CLOSED', 'CANCELLED'));
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_resolution_check" CHECK ("resolution" IN ('REFUND', 'REPLACEMENT', 'REPAIR'));
ALTER TABLE "return_inspections" ADD CONSTRAINT "return_inspections_disposition_check" CHECK ("disposition" IN ('RESTOCK', 'QUARANTINE', 'SCRAP', 'REPAIR'));
ALTER TABLE "order_links" ADD CONSTRAINT "order_links_kind_check" CHECK ("kind" IN ('REPLACEMENT', 'EXCHANGE'));
ALTER TABLE "warranty_policies" ADD CONSTRAINT "warranty_policies_starts_on_check" CHECK ("starts_on" IN ('DELIVERED', 'PURCHASED'));
ALTER TABLE "warranty_policies" ADD CONSTRAINT "warranty_policies_status_check" CHECK ("status" IN ('ACTIVE', 'ARCHIVED'));
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_status_check" CHECK ("status" IN ('IN_STOCK', 'RESERVED', 'SOLD', 'RETURNED', 'IN_REPAIR', 'SCRAPPED'));
ALTER TABLE "serial_unit_events" ADD CONSTRAINT "serial_unit_events_kind_check" CHECK ("kind" IN ('RECEIVED', 'RESERVED', 'RELEASED', 'SHIPPED', 'RETURNED', 'REPAIRED', 'REPLACED', 'SCRAPPED'));
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_status_check" CHECK ("status" IN ('OPEN', 'APPROVED', 'REJECTED', 'RECEIVED', 'REPAIRING', 'RESOLVED', 'CLOSED'));
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_resolution_check" CHECK ("resolution" IN ('REPAIR', 'REPLACE', 'REFUND'));
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_status_check" CHECK ("status" IN ('DRAFT', 'ISSUED', 'VOID'));
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_total_amount_nonnegative" CHECK ("total_amount" >= 0);
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_kind_check" CHECK ("kind" IN ('ITEM', 'SHIPPING'));
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_unit_price_nonnegative" CHECK ("unit_price" >= 0);
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_discount_amount_nonnegative" CHECK ("discount_amount" >= 0);
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_tax_amount_nonnegative" CHECK ("tax_amount" >= 0);
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_total_amount_nonnegative" CHECK ("total_amount" >= 0);
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_visibility_check" CHECK ("visibility" IN ('PRIVATE', 'PUBLIC'));
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_status_check" CHECK ("status" IN ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN'));
ALTER TABLE "content_pages" ADD CONSTRAINT "content_pages_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));
ALTER TABLE "articles" ADD CONSTRAINT "articles_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));
ALTER TABLE "banners" ADD CONSTRAINT "banners_status_check" CHECK ("status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED'));
ALTER TABLE "collections" ADD CONSTRAINT "collections_status_check" CHECK ("status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED'));
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_status_check" CHECK ("status" IN ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'));
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_priority_check" CHECK ("priority" IN ('LOW', 'NORMAL', 'HIGH'));
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_visibility_check" CHECK ("visibility" IN ('INTERNAL', 'CUSTOMER'));
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_channel_check" CHECK ("channel" IN ('IN_APP', 'EMAIL', 'SMS'));
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_channel_check" CHECK ("channel" IN ('IN_APP', 'EMAIL', 'SMS'));
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_status_check" CHECK ("status" IN ('PENDING', 'SENDING', 'SENT', 'FAILED', 'UNKNOWN'));
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_status_check" CHECK ("status" IN ('IN_PROGRESS', 'SUCCEEDED', 'FAILED'));
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_status_check" CHECK ("status" IN ('PENDING', 'PROCESSING', 'PUBLISHED', 'RETRY', 'DEAD'));
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_type_check" CHECK ("actor_type" IN ('USER', 'SYSTEM', 'PROVIDER'));

-- Case normalization and uniqueness constrained to active/default rows.
CREATE UNIQUE INDEX users_email_normalized_uq ON users (lower(email));
CREATE UNIQUE INDEX coupons_code_normalized_uq ON coupons (upper(code));
CREATE UNIQUE INDEX carts_active_user_uq ON carts (user_id)
  WHERE status = 'ACTIVE' AND user_id IS NOT NULL;
CREATE UNIQUE INDEX carts_active_guest_uq ON carts (guest_token_hash)
  WHERE status = 'ACTIVE' AND guest_token_hash IS NOT NULL;
CREATE UNIQUE INDEX addresses_default_shipping_uq ON addresses (user_id)
  WHERE is_default_shipping AND archived_at IS NULL;
CREATE UNIQUE INDEX addresses_default_billing_uq ON addresses (user_id)
  WHERE is_default_billing AND archived_at IS NULL;
CREATE UNIQUE INDEX product_primary_category_uq ON product_categories (product_id) WHERE is_primary;
CREATE UNIQUE INDEX product_primary_media_uq ON product_media (product_id)
  WHERE is_primary AND variant_id IS NULL;
CREATE UNIQUE INDEX variant_primary_media_uq ON product_media (variant_id)
  WHERE is_primary AND variant_id IS NOT NULL;
CREATE UNIQUE INDEX payment_attempt_active_uq ON payment_attempts (payment_id)
  WHERE status IN ('CREATED', 'PENDING', 'UNKNOWN');
CREATE UNIQUE INDEX wishlist_default_uq ON wishlists (user_id) WHERE is_default;

-- Checks are intentionally strict for fresh v2 data; backfill must handle v1 exceptions first.
ALTER TABLE currencies ADD CONSTRAINT currencies_minor_unit_range CHECK (minor_unit BETWEEN 0 AND 6);
ALTER TABLE categories ADD CONSTRAINT categories_not_self_parent CHECK (parent_id <> id);
ALTER TABLE media_assets ADD CONSTRAINT media_assets_dimensions_valid
  CHECK (size_bytes >= 0 AND (width IS NULL OR width > 0) AND (height IS NULL OR height > 0));
ALTER TABLE product_variants ADD CONSTRAINT product_variants_dimensions_valid
  CHECK ((weight_grams IS NULL OR weight_grams > 0) AND (length_mm IS NULL OR length_mm > 0)
    AND (width_mm IS NULL OR width_mm > 0) AND (height_mm IS NULL OR height_mm > 0));
ALTER TABLE product_attribute_values ADD CONSTRAINT product_attribute_value_exactly_one
  CHECK (num_nonnulls(text_value, number_value, boolean_value) = 1);
ALTER TABLE variant_attribute_values ADD CONSTRAINT variant_attribute_value_exactly_one
  CHECK (num_nonnulls(text_value, number_value, boolean_value) = 1);
ALTER TABLE variant_prices ADD CONSTRAINT variant_prices_compare_at_valid
  CHECK (compare_at_amount IS NULL OR compare_at_amount >= amount);
ALTER TABLE tax_rates ADD CONSTRAINT tax_rates_time_range
  CHECK (effective_to IS NULL OR effective_to > effective_from);
ALTER TABLE inventory_balances ADD CONSTRAINT inventory_balances_valid
  CHECK (on_hand >= 0 AND reserved >= 0 AND unavailable >= 0 AND version >= 0
    AND reserved::bigint + unavailable::bigint <= on_hand::bigint);
ALTER TABLE stock_reservations ADD CONSTRAINT stock_reservations_valid
  CHECK (quantity > 0 AND (status <> 'ACTIVE' OR expires_at IS NOT NULL));
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_nonzero
  CHECK (on_hand_delta <> 0 OR reserved_delta <> 0 OR unavailable_delta <> 0);
ALTER TABLE supplier_variants ADD CONSTRAINT supplier_variants_quantities_valid
  CHECK (minimum_order_qty > 0 AND (lead_time_days IS NULL OR lead_time_days >= 0));
ALTER TABLE purchase_order_items ADD CONSTRAINT purchase_order_items_quantity_valid CHECK (quantity > 0);
ALTER TABLE goods_receipt_items ADD CONSTRAINT goods_receipt_items_quantities_valid
  CHECK (accepted_qty >= 0 AND rejected_qty >= 0 AND accepted_qty::bigint + rejected_qty::bigint > 0);
ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_different_warehouses
  CHECK (from_warehouse_id <> to_warehouse_id);
ALTER TABLE stock_transfer_items ADD CONSTRAINT stock_transfer_items_quantities_valid
  CHECK (quantity > 0 AND received_qty >= 0 AND lost_qty >= 0
    AND received_qty::bigint + lost_qty::bigint <= quantity::bigint);
ALTER TABLE stock_count_items ADD CONSTRAINT stock_count_items_quantities_valid
  CHECK (expected_on_hand >= 0 AND (counted_on_hand IS NULL OR counted_on_hand >= 0) AND balance_version >= 0);
ALTER TABLE carts ADD CONSTRAINT cart_owner_exactly_one
  CHECK ((user_id IS NOT NULL) <> (guest_token_hash IS NOT NULL));
ALTER TABLE carts ADD CONSTRAINT carts_version_valid CHECK (version >= 0);
ALTER TABLE cart_items ADD CONSTRAINT cart_items_quantity_valid CHECK (quantity > 0);
ALTER TABLE checkout_sessions ADD CONSTRAINT checkout_sessions_version_valid
  CHECK (cart_version >= 0 AND snapshot_version > 0);
ALTER TABLE orders ADD CONSTRAINT orders_totals_consistent
  CHECK (grand_total::numeric = subtotal::numeric - discount_total::numeric + shipping_total::numeric + tax_total::numeric
    AND discount_total::numeric <= subtotal::numeric + shipping_total::numeric AND version >= 0 AND snapshot_version > 0);
ALTER TABLE order_items ADD CONSTRAINT order_items_totals_consistent
  CHECK (quantity > 0 AND line_number > 0 AND snapshot_version > 0
    AND line_subtotal::numeric = unit_price::numeric * quantity::numeric
    AND discount_amount <= line_subtotal
    AND line_total::numeric = line_subtotal::numeric - discount_amount::numeric + tax_amount::numeric);
ALTER TABLE order_addresses ADD CONSTRAINT order_addresses_complete_when_required
  CHECK (completeness = 'LEGACY_UNPARSED'
    OR (recipient_name IS NOT NULL AND phone IS NOT NULL AND country_code IS NOT NULL AND line1 IS NOT NULL));
ALTER TABLE promotions ADD CONSTRAINT promotions_rules_valid
  CHECK (ends_at > starts_at
    AND (global_limit IS NULL OR global_limit > 0) AND (per_user_limit IS NULL OR per_user_limit > 0)
    AND (type <> 'PERCENT' OR (percent_bps IS NOT NULL AND percent_bps BETWEEN 1 AND 10000 AND fixed_amount IS NULL))
    AND (type <> 'FIXED' OR (fixed_amount IS NOT NULL AND fixed_amount > 0 AND currency_code IS NOT NULL AND percent_bps IS NULL))
    AND (type <> 'FREE_SHIPPING' OR (percent_bps IS NULL AND fixed_amount IS NULL))
    AND ((min_subtotal IS NULL AND max_discount IS NULL AND fixed_amount IS NULL) OR currency_code IS NOT NULL));
ALTER TABLE coupons ADD CONSTRAINT coupons_limit_valid CHECK (usage_limit IS NULL OR usage_limit > 0);
ALTER TABLE promotion_redemptions ADD CONSTRAINT promotion_redemptions_reserved_until
  CHECK (status <> 'RESERVED' OR reserved_until IS NOT NULL);
ALTER TABLE order_discounts ADD CONSTRAINT order_discounts_target_valid
  CHECK (amount > 0 AND snapshot_version > 0
    AND ((target = 'ITEM' AND order_item_id IS NOT NULL) OR (target = 'SHIPPING' AND order_item_id IS NULL)));
ALTER TABLE payments ADD CONSTRAINT payments_projection_valid
  CHECK (refunded_amount <= captured_amount AND version >= 0);
ALTER TABLE payment_attempts ADD CONSTRAINT payment_attempts_provider_intent_valid
  CHECK (provider_intent_id IS NULL OR length(provider_intent_id) > 0);
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_refund_link_valid
  CHECK (amount > 0 AND ((kind = 'REFUND' AND refund_id IS NOT NULL) OR (kind <> 'REFUND' AND refund_id IS NULL)));
ALTER TABLE refunds ADD CONSTRAINT refunds_positive_amount CHECK (amount > 0);
ALTER TABLE refund_allocations ADD CONSTRAINT refund_allocations_valid
  CHECK (amount > 0 AND tax_amount <= amount AND (quantity IS NULL OR quantity > 0)
    AND ((target = 'ITEM' AND order_item_id IS NOT NULL)
      OR (target IN ('SHIPPING', 'GOODWILL') AND order_item_id IS NULL AND quantity IS NULL)));
ALTER TABLE reconciliation_runs ADD CONSTRAINT reconciliation_runs_window_valid CHECK (window_end > window_start);
ALTER TABLE shipping_rates ADD CONSTRAINT shipping_rates_ranges_valid
  CHECK (min_weight_grams >= 0 AND (max_weight_grams IS NULL OR max_weight_grams > min_weight_grams)
    AND (max_subtotal IS NULL OR max_subtotal > min_subtotal) AND (ends_at IS NULL OR ends_at > starts_at));
ALTER TABLE shipment_items ADD CONSTRAINT shipment_items_quantity_valid CHECK (quantity > 0);
ALTER TABLE return_items ADD CONSTRAINT return_items_quantity_valid CHECK (quantity > 0);
ALTER TABLE return_inspections ADD CONSTRAINT return_inspections_quantity_valid CHECK (quantity > 0);
ALTER TABLE return_receipts ADD CONSTRAINT return_receipts_quantity_valid CHECK (quantity > 0);
ALTER TABLE order_links ADD CONSTRAINT order_links_different_orders CHECK (source_order_id <> target_order_id);
ALTER TABLE warranty_policies ADD CONSTRAINT warranty_policies_duration_valid CHECK (duration_months >= 0);
ALTER TABLE serial_units ADD CONSTRAINT serial_units_warranty_range
  CHECK (warranty_end IS NULL OR warranty_start IS NULL OR warranty_end >= warranty_start);
ALTER TABLE warranty_claims ADD CONSTRAINT warranty_claims_quantity_valid CHECK (quantity > 0 AND snapshot_version > 0);
ALTER TABLE invoices ADD CONSTRAINT invoices_issued_fields_required
  CHECK (snapshot_version > 0 AND (status <> 'ISSUED' OR (number IS NOT NULL AND issued_at IS NOT NULL)));
ALTER TABLE invoice_lines ADD CONSTRAINT invoice_lines_valid
  CHECK (quantity > 0 AND line_number > 0 AND snapshot_version > 0
    AND discount_amount::numeric <= unit_price::numeric * quantity::numeric
    AND total_amount::numeric = unit_price::numeric * quantity::numeric - discount_amount::numeric + tax_amount::numeric
    AND ((kind = 'ITEM' AND order_item_id IS NOT NULL) OR (kind = 'SHIPPING' AND order_item_id IS NULL)));
ALTER TABLE credit_notes ADD CONSTRAINT credit_notes_positive_amount CHECK (amount > 0 AND snapshot_version > 0);
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE banners ADD CONSTRAINT banners_time_range CHECK (ends_at IS NULL OR ends_at > starts_at);
ALTER TABLE collections ADD CONSTRAINT collections_time_range CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at);
ALTER TABLE auth_challenges ADD CONSTRAINT auth_challenges_attempts_nonnegative CHECK (attempts >= 0);
ALTER TABLE provider_events ADD CONSTRAINT provider_events_attempts_nonnegative CHECK (attempts >= 0);
ALTER TABLE notification_deliveries ADD CONSTRAINT notification_deliveries_attempts_valid CHECK (attempts >= 0 AND template_version > 0);
ALTER TABLE outbox_events ADD CONSTRAINT outbox_events_attempts_valid CHECK (attempts >= 0 AND schema_version > 0);
ALTER TABLE store_settings ADD CONSTRAINT store_settings_version_positive CHECK (schema_version > 0);

CREATE INDEX reservation_expiry_idx ON stock_reservations (expires_at, id) WHERE status = 'ACTIVE';
CREATE INDEX outbox_due_idx ON outbox_events (available_at, id) WHERE status IN ('PENDING', 'RETRY');
CREATE INDEX auth_sessions_family_idx ON auth_sessions (family_id);
CREATE INDEX attribute_product_number_idx ON product_attribute_values (attribute_id, number_value) WHERE number_value IS NOT NULL;
CREATE INDEX attribute_variant_number_idx ON variant_attribute_values (attribute_id, number_value) WHERE number_value IS NOT NULL;



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
