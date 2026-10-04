'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167007,'Capture/Dungeon coupling preaudit must inspect the current verified Phase 9 runtime');
assert.equal(blob,'9eff1bfddc9e4fab82f7a181eb9996ecce9c6ae4','Capture/Dungeon coupling preaudit must inspect the exact verified Phase 9 runtime blob');

function block(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+id);
  const bodyStart=start+marker.length;
  const end=index.indexOf('</script>',bodyStart);
  assert.ok(end>bodyStart,'unterminated '+id);
  return index.slice(bodyStart,end);
}

function fn(name){
  const marker='function '+name+'(';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const open=index.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,comment=false;
  for(let i=open;i<index.length;i++){
    const c=index[i],n=index[i+1]||'';
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
    if(c==='}'&&--depth===0)return index.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const isDungeon=fn('isDungeonMode');
const normalize=fn('normalizeGameParticipants');
const available=fn('availableParticipantHeroIds');
const c138=block('captureFix138');
const c139=block('captureFix139');
const c151=block('gensStability151');
const seed=block('builtinMonsterCapture162');

assert.match(captureEntry,/function isProfile\(profile\)/);
assert.doesNotMatch(captureEntry,/gameStyle|isDungeonMode|ensureDungeonContent|DungeonCore|DungeonSpatial/,
  'canonical Capture identity must remain pure and Dungeon-independent');

assert.match(isDungeon,/return p\?\.gameStyle==="dungeon"/,
  'historical Dungeon identity helper is intentionally unchanged in this preaudit');
assert.ok((index.match(/\bisDungeonMode\s*\(\s*\)/g)||[]).length>=120,
  'preaudit expects substantial historical isDungeonMode usage to remain before selecting one seam');

assert.match(seed,/"gameStyle":"dungeon"/,
  'built-in Capture still carries historical Dungeon style and must be treated as migration debt');
assert.match(seed,/"profile":"creature"/);
assert.match(seed,/"capture":true/);
assert.match(seed,/"controllableCreatures":true/);

assert.match(normalize,/GensCaptureV1\.isProfile\(getActiveGameProfile\(\)\)/,
  'participant normalization must remain explicitly Capture-aware');
assert.match(available,/!capture && isDungeonMode\(\) && typeof ensureDungeonContent==="function"\)ensureDungeonContent\(\)/,
  'participant hydration must remain Dungeon-only after the previous GREEN seam');

assert.match(c138,/GensCaptureV1/);
assert.match(c151,/GensCaptureV1/);
assert.doesNotMatch(c139,/ensureBaseGameProfile\(\)/,
  'Capture139 must remain decoupled from Base/Dungeon profile preparation after the dedicated retirement seam');
assert.doesNotMatch(c139,/saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY/,
  'Capture139 active-enemy dependency must remain retired after the dedicated Phase 9 seam');

const inlineBlocks=[];
const re=/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi;
let m;
while((m=re.exec(index)))inlineBlocks.push({id:m[1],body:m[2]});

const captureDungeonIdentityBlocks=inlineBlocks
  .filter(x=>/capture/i.test(x.id+' '+x.body))
  .filter(x=>/\bisDungeonMode\s*\(|gameStyle\s*={2,3}\s*["']dungeon["']|gameStyle["']?\s*:\s*["']dungeon["']/.test(x.body))
  .map(x=>x.id);

const captureDungeonServiceBlocks=inlineBlocks
  .filter(x=>/capture/i.test(x.id+' '+x.body))
  .filter(x=>/ensureDungeonContent|updateDungeonExploreButtons|saveActiveEnemies|ensureBaseGameProfile|Dungeon[A-Z]/.test(x.body))
  .map(x=>x.id);

function contexts(body){
  const out=[];
  const re=/isDungeonMode\s*\(\s*\)|gameStyle\s*={2,3}\s*["']dungeon["']|gameStyle["']?\s*:\s*["']dungeon["']/g;
  let m;
  while((m=re.exec(body))&&out.length<4){
    out.push(body.slice(Math.max(0,m.index-150),Math.min(body.length,m.index+m[0].length+180))
      .replace(/\s+/g,' ').trim());
  }
  return out;
}

const residualIdentityContexts=Object.fromEntries(
  captureDungeonIdentityBlocks.map(id=>{
    const found=inlineBlocks.find(x=>x.id===id);
    return [id,contexts(found?.body||'')];
  })
);

function serviceContexts(body){
  const out=[];
  const re=/ensureBaseGameProfile\s*\(|saveActiveEnemies\s*\(|updateDungeonExploreButtons\s*\(|ensureDungeonContent\s*\(|Dungeon[A-Z][A-Za-z0-9_]*/g;
  let m;
  while((m=re.exec(body))&&out.length<8){
    out.push({
      token:m[0].replace(/\s+/g,' '),
      context:body.slice(Math.max(0,m.index-150),Math.min(body.length,m.index+m[0].length+190))
        .replace(/\s+/g,' ').trim()
    });
  }
  return out;
}

const serviceDetailBlockIds=[
  'captureFix137',
  'captureFix138',
  'captureFix139',
  'coreCombatPoolFix156',
  'dungeonCore200StableCapture',
  'dungeonCore212RenderVictory'
];

const residualServiceContexts=Object.fromEntries(
  serviceDetailBlockIds.map(id=>{
    const found=inlineBlocks.find(x=>x.id===id);
    return [id,serviceContexts(found?.body||'')];
  })
);

assert.ok(captureDungeonIdentityBlocks.length>0,
  'preaudit must expose at least one remaining Capture block carrying Dungeon identity debt');
assert.ok(captureDungeonServiceBlocks.length>0,
  'preaudit must expose at least one remaining Capture block touching historical Dungeon/shared seams');

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_phase2_full_composition_capture_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain available for the future coupling seam');
}

console.log(JSON.stringify({
  scenario:'Phase 9 Capture / Dungeon identity coupling preaudit',
  rule26:{bytes:bytes.length,blob},
  identity:{
    canonicalCapture:'GensCaptureV1.isProfile(profile)',
    captureSeedStillDungeonStyle:true,
    isDungeonModeCalls:(index.match(/\bisDungeonMode\s*\(\s*\)/g)||[]).length
  },
  alreadyDecoupled:{
    publicIdentity:true,
    participantNormalization:true,
    participantDungeonHydration:false
  },
  residual:{
    captureDungeonIdentityBlocks,
    captureDungeonServiceBlocks,
    capture139:{
      ensureBaseGameProfile:false,
      saveActiveEnemiesReset:false
    },
    residualIdentityContexts,
    residualServiceContexts
  },
  decision:'diagnostic only; select exactly one next seam after reviewing this inventory',
  runtimeChanged:false
},null,2));
