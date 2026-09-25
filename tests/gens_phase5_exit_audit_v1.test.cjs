'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8169596,'Phase 5 exit audit must target the validated captureFix135 GREEN runtime');
assert.equal(gitBlob,'d451372389f29d0145d3f9689ca739128a0650e9',
  'Phase 5 exit audit runtime blob drifted');

const finalShell=read('assets/gensrpg/shell/module-launch-final-authority-v1.js');
assert.match(finalShell,/window\.startConfiguredGame\s*=\s*async\s+function/,
  'Shell final authority must own the public startConfiguredGame global');
assert.match(finalShell,/GensShellModuleLaunchV1/);
assert.match(finalShell,/activeModule\s*\(/);
assert.match(finalShell,/startModuleSession\s*\(/);
assert.doesNotMatch(finalShell,/oldStart|legacyStart|\.apply\s*\(|isCaptureContext|DungeonCore|localStorage|document\./i,
  'Shell public launch authority must stay routing-only with no legacy fallback');

assert.equal((index.match(/function\s+gensShellActiveModuleV1\s*\(/g)||[]).length,1,
  'Shell active-module resolver must remain unique');
assert.equal((index.match(/window\.GensShellModuleLaunchV1\s*=\s*Object\.freeze/g)||[]).length,1,
  'Shell module-launch public registry must remain unique');
assert.equal((index.match(/window\.GensShellScreenReturnV1\s*=\s*Object\.freeze/g)||[]).length,1,
  'Shell screen-return public registry must remain unique');

const nativeGo=index.match(/function goMenu\(\)\{[\s\S]*?\n\}/)?.[0]||'';
assert.match(nativeGo,/GensShellScreenReturnV1/,
  'native Shell goMenu must dispatch through the public screen-return registry');
assert.match(nativeGo,/returnToPrimaryView/,
  'native Shell goMenu must use the semantic returnToPrimaryView boundary');

const blocks=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));

function strictChain(name){
  const re=new RegExp('window\\.'+name+'\\s*=(?!=)','g');
  const out=[];
  for(const block of blocks){
    const count=[...block.body.matchAll(re)].length;
    for(let i=0;i<count;i++)out.push(block.id);
  }
  return out;
}

assert.deepEqual(strictChain('goMenu'),[],
  'Phase 5 screen-return work must leave zero inline global goMenu override');

const nativeOpen=index.match(/function openChar\(id\)\{[\s\S]*?\n\}/)?.[0]||'';
assert.match(nativeOpen,/document\.getElementById\("sheet"\)/,
  'native Shell openChar must own opening the shared hero sheet');
assert.match(nativeOpen,/render\(\)/,
  'native Shell openChar must own canonical sheet rendering');

const openCharChain=strictChain('openChar');
assert.deepEqual(openCharChain,[],
  'Phase 5 exit requires zero inline global openChar wrapper');

const capture139=blocks.find(x=>x.id==='captureFix139')?.body||'';
assert.ok(capture139,'Capture139 launch block must remain present');
assert.doesNotMatch(capture139,/const openChar139=window\.openChar/);
assert.doesNotMatch(capture139,/window\.openChar\s*=(?!=)/);
assert.doesNotMatch(capture139,/return openChar139\.apply\(this,arguments\)/);
assert.equal(blocks.some(x=>x.id==='dungeonCore028HeroExploreGuard'),false,
  'retired Dungeon Core 0.28 hero-sheet wrapper must stay absent');

const startChain=strictChain('startConfiguredGame');
assert.deepEqual(startChain,['captureFix138','captureFix139','gensDungeonCore01Js'],
  'historical startConfiguredGame chain must stay frozen during the exit audit');
assert.match(index,/GensShellModuleLaunchV1\.register\(["']capture["']/,
  'Capture public launch provider must remain registered');
assert.match(index,/GensShellModuleLaunchV1\.register\(["']dungeon["']/,
  'Dungeon public launch provider must remain registered');

const result={
  scenario:'Phase 5 exit audit',
  navigation:{
    publicLaunchOwner:'Shell final authority',
    activeModuleResolverCount:1,
    screenReturnGlobalOverrides:strictChain('goMenu'),
    historicalStartConfiguredGame:startChain
  },
  heroSheet:{
    nativeOwner:'function openChar(id)',
    remainingGlobalWrappers:openCharChain,
    blocker:null
  },
  phase5ExitReady:true,
  nextRequiredMicroLot:null
};

console.log(JSON.stringify(result,null,2));
