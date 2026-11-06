// Runs the complete upgrade against the configured development database and ALWAYS rolls back.
// Does not print customer records, provider identifiers, hashes or connection credentials.
require('dotenv/config');
const fs=require('node:fs');
const path=require('node:path');
const {Client}=require('pg');
async function main(){
  const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000,statement_timeout:120000});
  try{
    await db.connect();
    const sql=fs.readFileSync(path.resolve(__dirname,'../migrations/20261105010000_upgrade_v2_vnd/migration.sql'),'utf8');
    if(!/COMMIT;\s*$/.test(sql))throw new Error('Unexpected migration ending');
    await db.query(sql.replace(/COMMIT;\s*$/,''));
    const metrics=(await db.query(`SELECT
      (SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name<>'_prisma_migrations') AS tables,
      (SELECT count(*)::int FROM public.users) AS users,
      (SELECT count(*)::int FROM public.products) AS products,
      (SELECT count(*)::int FROM public.product_variants) AS variants,
      (SELECT count(*)::int FROM public.orders) AS orders,
      (SELECT count(*)::int FROM public.payments) AS payments,
      (SELECT sum(on_hand)::text FROM public.inventory_balances) AS stock,
      (SELECT count(*)::int FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' AND c.contype='c') AS checks`)).rows[0];
    const tests=[
      ['negative_stock','UPDATE public.inventory_balances SET on_hand=-1','23514'],
      ['negative_price','UPDATE public.variant_prices SET amount=-1','23514'],
      ['duplicate_active_cart',`INSERT INTO public.carts(id,user_id,currency_code,status,version,updated_at)
        SELECT md5('v2:test:duplicate-cart')::uuid,user_id,'VND','ACTIVE',0,now() FROM public.carts WHERE status='ACTIVE' LIMIT 1`,'23505'],
      ['invalid_role',`UPDATE public.user_roles SET role_id=md5('v2:test:missing-role')::uuid`,'23503'],
      ['invalid_currency_exponent',`UPDATE public.currencies SET minor_unit=-1`,'23514'],
    ];
    const passed=[];
    for(const [name,query,expected] of tests){
      await db.query('SAVEPOINT constraint_case');
      let code=null;
      try{await db.query(query);}catch(error){code=error.code;}
      await db.query('ROLLBACK TO SAVEPOINT constraint_case');
      await db.query('RELEASE SAVEPOINT constraint_case');
      if(code!==expected)throw new Error(`Constraint regression ${name}: expected ${expected}, got ${code}`);
      passed.push(name);
    }
    await db.query('ROLLBACK');
    const unchanged=(await db.query(`SELECT
      (SELECT count(*)::int FROM public.orders) AS legacy_orders,
      NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='legacy_v1') AS archive_rolled_back,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='password') AS v1_restored`)).rows[0];
    if(!unchanged.archive_rolled_back||!unchanged.v1_restored)throw new Error('Rollback validation failed');
    console.log(JSON.stringify({dryRun:true,metrics,passed,rollbackVerified:unchanged},null,2));
  }finally{await db.query('ROLLBACK').catch(()=>{});await db.end();}
}
main().catch(error=>{console.error(JSON.stringify({error:error.code||error.name,stage:'upgrade_dry_run',detail:error.code?'PostgreSQL rejected the operation; original data rolled back.':error.message}));process.exitCode=1;});
