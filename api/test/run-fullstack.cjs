// Chạy FE–BE thật trên PostgreSQL schema riêng; không seed/truncate public.
require('dotenv/config');
const {Client}=require('pg');
const {spawn,execFileSync}=require('node:child_process');
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomBytes,randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'..'),front=path.resolve(root,'../front');
const schema=`codex_live_test_${randomUUID().replaceAll('-','')}`;
const mediaRoot=path.join(root,'.tmp',schema);
const base='http://127.0.0.1:3002',apiBase='http://127.0.0.1:3401';
const children=[];
function stop(child){
  if(!child?.pid)return;
  try{if(process.platform==='win32')execFileSync('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else child.kill('SIGTERM');}catch{}
}
async function waitFor(url,child){
  for(let attempt=0;attempt<60;attempt++){
    if(child.exitCode!==null)throw new Error('Application exited before readiness');
    try{const response=await fetch(url,{signal:AbortSignal.timeout(2000)});if(response.ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  throw new Error('Application readiness timeout');
}
async function main(){
  if(process.env.NODE_ENV==='production')throw new Error('Refusing fullstack development tests in production');
  const connection=process.env.TEST_DATABASE_URL||process.env.DATABASE_URL;
  if(!connection)throw new Error('TEST_DATABASE_URL is required');
  const db=new Client({connectionString:connection,connectionTimeoutMillis:15000,statement_timeout:120000});
  let created=false,connected=false;
  const env={...process.env,NODE_ENV:'test',DATABASE_URL:connection,DATABASE_SCHEMA:schema,JWT_SECRET:randomBytes(48).toString('hex'),JWT_REFRESH_SECRET:randomBytes(48).toString('hex'),ALLOWED_ORIGINS:base,MEDIA_ROOT:mediaRoot,PORT:'3401'};
  delete env.STRIPE_SECRET_KEY;delete env.STRIPE_WEBHOOK_SECRET;
  try{
    await db.connect();connected=true;await db.query('BEGIN');await db.query(`CREATE SCHEMA "${schema}"`);await db.query(`SET LOCAL search_path TO "${schema}"`);
    for(const file of ['prisma/v2/migrations/20261105000000_commerce_v2_baseline/migration.sql','prisma/migrations/20261106010000_storefront_saved_builds/migration.sql']){
      const sql=await fs.readFile(path.join(root,file),'utf8');await db.query(sql.replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,''));
    }
    await db.query('COMMIT');created=true;
    execFileSync(process.execPath,['prisma/seed-storefront.cjs','--apply'],{cwd:root,env,stdio:'pipe',timeout:150000,windowsHide:true});
    execFileSync(process.execPath,['dist/modules/access/seed-access.js'],{cwd:root,env,stdio:'pipe',timeout:60000,windowsHide:true});
    const backend=spawn(process.execPath,['dist/main.js'],{cwd:root,env,stdio:'ignore',windowsHide:true});children.push(backend);await waitFor(apiBase+'/api/v1/health/ready',backend);
    const frontendEnv={...process.env,NODE_ENV:'development',API_INTERNAL_URL:apiBase,NEXT_DIST_DIR:'.next-local-live-test',LIVE_BASE_URL:base};
    for(const key of ['DATABASE_URL','TEST_DATABASE_URL','JWT_SECRET','JWT_REFRESH_SECRET','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'])delete frontendEnv[key];
    const frontend=spawn(process.execPath,[path.join(front,'node_modules/next/dist/bin/next'),'dev','--hostname','127.0.0.1','--port','3002'],{cwd:front,env:frontendEnv,stdio:'ignore',windowsHide:true});children.push(frontend);await waitFor(base,frontend);
    const resultDir=path.join(front,'.visual-review',schema);await fs.mkdir(resultDir,{recursive:true});
    const runner=spawn(process.execPath,[path.join(front,'node_modules/@playwright/test/cli.js'),'test','--config','playwright.live.config.ts','--output',path.join(resultDir,'artifacts'),...process.argv.slice(2)],{cwd:front,env:{...frontendEnv,LIVE_REPORT_PATH:path.join(resultDir,'results.json')},stdio:'inherit',windowsHide:true});children.push(runner);
    const code=await new Promise(resolve=>runner.once('exit',value=>resolve(value??1)));
    console.log(JSON.stringify({fullstackExitCode:code,report:path.relative(path.resolve(root,'..'),path.join(resultDir,'results.json')),isolatedSchema:true}));
    process.exitCode=code;
  }finally{
    for(const child of children.reverse())stop(child);
    if(connected){await db.query('ROLLBACK');if(created&&/^codex_live_test_[a-f0-9]{32}$/.test(schema))await db.query(`DROP SCHEMA "${schema}" CASCADE`);await db.end();}
    if(path.resolve(mediaRoot).startsWith(path.join(root,'.tmp')+path.sep)&&path.basename(mediaRoot)===schema)await fs.rm(mediaRoot,{recursive:true,force:true});
  }
}
main().catch(error=>{console.error(JSON.stringify({event:'fullstack_test_failed',code:error.code||error.name,message:error.code?'Test preparation failed; credentials omitted':error.message}));process.exitCode=1;});
