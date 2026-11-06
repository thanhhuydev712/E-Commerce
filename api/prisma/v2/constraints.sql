-- E-Commerce v2: supplementary constraints, NOT an applied migration.
-- Review with a generated v2 migration after backfill/preflight; never run on v1.
-- Prisma schema defines columns, FKs and ordinary indexes. This file supplies CHECKs and partial/expression indexes.
BEGIN;
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
-- auth_sessions_family_idx is tracked by @@index in schema.prisma.
CREATE INDEX attribute_product_number_idx ON product_attribute_values (attribute_id, number_value) WHERE number_value IS NOT NULL;
CREATE INDEX attribute_variant_number_idx ON variant_attribute_values (attribute_id, number_value) WHERE number_value IS NOT NULL;

COMMIT;
