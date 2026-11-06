// Chỉ đọc aggregate/schema; không xuất tài khoản, password hash, token hoặc connection string.
require('dotenv/config');
const fs=require('node:fs/promises'),path=require('node:path');
const {Client}=require('pg');
async function main(){
  const schema=process.env.DATABASE_SCHEMA||'public';if(!/^[a-z][a-z0-9_]*$/.test(schema)||schema==='legacy_v1')throw new Error('Invalid schema');
  const source=await fs.readFile('prisma/schema.prisma','utf8');
  const models=[...source.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map(match=>({model:match[1],table:match[2].match(/@@map\("([a-z0-9_]+)"\)/)?.[1]||match[1]}));
  const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000,statement_timeout:15000});
  const table=name=>`"${schema}"."${name}"`;
  try{
    await db.connect();await db.query('BEGIN READ ONLY');
    const present=(await db.query('SELECT tablename FROM pg_tables WHERE schemaname=$1',[schema])).rows.map(row=>row.tablename);
    const missingTables=models.filter(model=>!present.includes(model.table)).map(model=>model.table);
    const covered=models.filter(model=>present.includes(model.table));
    const counts=(await db.query(covered.map(model=>`SELECT '${model.table}' AS name,count(*)::int AS rows FROM ${table(model.table)}`).join(' UNION ALL '))).rows;
    const checks=(await db.query(`SELECT
      (SELECT count(*)::int FROM ${table('inventory_balances')} b WHERE b.on_hand<>COALESCE((SELECT sum(m.on_hand_delta) FROM ${table('inventory_movements')} m WHERE m.balance_id=b.id),0)
        OR b.reserved<>COALESCE((SELECT sum(m.reserved_delta) FROM ${table('inventory_movements')} m WHERE m.balance_id=b.id),0)
        OR b.unavailable<>COALESCE((SELECT sum(m.unavailable_delta) FROM ${table('inventory_movements')} m WHERE m.balance_id=b.id),0)) AS ledger_mismatches,
      (SELECT count(*)::int FROM ${table('inventory_balances')} b WHERE b.reserved<>COALESCE((SELECT sum(r.quantity) FROM ${table('stock_reservations')} r WHERE r.balance_id=b.id AND r.status IN ('ACTIVE','COMMITTED')),0)) AS reservation_mismatches,
      (SELECT count(*)::int FROM ${table('orders')} o WHERE o.grand_total<>o.subtotal-o.discount_total+o.shipping_total+o.tax_total
        OR o.subtotal<>COALESCE((SELECT sum(i.line_subtotal) FROM ${table('order_items')} i WHERE i.order_id=o.id),0)
        OR o.discount_total<>COALESCE((SELECT sum(i.discount_amount) FROM ${table('order_items')} i WHERE i.order_id=o.id),0)) AS order_total_mismatches,
      (SELECT count(*)::int FROM ${table('payments')} p JOIN ${table('orders')} o ON o.id=p.order_id WHERE p.amount_due<>o.grand_total OR p.refunded_amount>p.captured_amount) AS payment_mismatches,
      (SELECT count(*)::int FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname=$1 AND NOT c.convalidated) AS unvalidated_constraints
    `,[schema])).rows[0];
    const currencies=(await db.query(`SELECT code,minor_unit FROM ${table('currencies')} WHERE is_active ORDER BY code`)).rows;
    await db.query('COMMIT');
    const report={date:'2026-11-06',schema,expectedModels:models.length,presentTables:covered.length,missingTables,checks,currencies,tables:models.map(model=>({...model,rows:counts.find(row=>row.name===model.table)?.rows??null})),note:'Bảng giao dịch/lịch sử/processor chỉ phát sinh khi nghiệp vụ chạy; không thêm capture/webhook/refund giả để làm đủ số bảng.'};
    const target=path.resolve('../docs/database/DATABASE_AUDIT.json');
    if(process.argv.includes('--write-report'))await fs.writeFile(target,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({expectedModels:models.length,presentTables:covered.length,missingTables,checks,currencies,populatedTables:counts.filter(row=>row.rows>0).length,emptyTables:counts.filter(row=>row.rows===0).length,reportWritten:process.argv.includes('--write-report')}));
    if(missingTables.length||Object.values(checks).some(value=>value!==0)||currencies.length!==1||currencies[0].code!=='VND'||currencies[0].minor_unit!==0)process.exitCode=1;
  }finally{await db.end();}
}
main().catch(error=>{console.error(JSON.stringify({event:'database_audit_failed',code:error.code||error.name}));process.exitCode=1;});
