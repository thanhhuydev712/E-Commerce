// Read-only post-migration checks. Emits aggregates only, never account/customer records.
require('dotenv/config');
const {Client}=require('pg');
async function main(){
  const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000,statement_timeout:15000});
  try{
    await db.connect();await db.query('BEGIN READ ONLY');
    const summary=(await db.query(`SELECT
      (SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name<>'_prisma_migrations') AS v2_tables,
      (SELECT count(*)::int FROM public._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) AS applied_migrations,
      (SELECT count(*)::int FROM public.users) AS users,
      (SELECT count(*)::int FROM public.user_roles) AS user_roles,
      (SELECT count(*)::int FROM public.categories) AS categories,
      (SELECT count(*)::int FROM public.products) AS products,
      (SELECT count(*)::int FROM public.product_variants) AS variants,
      (SELECT count(*)::int FROM public.carts) AS carts,
      (SELECT count(*)::int FROM public.orders) AS active_orders,
      (SELECT count(*)::int FROM public.payments) AS active_payments,
      (SELECT count(*)::int FROM legacy_v1.orders) AS archived_orders,
      (SELECT count(*)::int FROM legacy_v1.payments) AS archived_payments,
      (SELECT sum(on_hand)::text FROM public.inventory_balances) AS stock,
      (SELECT count(*)::int FROM public.media_assets WHERE status='PENDING') AS pending_media,
      (SELECT count(*)::int FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' AND c.contype='c') AS checks,
      NOT EXISTS (SELECT 1 FROM legacy_v1.users s LEFT JOIN public.users t ON t.id=s.id::uuid
        WHERE t.id IS NULL OR t.password_hash IS DISTINCT FROM s.password) AS account_hashes_preserved,
      NOT EXISTS (SELECT 1 FROM legacy_v1.products s
        LEFT JOIN public.product_variants v ON v.product_id=s.id::uuid
        LEFT JOIN public.variant_prices p ON p.variant_id=v.id
        LEFT JOIN public.inventory_balances b ON b.variant_id=v.id
        WHERE p.amount IS DISTINCT FROM s.price::bigint OR p.currency_code<>'VND' OR b.on_hand IS DISTINCT FROM s.stock) AS prices_stock_preserved,
      NOT EXISTS (SELECT 1 FROM public.inventory_balances b WHERE b.on_hand<>
        COALESCE((SELECT sum(m.on_hand_delta) FROM public.inventory_movements m WHERE m.balance_id=b.id),0)) AS ledger_matches`)).rows[0];
    const currencies=(await db.query('SELECT code,minor_unit,is_active FROM public.currencies ORDER BY code')).rows;
    await db.query('COMMIT');
    if(summary.v2_tables!==104||summary.checks!==172||!summary.account_hashes_preserved||!summary.prices_stock_preserved||!summary.ledger_matches)throw new Error('POST_MIGRATION_INVARIANT_FAILED');
    console.log(JSON.stringify({summary,currencies},null,2));
  }finally{await db.end();}
}
main().catch(error=>{console.error(JSON.stringify({code:error.code||error.name,error:'Post-migration verification failed; sensitive details omitted.'}));process.exitCode=1;});
