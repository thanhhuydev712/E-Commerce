require('dotenv/config');
const { Client } = require('pg');

async function inspect() {
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000, statement_timeout: 15000 });
  try {
    await db.connect();
    await db.query('BEGIN READ ONLY');
    const queries = {
      orders: `SELECT status::text, count(*)::int AS count, sum("totalAmount")::text AS total FROM public.orders GROUP BY status`,
      payments: `SELECT status::text, currency, count(*)::int AS count, sum(amount)::text AS total,
        count(*) FILTER (WHERE "transactionId" LIKE 'pi_%')::int AS intent_ids,
        count(*) FILTER (WHERE "transactionId" IS NOT NULL AND "transactionId" NOT LIKE 'pi_%')::int AS other_transaction_ids
        FROM public.payments GROUP BY status,currency`,
      moneyIntegrity: `SELECT count(*)::int AS orders,
        count(*) FILTER (WHERE o."totalAmount" <> (SELECT sum(i.price*i.quantity) FROM public.order_items i WHERE i."orderId"=o.id))::int AS order_item_mismatches,
        count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.payments p WHERE p."orderId"=o.id AND p.amount<>o."totalAmount"))::int AS payment_amount_mismatches
        FROM public.orders o`,
      catalog: `SELECT count(*)::int AS products,min(price)::text AS min_price,max(price)::text AS max_price,
        sum(stock)::text AS stock_total,count(*) FILTER(WHERE stock<0 OR price<0)::int AS invalid,
        count(*) FILTER(WHERE "imageUrl" IS NOT NULL)::int AS images FROM public.products`,
      identifiers: `SELECT count(*) FILTER(WHERE id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')::int AS invalid_uuid FROM
        (SELECT id FROM public.users UNION ALL SELECT id FROM public.categories UNION ALL SELECT id FROM public.products
         UNION ALL SELECT id FROM public.carts UNION ALL SELECT id FROM public.carts_items UNION ALL SELECT id FROM public.orders
         UNION ALL SELECT id FROM public.order_items UNION ALL SELECT id FROM public.payments) s`,
      emailCollisions: `SELECT count(*)::int AS collisions FROM (SELECT lower(trim(email)) FROM public.users GROUP BY lower(trim(email)) HAVING count(*)>1) s`,
      carts: `SELECT "checkedOut",count(*)::int AS count FROM public.carts GROUP BY "checkedOut"`,
      sourceColumns: `SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public'
        AND table_name IN ('users','categories','products','carts','carts_items','orders','order_items','payments') ORDER BY table_name,ordinal_position`,
    };
    const output = {};
    for (const [key, sql] of Object.entries(queries)) output[key] = (await db.query(sql)).rows;
    await db.query('COMMIT');
    console.log(JSON.stringify(output,null,2));
  } finally { await db.end(); }
}
inspect().catch(error => { console.error(JSON.stringify({ code:error.code || error.name, error:'Legacy inspection failed; sensitive details omitted.' })); process.exitCode=1; });
