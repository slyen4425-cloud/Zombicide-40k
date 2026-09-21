'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const ui=read('assets/dungeon/dungeon-equipment-ui.js');
const index=read('index.html');

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

assert.ok(index.includes('assets/dungeon/dungeon-core-316.js'),
  'production source must retain the canonical set-state seam owner');

assert.doesNotMatch(
  ui,
  /function\s+fallbackSetStates\s*\(/,
  'local Equipment UI fallbackSetStates must be retired'
);

const setStates=extractFunction(ui,'setStates');
assert.match(
  setStates,
  /dungeonSetStateFromItems316/,
  'Equipment UI must use the canonical set-state seam'
);
assert.doesNotMatch(
  setStates,
  /fallbackSetStates/,
  'Equipment UI setStates must not call a local set-state fallback'
);

const canonicalStates=[{
  setId:'leather',
  count:2,
  items:[{id:'head'},{id:'torso'}],
  activeThresholds:[{pieces:2,bonuses:{armor:2}}],
  bonuses:{armor:2}
}];
let canonicalCalls=0;
const ctx={
  ROOT:{
    dungeonSetStateFromItems316(items){
      canonicalCalls++;
      assert.deepEqual(Array.from(items,x=>x.id),['head','torso']);
      return canonicalStates;
    }
  },
  equippedItems(){return [{id:'default'}]},
  Array
};
vm.createContext(ctx);
vm.runInContext(setStates,ctx,{filename:'dungeon-equipment-ui#setStates'});

const explicit=vm.runInContext(`setStates([{id:'head'},{id:'torso'}])`,ctx);
assert.equal(canonicalCalls,1,'canonical set-state seam must execute exactly once');
assert.equal(explicit,canonicalStates,'canonical set-state result must be returned unchanged');

ctx.ROOT.dungeonSetStateFromItems316=undefined;
const missing=vm.runInContext(`setStates([{id:'head'}])`,ctx);
assert.deepEqual(Array.from(missing),[],
  'without canonical seam the UI must expose an empty view, not recalculate set state locally');

ctx.ROOT.dungeonSetStateFromItems316=()=>({bad:true});
const invalid=vm.runInContext(`setStates([{id:'head'}])`,ctx);
assert.deepEqual(Array.from(invalid),[],
  'invalid canonical seam output must produce an empty UI view');

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment set-state UI fallback retirement',
  canonicalSeam:'dungeonSetStateFromItems316',
  localFallbackRetired:true,
  canonicalCalls,
  seamMissingReturnsEmpty:true,
  invalidSeamReturnsEmpty:true,
  runtimeScope:'dungeon-equipment-ui only'
},null,2));
