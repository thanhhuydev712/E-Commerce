// Dữ liệu demo có nguồn trong seed-data, không import dữ liệu runtime từ frontend.
require('dotenv/config');
const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash, randomBytes} = require('node:crypto');
const bcrypt = require('bcrypt');
const {PrismaClient} = require('../generated/prisma-v2/index.js');
const {PrismaPg} = require('@prisma/adapter-pg');
const data = require('./seed-data/storefront.json');
const presentation = require('./seed-data/presentation.json');
const uuid = key => {
  const hash = createHash('sha256').update(`rigforge-demo-v1:${key}`).digest('hex').slice(0,32);
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20)}`;
};
const slug = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const editorId=uuid('editor'), warehouseId=uuid('warehouse');
const attributes = [
  ['display_specs','TEXT'],['warranty','TEXT'],['badge','TEXT'],['builder_eligible','BOOLEAN'],
  ...['socket','ddr','form'].map(code=>[code,'TEXT']),
  ...['watts','length','clearance','gpuMax','coolerMax','capacity','slots'].map(code=>[code,'NUMBER']),
  ['integrated','BOOLEAN'],
];
async function main(){
  if(process.env.NODE_ENV==='production') throw new Error('Development seed is not allowed in production');
  const schema=process.env.DATABASE_SCHEMA||'public';
  if(!/^[a-z][a-z0-9_]*$/.test(schema)||schema==='legacy_v1')throw new Error('Invalid schema');
  if(!process.argv.includes('--apply')){
    console.log(JSON.stringify({mode:'plan',categories:data.categories.length,products:data.products.length,variants:data.products.reduce((sum,p)=>sum+p.variants.length,0),articles:data.articles.length,attributes:attributes.length,existingData:'preserved',paymentProviderCalls:0}));
    return;
  }
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000},{schema})});
  const mediaRoot=path.resolve(process.env.MEDIA_ROOT||'.local-media');
  const workspace=path.resolve('..');
  if(!mediaRoot.startsWith(workspace+path.sep))throw new Error('MEDIA_ROOT must stay inside this workspace for development seed');
  const now=new Date(), sourceRoot=path.resolve('../front/public');
  const files=new Map(), productAssets=new Map(), bannerAssets=new Map();
  const localByCategory=new Map(data.products.filter(p=>p.image.startsWith('/images/')).map(p=>[p.category,p.image]));
  const fallback=data.products.find(p=>p.image.startsWith('/images/'))?.image;
  for(const product of data.products){
    const image=product.image.startsWith('/images/')?product.image:(localByCategory.get(product.category)||fallback);
    const source=path.resolve(sourceRoot,'.'+image);
    if(!source.startsWith(sourceRoot+path.sep))throw new Error('Invalid asset path');
    const bytes=await fs.readFile(source), checksum=createHash('sha256').update(bytes).digest('hex');
    const id=uuid(`media:${checksum}`), extension=path.extname(source).toLowerCase();
    if(!['.webp','.png','.jpg','.jpeg'].includes(extension))throw new Error('Unsupported seed image');
    const storageKey=id+(extension==='.jpeg'?'.jpg':extension);
    files.set(id,{id,storageKey,originalName:path.basename(source),mimeType:extension==='.webp'?'image/webp':extension==='.png'?'image/png':'image/jpeg',sizeBytes:BigInt(bytes.length),checksum,status:'READY',uploadedBy:editorId,bytes});
    productAssets.set(product.id,id);
  }
  for(const banner of presentation.bannerCampaigns){
    const source=path.resolve(sourceRoot,'.'+banner.image);if(!source.startsWith(sourceRoot+path.sep))throw new Error('Invalid banner path');
    const bytes=await fs.readFile(source),checksum=createHash('sha256').update(bytes).digest('hex'),id=uuid(`media:${checksum}`);
    if(path.extname(source).toLowerCase()!=='.webp')throw new Error('Seed banner must be WebP');
    files.set(id,{id,storageKey:id+'.webp',originalName:path.basename(source),mimeType:'image/webp',sizeBytes:BigInt(bytes.length),checksum,status:'READY',uploadedBy:editorId,bytes});bannerAssets.set(banner.id,id);
  }
  await fs.mkdir(mediaRoot,{recursive:true});
  for(const file of files.values())await fs.writeFile(path.join(mediaRoot,file.storageKey),file.bytes,{flag:'wx'}).catch(error=>{if(error.code!=='EEXIST')throw error;});
  try{
    await prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261106, 3)`;
      const collisions=await tx.product.findMany({where:{slug:{in:data.products.map(p=>p.slug)}},select:{id:true,slug:true}});
      if(collisions.some(row=>row.id!==uuid(`product:${row.slug}`)))throw new Error('Seed slug collides with an existing product; no existing product will be overwritten');
      await tx.user.createMany({data:[{id:editorId,email:'seed-editor@rigforge.example',passwordHash:await bcrypt.hash(randomBytes(48).toString('hex'),12),firstName:'Biên tập demo',status:'LOCKED'}],skipDuplicates:true});
      await tx.currency.upsert({where:{code:'VND'},create:{code:'VND',name:'Vietnamese dong',minorUnit:0,isActive:true},update:{}});
      const brands=[...new Set(data.products.map(p=>p.brand))].map(name=>({id:uuid(`brand:${slug(name)}`),name,slug:slug(name),status:'ACTIVE'}));
      await tx.brand.createMany({data:[...new Map(brands.map(b=>[b.slug,b])).values()],skipDuplicates:true});
      const actualBrands=new Map((await tx.brand.findMany({select:{id:true,slug:true}})).map(b=>[b.slug,b.id]));
      await tx.category.createMany({data:data.categories.map((c,i)=>({id:uuid(`category:${c.id}`),name:c.name,slug:c.id,sortOrder:i,status:'ACTIVE'})),skipDuplicates:true});
      const actualCategories=new Map((await tx.category.findMany({select:{id:true,slug:true}})).map(c=>[c.slug,c.id]));
      await tx.mediaAsset.createMany({data:[...files.values()].map(({bytes,...row})=>row),skipDuplicates:true});
      await tx.banner.createMany({data:presentation.bannerCampaigns.map((b,i)=>({id:uuid(`banner:${b.id}`),title:b.title,assetId:bannerAssets.get(b.id),placement:'HOME_HERO',targetUrl:b.href,sortOrder:i,startsAt:new Date('2020-01-01'),status:'ACTIVE'})),skipDuplicates:true});
      await tx.product.createMany({data:data.products.map(p=>({id:uuid(`product:${p.slug}`),name:p.name,slug:p.slug,summary:p.specs.join(' · '),description:`${p.name}. Dữ liệu demo phục vụ kiểm thử, chưa xác minh thông số kinh doanh.`,brandId:actualBrands.get(slug(p.brand)),status:'ACTIVE',publishedAt:now})),skipDuplicates:true});
      await tx.productCategory.createMany({data:data.products.map(p=>({productId:uuid(`product:${p.slug}`),categoryId:actualCategories.get(p.category),isPrimary:true})),skipDuplicates:true});
      await tx.collection.createMany({data:[['featuredDeals','Sản phẩm nổi bật'],['upgradeProducts','Nâng cấp cấu hình']].map(([code,title])=>({id:uuid(`collection:${code}`),slug:slug(code),title,status:'ACTIVE'})),skipDuplicates:true});
      await tx.collectionProduct.createMany({data:['featuredDeals','upgradeProducts'].flatMap(code=>presentation[code].map((id,i)=>({collectionId:uuid(`collection:${code}`),productId:uuid(`product:${id}`),sortOrder:i}))),skipDuplicates:true});
      const variants=data.products.flatMap(p=>p.variants.map((v,i)=>({id:uuid(`variant:${v.id}`),productId:uuid(`product:${p.slug}`),sku:`DEMO-${v.id}`.slice(0,100),name:v.label,status:'ACTIVE',optionSignature:i===0?'default':`demo:${v.id}`})));
      // Nhiều SKU có lựa chọn thật; không giả option signature khi publish.
      const multi=data.products.filter(p=>p.variants.length>1);
      await tx.productOption.createMany({data:multi.map(p=>({id:uuid(`option:${p.id}`),productId:uuid(`product:${p.slug}`),code:'edition',name:'Phiên bản',sortOrder:0})),skipDuplicates:true});
      await tx.productOptionValue.createMany({data:multi.flatMap(p=>p.variants.map((v,i)=>({id:uuid(`option-value:${v.id}`),optionId:uuid(`option:${p.id}`),code:`edition-${i}`,label:v.label,sortOrder:i}))),skipDuplicates:true});
      for(const p of multi)for(const v of p.variants)variants.find(row=>row.id===uuid(`variant:${v.id}`)).optionSignature=uuid(`option-value:${v.id}`);
      await tx.productVariant.createMany({data:variants,skipDuplicates:true});
      await tx.variantOptionValue.createMany({data:multi.flatMap(p=>p.variants.map(v=>({variantId:uuid(`variant:${v.id}`),optionId:uuid(`option:${p.id}`),valueId:uuid(`option-value:${v.id}`)}))),skipDuplicates:true});
      await tx.variantPrice.createMany({data:data.products.flatMap(p=>p.variants.map(v=>({id:uuid(`price:${v.id}`),variantId:uuid(`variant:${v.id}`),currencyCode:'VND',amount:BigInt(v.price),compareAtAmount:BigInt(p.oldPrice)>=BigInt(v.price)?BigInt(p.oldPrice):null}))),skipDuplicates:true});
      await tx.warehouse.createMany({data:[{id:warehouseId,code:'DEMO_MAIN',name:'Kho demo Rigforge',addressSnapshot:{address:'Kho kiểm thử, không phải địa chỉ giao dịch'},status:'ACTIVE'}],skipDuplicates:true});
      await tx.inventoryBalance.createMany({data:data.products.flatMap(p=>p.variants.map(v=>({id:uuid(`balance:${v.id}`),warehouseId,variantId:uuid(`variant:${v.id}`),onHand:v.stock}))),skipDuplicates:true});
      await tx.inventoryMovement.createMany({data:data.products.flatMap(p=>p.variants.filter(v=>v.stock>0).map(v=>({id:uuid(`opening:${v.id}`),balanceId:uuid(`balance:${v.id}`),onHandDelta:v.stock,reservedDelta:0,unavailableDelta:0,kind:'OPENING',operationKey:`demo:opening:${v.id}`,sourceType:'DEMO_SEED',sourceId:uuid(`variant:${v.id}`),reason:'Số dư mở đầu dữ liệu demo',actorId:editorId,occurredAt:now}))),skipDuplicates:true});
      await tx.productMedia.createMany({data:data.products.map(p=>({id:uuid(`product-media:${p.id}`),productId:uuid(`product:${p.slug}`),assetId:productAssets.get(p.id),sortOrder:0,isPrimary:true,altText:`Ảnh minh họa ${p.name}`})),skipDuplicates:true});
      await tx.attributeDefinition.createMany({data:attributes.map(([code,dataType])=>({id:uuid(`attribute:${code}`),code:`store_${code}`,name:code,dataType,isFilterable:false})),skipDuplicates:true});
      const values=[];
      for(const p of data.products){
        const attrs={display_specs:p.specs.join('\n'),warranty:p.warranty,builder_eligible:p.builderEligible,...p.technical,...(p.badge?{badge:p.badge}:{})};
        for(const [code,value] of Object.entries(attrs)){
          const kind=attributes.find(([key])=>key===code)?.[1];if(!kind)continue;
          values.push({id:uuid(`attribute-value:${p.id}:${code}`),productId:uuid(`product:${p.slug}`),attributeId:uuid(`attribute:${code}`),...(kind==='TEXT'?{textValue:String(value)}:kind==='BOOLEAN'?{booleanValue:Boolean(value)}:{numberValue:String(value)})});
        }
      }
      await tx.productAttributeValue.createMany({data:values,skipDuplicates:true});
      await tx.article.createMany({data:data.articles.map(a=>({id:uuid(`article:${a.id}`),slug:a.id,title:a.title,excerpt:a.content.slice(0,180),body:{tag:a.tag,paragraphs:[a.content]},authorId:editorId,coverAssetId:productAssets.get(data.products.find(p=>p.category==='pc').id),status:'PUBLISHED',publishedAt:now})),skipDuplicates:true});
      presentation.informationPages.privacy.paragraphs=['Tài khoản, địa chỉ, giỏ hàng và đơn được lưu tại backend PostgreSQL. Mật khẩu được hash; refresh token nằm trong HttpOnly cookie.','Đây là môi trường development. Chỉ dùng dữ liệu cá nhân giả để thử nghiệm.'];
      presentation.informationPages.shipping.paragraphs=['Phí giao tiêu chuẩn 30.000₫, miễn phí từ 5.000.000₫; giao nhanh cộng thêm 20.000₫ sau phí tiêu chuẩn/miễn phí. Backend tính lại giá và phí khi xác nhận đơn.','COD được ghi nhận là chưa thanh toán. Stripe test chỉ bật sau khi hoàn thiện cấu hình webhook và xử lý chữ ký; không xác nhận thanh toán từ URL chuyển hướng.'];
      await tx.contentPage.createMany({data:Object.entries(presentation.informationPages).map(([page,value])=>({id:uuid(`page:${page}`),slug:page,title:value.title,body:{paragraphs:value.paragraphs},authorId:editorId,status:'PUBLISHED',publishedAt:now})),skipDuplicates:true});
      await tx.promotion.createMany({data:[{id:uuid('welcome-promotion'),code:'RIGFORGE5',name:'Ưu đãi demo 5%',type:'PERCENT',percentBps:500,currencyCode:'VND',minSubtotal:0n,startsAt:new Date('2020-01-01'),endsAt:new Date('2035-01-01'),priority:0,stackingGroup:'WELCOME',status:'ACTIVE',globalLimit:1000,perUserLimit:1}],skipDuplicates:true});
      await tx.coupon.createMany({data:[{id:uuid('welcome-coupon'),promotionId:uuid('welcome-promotion'),code:'RIGFORGE5',status:'ACTIVE'}],skipDuplicates:true});
      await tx.storeSetting.upsert({where:{key:'storefront.presentation'},create:{id:uuid('presentation'),key:'storefront.presentation',value:{...presentation,categories:data.categories,shipping:{standard:'30000',express:'50000',freeAbove:'5000000'},paymentMethods:['COD']},schemaVersion:1,changedBy:editorId,description:'Nội dung hiển thị development; giá và tồn lấy từ SKU/balance'},update:{}});
      await tx.auditLog.create({data:{actorType:'SYSTEM',action:'STOREFRONT_DEMO_SEED',entityType:'STORE',entityId:'rigforge-demo-v1',afterRedacted:{products:data.products.length,variants:variants.length}}});
    },{maxWait:15000,timeout:120000});
    console.log(JSON.stringify({seed:'storefront',products:data.products.length,categories:data.categories.length,articles:data.articles.length,preservedExistingData:true,providerCalls:0}));
  }finally{await prisma.$disconnect();}
}
main().catch(error=>{console.error(JSON.stringify({event:'storefront_seed_failed',code:error.code||error.name,model:error.meta?.modelName,kind:error.meta?.driverAdapterError?.cause?.kind,constraint:error.meta?.driverAdapterError?.cause?.constraint?.name,message:error.code?'Database seed failed; credentials omitted':error.message}));process.exitCode=1;});
