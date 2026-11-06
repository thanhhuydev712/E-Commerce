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
