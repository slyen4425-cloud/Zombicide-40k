'use strict';
/*
 * Diagnostic only: browser parser checkpoints are inserted into a served
 * copy of certified R15 HTML; the original repository HTML and JS are untouched.
 * Do not treat a parser snapshot as proof of successful in-game combat.
 */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium,firefox}=require(process.env.GENSRPG_DIAG_PW_ROOT+'/node_modules/playwright');
const PAGE=process.env.GENSRPG_DIAG_URL||'http://127.0.0.1:8895/index.html';
const TARGETS=['renderDungeonCombatRound','dungeonRunAi156','dungeonAdvanceTurn156','dungeonMapHtml','openDungeonCombatVictoryPopup','generateDungeonMap','__dc214RenderCombat','__dc302RenderCombat'];
const SHA='9f35eb833a6ede4b91399854f19bb9bef59f45ab';
const html=fs.readFileSync('index.html','utf8');
const blob=s=>{const b=Buffer.from(s);return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')};
assert.equal(blob(html),SHA,'R15 GREEN source must remain byte-identical');
const tags=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
assert.equal(tags.length,152);
assert.equal(tags[107][1].includes('dungeonCore080FinalMapRenderer'),true);
assert.equal(tags[136][1].includes('dungeonCore303TimelineRootFix'),true);
assert.match(tags[136][2],/window\.renderDungeonCombatRound=render/);
assert.match(tags[136][2],/window\.dungeonRunAi156=function\(\)\{\}/);
assert.match(tags[136][2],/window\.dungeonAdvanceTurn156=function\(\)\{\}/);

const setup='<script id="gensrpgAuthorityAuditBootstrap">(function(){const keys='+JSON.stringify(TARGETS)+';const refs=new WeakMap();let next=1;const snaps=[];function capture(script){const seen={script,values:{}};for(const key of keys){let v=window[key];if(typeof v==="function"){if(!refs.has(v))refs.set(v,next++);seen.values[key]={type:"function",identity:refs.get(v),size:Function.prototype.toString.call(v).length};}else seen.values[key]={type:typeof v,identity:null,size:null}}snaps.push(seen)}window.__gensrpgAuthorityTrace={capture,snaps,keys};})()</script>';
let instrumented='',last=0;
for(let i=0;i<tags.length;i++){const t=tags[i];const end=t.index+t[0].length;instrumented+=html.slice(last,end);
 instrumented+='<script data-gen-audit-probe="'+i+'">window.__gensrpgAuthorityTrace.capture('+i+')</script>';
 last=end;
}
instrumented+=html.slice(last);
assert.ok(instrumented.includes('<head>'),'expected conventional HTML head');
instrumented=instrumented.replace('<head>','<head>'+setup);
assert.equal((instrumented.match(/data-gen-audit-probe=/g)||[]).length,152);
function sigFn(fn){return typeof fn==='function'?Function.prototype.toString.call(fn):typeof fn}
async function run(browser,label,probe){
 const context=await browser.newContext({locale:'fr-FR',viewport:{width:1300,height:840},serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(String(err.message).slice(0,240)));
 if(probe){await page.route('**/index.html',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:instrumented}));}
 try{
  await page.goto(PAGE,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(800);
  const out=await page.evaluate(targets=>{
   const names={};
   for(const key of targets){const fn=window[key]; names[key]={type:typeof fn,body:typeof fn==='function'?Function.prototype.toString.call(fn):null};}
   return {names,trace:window.__gensrpgAuthorityTrace?.snaps||[],flags:{tacticalRender:typeof window.__dc214RenderCombat,dungeonDebug:typeof window.dungeonDebug303},domReady:document.readyState};
  },TARGETS);
  if(probe){
   assert.equal(out.trace.length,152,label+' all original parser boundaries reached');
   assert.deepEqual(out.trace.map(s=>s.script),Array.from({length:152},(_,i)=>i),label+' stable parser order');
  }else assert.equal(out.trace.length,0,'unmodified baseline has no probes');
  return {out,errors:[...new Set(errors)].sort()};
 }finally{await context.close();}
}
(async()=>{
 for(const [name,kind] of [['Chromium',chromium],['Firefox',firefox]]){
  const browser=await kind.launch({headless:true,args:name==='Chromium'?['--disable-dev-shm-usage']:[]});
  try{
   const baseline=await run(browser,name,false);
   const observed=await run(browser,name,true);
   for(const key of TARGETS)assert.equal(observed.out.names[key].body,baseline.out.names[key].body,
    name+' probe must not alter final effective function '+key);
   const milestones=[51,58,60,61,63,64,65,68,69,73,74,79,84,89,90,91,92,93,94,100,107,132,136,151];
   const byName={};
   for(const key of TARGETS){
    const marks=observed.out.trace;
    const changes=marks.filter((s,i)=>i===0||JSON.stringify(s.values[key])!==JSON.stringify(marks[i-1].values[key]))
      .map(s=>({script:s.script,id:s.values[key].identity,type:s.values[key].type,size:s.values[key].size}));
    byName[key]={changes,finalType:observed.out.names[key].type,
      finalFunctionSize:observed.out.names[key].body?.length||0};
   }
   const map=byName.dungeonMapHtml.changes.map(s=>s.script);
   const rendered=byName.renderDungeonCombatRound.changes.map(s=>s.script);
   const ai=byName.dungeonRunAi156.changes.map(s=>s.script);
   const advance=byName.dungeonAdvanceTurn156.changes.map(s=>s.script);
   assert.ok(map.includes(107),name+' map final inline renderer must be observed');
   assert.ok(rendered.includes(136),name+' Core303 renderer ownership must be observed');
   assert.ok(ai.includes(136)&&advance.includes(136),name+' Core303 legacy AI retirement must be observed');
   assert.equal(observed.out.names.dungeonRunAi156.body.replace(/\s/g,''),'function(){}',name+' legacy AI disabled at loaded baseline');
   assert.equal(observed.out.names.dungeonAdvanceTurn156.body.replace(/\s/g,''),'function(){}',name+' legacy turn advancement disabled at loaded baseline');
   const out={browser:name,scriptsObserved:observed.out.trace.length,controlUnmodifiedHTML:true,flags:observed.out.flags,
    transitions:byName,runtimeErrorCount:baseline.errors.length,probedRuntimeErrorCount:observed.errors.length};
   console.log('GENSRPG_DUNGEON_TRACE '+JSON.stringify(out));
   console.log(name+' parser ownership / original HTML final identity comparison PASS');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error('DUNGEON AUTHORITY TRACE RED: '+(e.stack||e));process.exitCode=1});
