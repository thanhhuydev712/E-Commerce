// Compose a new migration; never alters applied v1 migrations or connects to the DB.
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'migrations/20261105000000_commerce_v2_baseline/migration.sql');
const ddl=fs.readFileSync(base,'utf8').replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,'');
const prefix=fs.readFileSync(path.join(__dirname,'upgrade-prefix.sql'),'utf8');
const backfill=fs.readFileSync(path.join(__dirname,'upgrade-backfill.sql'),'utf8');
const sql=[prefix,ddl,backfill].join('\n\n');
const directory=path.resolve(__dirname,'../migrations/20261105010000_upgrade_v2_vnd');
fs.mkdirSync(directory,{recursive:true});
const destination=path.join(directory,'migration.sql');
if(fs.existsSync(destination)&&fs.readFileSync(destination,'utf8')!==sql) throw new Error('Migration differs; do not overwrite applied SQL.');
fs.writeFileSync(destination,sql);
console.log(JSON.stringify({migration:'20261105010000_upgrade_v2_vnd',tables:(sql.match(/CREATE TABLE /g)||[]).length,applied:false}));
