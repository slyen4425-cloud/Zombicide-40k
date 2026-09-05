import fs from 'node:fs';
import { chromium } from 'playwright';
const report=[];const add=(s='')=>report.push(String(s));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
const errors=[];
page.on('pageerror',e=>errors.push('PAGEERROR: '+(e?.stack||e?.message||e)));
page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push('CONSOLE '+m.type()+': '+m.text())});
await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
add('# HOME UI REAL BROWSER PROBE');
add('url='+page.url());
add('title='+await page.title());
const state=await page.evaluate(()=>{
 const ids=['gensRootHome','gensFamilyHome','gensGameHome','drc300Modal','drc100Modal','effectModal','dc032GameOver','dc036AiPopup'];
 const displays={};for(const id of ids){const e=document.getElementById(id);if(e){const cs=getComputedStyle(e);displays[id]={display:cs.display,visibility:cs.visibility,pointerEvents:cs.pointerEvents,zIndex:cs.zIndex,classes:e.className}}}
 const btn=document.querySelector('button.gensRootModeCard.adventure');let hit=null,rect=null;
 if(btn){const r=btn.getBoundingClientRect();rect={x:r.x,y:r.y,w:r.width,h:r.height};const x=r.left+r.width/2,y=r.top+r.height/2;const el=document.elementFromPoint(x,y);hit=el?{tag:el.tagName,id:el.id,cls:el.className,text:(el.textContent||'').trim().slice(0,120)}:null}
 return {ready:document.readyState,hasOpenGensFamily:typeof window.openGensFamily,hasSettings:typeof window.z40kOpenSettings,displays,rect,hit,bodyClass:document.body.className};
});
add('initial='+JSON.stringify(state,null,2));
try{
 const direct=await page.evaluate(()=>{try{openGensFamily('adventure');return {ok:true,root:getComputedStyle(document.getElementById('gensRootHome')).display,family:getComputedStyle(document.getElementById('gensFamilyHome')).display,selected:window.gensSelectedFamily}}catch(e){return {ok:false,error:String(e?.stack||e)}}});
 add('direct openGensFamily='+JSON.stringify(direct,null,2));
}catch(e){add('direct evaluate FAILED='+e.stack)}
await page.evaluate(()=>{try{showGensRootHome()}catch(e){}});await page.waitForTimeout(100);
try{
 await page.locator('button.gensRootModeCard.adventure').click({timeout:5000});
 add('real click adventure=OK');
}catch(e){add('real click adventure=FAILED\n'+(e?.message||e));}
const after=await page.evaluate(()=>({root:getComputedStyle(document.getElementById('gensRootHome')).display,family:getComputedStyle(document.getElementById('gensFamilyHome')).display,game:getComputedStyle(document.getElementById('gensGameHome')).display,familyTitle:document.getElementById('gensFamilyTitle')?.textContent,familyGames:(document.getElementById('gensFamilyGames')?.textContent||'').trim().slice(0,500)}));
add('after click='+JSON.stringify(after,null,2));
add('\n# JS ERRORS / WARNINGS');for(const e of errors)add(e);if(!errors.length)add('none');
await page.screenshot({path:'diagnostics/home-ui-browser.png',fullPage:true});
fs.mkdirSync('diagnostics',{recursive:true});fs.writeFileSync('diagnostics/home-ui-browser-report.txt',report.join('\n'));
await browser.close();
console.log(report.join('\n'));
