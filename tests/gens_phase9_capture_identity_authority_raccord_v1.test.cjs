'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/capture/entry-v1.js');

function block(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+id);
  const bodyStart=start+marker.length;
  const end=index.indexOf('</script>',bodyStart);
  assert.ok(end>bodyStart,'unterminated '+id);
  return index.slice(bodyStart,end);
}

function functionFrom(src,marker){
  const start=src.indexOf(marker);
  assert.ok(start>=0,'missing function '+marker);
  const open=src.indexOf('{',start);
  assert.ok(open>start,'missing body '+marker);
  let depth=0,quote=null,escaped=false,line=false,comment=false;
  for(let i=open;i<src.length;i++){
    const c=src[i],n=src[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(comment){if(c==='*'&&n==='/'){comment=false;i++}continue}
    if(quote){
      if(escaped){escaped=false;continue}
      if(c==='\\'){escaped=true;continue}
      if(c===quote)quote=null;
      continue;
    }
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){comment=true;i++;continue}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return src.slice(start,i+1);
  }
  assert.fail('unterminated '+marker);
}

assert.match(entry,/function\s+isProfile\s*\(\s*profile\s*\)/,
  'GensCaptureV1 must own the canonical pure Capture identity');
assert.match(entry,/GensCaptureV1=Object\.freeze\(\{[^}]*isProfile/,
  'public Capture API must expose isProfile');

const context={globalThis:{},console};
vm.createContext(context);
vm.runInContext(entry,context);
const api=context.globalThis.GensCaptureV1;
assert.equal(typeof api?.isProfile,'function');

const captureByPreset={rpgUniverse:{gameplay:{profile:'creature',modules:{capture:false,controllableCreatures:false}}}};
const captureByModules={rpgUniverse:{gameplay:{profile:'custom',modules:{capture:true,controllableCreatures:true}}}};
const dungeon={gameStyle:'dungeon',rpgUniverse:{gameplay:{profile:'classic',modules:{capture:false,controllableCreatures:false}}}};
const survival={gameStyle:'survival'};

assert.equal(api.isProfile(captureByPreset),true);
assert.equal(api.isProfile(captureByModules),true);
assert.equal(api.isProfile(dungeon),false);
assert.equal(api.isProfile(survival),false);

const identityFn=functionFrom(entry,'function isProfile');
assert.doesNotMatch(identityFn,/gameStyle|isDungeonMode|document\.|localStorage|sessionStorage|ensureRpgProfileData|setTimeout|MutationObserver/);

const captureGameplay=functionFrom(index,'function gensIsCaptureGameplay(');
const pregame=functionFrom(index,'function gensCapturePregameMode()');
const sheet=functionFrom(index,'function gensPureCaptureSheetMode()');
const shellActive=functionFrom(index,'function gensShellActiveModuleV1()');
const contentFamily=functionFrom(index,'function gensContentFamilyForProfile(');
const gameplayModules=functionFrom(index,'function gensGameplayModules()');
const dungeonMode=functionFrom(index,'function isDungeonMode()');
const c138=block('captureFix138');
const c151=block('gensStability151');

assert.match(captureGameplay,/GensCaptureV1\.isProfile\(profile\)/);
assert.doesNotMatch(captureGameplay,/gameStyle|ensureRpgProfileData/);

assert.match(pregame,/GensCaptureV1\.isProfile\(p\)/);
assert.doesNotMatch(pregame,/p\.gameStyle/);
assert.match(sheet,/GensCaptureV1\.isProfile\(p\)/);
assert.doesNotMatch(sheet,/p\.gameStyle/);

assert.match(shellActive,/GensCaptureV1\?\.isProfile\?\.\(profile\)|GensCaptureV1\.isProfile\(profile\)/);
const captureDecisionPos=Math.max(shellActive.indexOf('GensCaptureV1?.isProfile?.(profile)'),shellActive.indexOf('GensCaptureV1.isProfile(profile)'));
const dungeonDecisionPos=shellActive.indexOf('profile?.gameStyle==="dungeon"');
assert.ok(captureDecisionPos>=0&&dungeonDecisionPos>captureDecisionPos,
  'Shell must classify Capture before the remaining Dungeon branch');

assert.match(c151,/GensCaptureV1/);
assert.match(c151,/isProfile/);
assert.match(c138,/GensCaptureV1/);
assert.match(c138,/isProfile/);

assert.match(contentFamily,/GensCaptureV1/);
assert.match(contentFamily,/isProfile/);
assert.ok(
  contentFamily.indexOf('isProfile')<contentFamily.indexOf('profile.gameStyle!=="dungeon"'),
  'content family must recognize Capture before rejecting non-Dungeon profiles'
);

assert.match(gameplayModules,/GensCaptureV1/);
assert.match(gameplayModules,/isProfile/);

assert.match(dungeonMode,/return p\?\.gameStyle==="dungeon"/);
assert.doesNotMatch(dungeonMode,/GensCaptureV1|isProfile/,
  'isDungeonMode must remain untouched in the first identity authority seam');

console.log(JSON.stringify({
  scenario:'Phase 9 Capture canonical identity authority raccord',
  expected:'RED before GensCaptureV1.isProfile and boundary delegation; GREEN after minimal identity seam',
  owner:'GensCaptureV1.isProfile(profile)',
  dungeonModeChanged:false
},null,2));
