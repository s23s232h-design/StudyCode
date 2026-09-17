import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {loadEnv} from 'vite';
import fs from 'node:fs';
const require=createRequire('C:/Users/case-/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=require('playwright');
const origin='http://127.0.0.1:5173';
const api=new URL(loadEnv('development',process.cwd()).VITE_SUPABASE_URL);
const me='00000000-0000-4000-8000-000000000001', other='00000000-0000-4000-8000-000000000002';
const avatar='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#ddd6fe"/><text x="48" y="62" text-anchor="middle" font-size="44" font-family="sans-serif" fill="#5b21b6">H</text></svg>');
const myProfile={id:me,username:'Haruka / フロントエンドを勉強中',avatar_url:avatar,introduction:'小さな学びを、毎日の積み重ねに。\nReactとWebアプリ開発を勉強しています。'};
const otherProfile={id:other,username:'Kenta',avatar_url:null,introduction:'JavaScriptを学習中です。'};
const created=offset=>new Date(Date.now()-offset*60000).toISOString();
const posts=[
 {id:1,user_id:me,profiles:myProfile,created_at:created(18),edited_at:created(10),term:'コンポーネント',explanation:'UIを独立した部品として分ける考え方。\n小さく分けると、見た目と役割が整理されて再利用しやすくなる。',likes:[{user_id:other}],reposts:[],quoted_post_id:null,deleted_at:null},
 {id:2,user_id:other,profiles:otherProfile,created_at:created(35),term:null,explanation:null,quote_comment:'具体例があると理解しやすい！\n自分のプロジェクトでも試してみたい。',quoted_post_id:1,likes:[],reposts:[{user_id:me,created_at:created(5),profiles:myProfile}],deleted_at:null},
 {id:3,user_id:me,profiles:myProfile,created_at:created(60),term:null,explanation:null,quote_comment:'元の投稿が消えても、この学びは残しておきたい。',quoted_post_id:4,likes:[],reposts:[],deleted_at:null},
 {id:4,user_id:other,profiles:otherProfile,created_at:created(120),term:null,explanation:null,likes:[],reposts:[],deleted_at:created(90)}
];
const replies=[{id:1,user_id:other,post_id:1,profiles:otherProfile,created_at:created(2),content:'役割ごとに分けると、コードも読みやすくなりますね。'}];
const user={id:me,aud:'authenticated',role:'authenticated',email:'preview@example.test',app_metadata:{},user_metadata:{},created_at:created(500)};
const token=['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',Buffer.from(JSON.stringify({sub:me,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url'),'preview-signature'].join('.');
const session={access_token:token,refresh_token:'preview-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
const browser=await chromium.launch({headless:true,channel:'msedge'});
const errors=[];
let checks=0;
const artifacts='C:/Users/case-/.codex/visualizations/2026/09/15/01a0a3d1-c790-7291-be51-bc17189a8971';
async function setup(signedIn=true) {
 const context=await browser.newContext({viewport:{width:1280,height:960},colorScheme:'light'});
 if(signedIn) await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${api.hostname.split('.')[0]}-auth-token`,session});
 await context.route('**/*',async route=>{
  const request=route.request(), url=new URL(request.url());
  if(url.origin===origin) return route.continue();
  if(url.origin!==api.origin) return route.abort();
  if(url.pathname==='/auth/v1/user') return route.fulfill({json:user});
  if(!url.pathname.startsWith('/rest/v1/')) return route.fulfill({status:400,json:{message:'Preview blocks external operations'}});
  const table=url.pathname.split('/').at(-1);
  if(request.method()!=='GET') return route.fulfill({status:400,json:{message:'Preview is read only'}});
  let data=[];
  if(table==='posts') data=posts;
  if(table==='profiles') data=[myProfile,otherProfile];
  if(table==='replies') data=replies;
  if(table==='materials') data=[{id:1,name:'JavaScriptの基礎'},{id:2,name:'React公式ドキュメント'}];
  if(table==='portfolios') data=[{id:1,title:'StudyCode',url:'https://example.test/studycode'}];
  if(table==='study_times') data=[{seconds:5430,study_date:new Date().toISOString().slice(0,10)}];
  const id=url.searchParams.get('id');
  if(id?.startsWith('eq.')) data=data.filter(row=>String(row.id)===id.slice(3));
  if(id?.startsWith('in.')) {const ids=id.slice(4,-1).split(',');data=data.filter(row=>ids.includes(String(row.id)));}
  const object=request.headers().accept?.includes('vnd.pgrst.object');
  return route.fulfill({json:object?(data[0]??null):data});
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 return {context,page};
}
async function noOverflow(page,label) {
 const result=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,8).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right}))}));
 assert.ok(result.scroll<=result.width+1,`${label}: ${JSON.stringify(result)}`);
 const nav=await page.locator('.main-nav-item').evaluateAll(elements=>elements.map(el=>({top:el.getBoundingClientRect().top,height:el.getBoundingClientRect().height})));
 assert.equal(nav.length,5);
 assert.ok(nav.every(item=>Math.abs(item.top-nav[0].top)<1),`${label} nav wraps`);
 checks++;
}
try {
 const {page,context}=await setup();
 for(const color of ['light','dark']) {
  await page.emulateMedia({colorScheme:color});
  for(const width of [600,320]) {
   await page.setViewportSize({width,height:800});
   for(const path of ['/search','/profile','/postpage','/timer']) {
    await page.goto(origin+path);
    await page.locator('.main-navigation').waitFor();
    await page.waitForTimeout(150);
    if(path==='/profile') await page.locator('.profile-overview').waitFor();
    await noOverflow(page,color+' '+width+' '+path);
    if(path==='/profile') {
     await page.getByRole('button',{name:'編集',exact:true}).click();
     await noOverflow(page,color+' '+width+' profile editor');
    }
    if(color==='light'&&width===320&&path==='/search') await page.screenshot({path:artifacts+'/final-polish-search-320.png',fullPage:true});
   }
  }
 }
 myProfile.username='HarukaVeryLongName'.repeat(20);
 myProfile.introduction='https://example.test/'+ 'verylongunbrokenpath'.repeat(40);
 await page.goto(origin+'/profile');
 await page.locator('.profile-overview').waitFor();
 await noOverflow(page,'long name and introduction');
 assert.equal(await page.locator('.account-name').evaluate(el=>getComputedStyle(el).textOverflow),'ellipsis');
 assert.equal(await page.locator('.account-name').evaluate(el=>el.scrollWidth>el.clientWidth),true);
 myProfile.username='';myProfile.introduction='';
 await page.goto(origin+'/profile');
 await page.locator('.profile-name').waitFor();
 assert.equal(await page.locator('.profile-name').innerText(),'ユーザー名未設定');
 posts.splice(0);
 await page.goto(origin+'/postpage');
 await page.getByText('まだ投稿がありません',{exact:true}).waitFor();
 await noOverflow(page,'empty own posts');
 await context.close();
 assert.deepEqual(errors,[]);
 console.log('PASS '+checks+' final mobile, dark mode, long text and empty-state checks');
} finally {await browser.close();}
