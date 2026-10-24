'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');

function extractFunction(source,name){
  const token='function '+name+'(';
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing function '+name);
  const openParen=source.indexOf('(',start);
  let paren=0,quote=null,escaped=false,line=false,block=false,close=-1;
  for(let i=openParen;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='(')paren++;
    else if(c===')'&&--paren===0){close=i;break}
  }
  const brace=source.indexOf('{',close);
  let depth=0;quote=null;escaped=false;line=false;block=false;
  for(let i=brace;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

const hookAll=extractFunction(src,'hookAll');
const hook=extractFunction(src,'hook');
const loadRuntimeBridges=extractFunction(src,'loadRuntimeBridges');

assert.doesNotMatch(
  hookAll,
  /["']openEquipmentEditor["']/,
  'Hero Art Repair must retire its unrelated openEquipmentEditor hook'
);

for(const name of [
  'ensureDungeonHeroes',
  'renderParticipantSelector',
  'renderMenu',
  'openHeroCreator',
  'hcRenderRpgStatsUsage'
]){
  assert.match(hookAll,new RegExp('["\\\']'+name+'["\\\']'),name+' Hero Art lifecycle hook must remain');
}

assert.match(hook,/repairDefs\(\)/,'remaining Hero Art hooks must still repair built-in definitions');
assert.match(hook,/schedule\(\)/,'remaining Hero Art hooks must still schedule visual repair');
assert.match(loadRuntimeBridges,/HERO_EDITOR_SRC/,'Hero Editor Dynamic bridge load must remain');
assert.match(loadRuntimeBridges,/EQUIPMENT_CLEANUP_SRC/,'Equipment Cleanup bridge load must remain');
assert.match(src,/GensDungeonHeroArtRepair167874=/,'Hero Art Repair API must remain exported');

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment Hero Art open hook authority',
  openEquipmentEditorHook:false,
  retainedHeroArtHooks:[
    'ensureDungeonHeroes',
    'renderParticipantSelector',
    'renderMenu',
    'openHeroCreator',
    'hcRenderRpgStatsUsage'
  ],
  runtimeBridgeLoading:true
},null,2));
