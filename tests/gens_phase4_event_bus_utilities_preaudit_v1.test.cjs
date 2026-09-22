const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const bytes=rel=>fs.readFileSync(path.join(root,rel));
const count=(src,re)=>(src.match(re)||[]).length;
const gitBlobSha=data=>crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+data.length+'\0'),
  data
])).digest('hex');

const indexBytes=bytes('index.html');
const index=indexBytes.toString('utf8');
const tacticalBridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const tacticalUi=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const roomVisual=read('assets/dungeon/dungeon-room-visual-hotfix-167827.js');
const worker=read('service-worker.js');
const worldBuilder=read('assets/dungeon/dungeon-world-builder-167821.js');
const roomCreator=read('assets/dungeon/dungeon-room-creator-100.js');
const statsUi=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');

assert.equal(indexBytes.length,8174648,'Event Bus preaudit must stay on the exact protected index size');
assert.equal(gitBlobSha(indexBytes),'2d7677950f04e9a3290ff0062e157a126123891d','Event Bus preaudit must stay on the exact protected index blob');

// Local Dungeon business notification: one semantic name, two completion emitters,
// one timeline consumer. This is not evidence of a generic app-wide bus.
assert.equal(count(index,/new\s+CustomEvent\(["']gensrpg:enemy-attack-resolved["']/g),2,
  'Dungeon enemy-attack completion emitter count drifted');
assert.equal(count(index,/addEventListener\(["']gensrpg:enemy-attack-resolved["']/g),1,
  'Dungeon enemy-attack completion listener count drifted');
assert.match(index,/function\s+closeSpecialRoll\s*\([\s\S]*?gensrpg:enemy-attack-resolved/,
  'closeSpecialRoll must remain one completion emitter');
assert.match(index,/function\s+dungeonConfirmPendingHeroDamage\s*\([\s\S]*?gensrpg:enemy-attack-resolved/,
  'damage confirmation must remain the second completion emitter');
assert.match(index,/function\s+completeAi\s*\([\s\S]*?addEventListener\(["']gensrpg:enemy-attack-resolved["']/,
  'Core 3.03 timeline must remain the current consumer');

// Existing online synchronisation is a Supabase transport, not a Core Event Bus.
assert.match(index,/async\s+function\s+z40kBroadcastEvent\s*\(type,payload\)/,
  'shared online event broadcaster missing');
assert.match(index,/from\(['"]z40k_sync_state['"]\)\.upsert\(/,
  'shared online event broadcaster must remain backed by Supabase state transport');
assert.match(index,/async\s+function\s+z40kSubscribe\s*\(\)/,
  'shared online subscription owner missing');
assert.match(index,/\.on\(['"]postgres_changes['"]/,
  'shared online subscription must remain a Supabase postgres_changes transport');
assert.match(index,/z40kHandleSharedEvent\(row\.state_value\)/,
  'shared online event transport must keep its current receiver');

const sharedTypes=[...index.matchAll(/z40kBroadcastEvent\s*\(\s*["']([^"']+)["']/g)].map(m=>m[1]);
assert.deepEqual([...new Set(sharedTypes)].sort(),[
  'armor_roll','attack_roll','popup_close','special_effect','special_roll','turn_popup','zombie_wave'
],'shared online event-type inventory drifted');

// Tactical exposes explicit lifecycle notifications but still owns its local completion callback.
assert.equal(count(tacticalBridge,/new\s+CustomEvent\(/g),2,
  'Tactical public lifecycle event count drifted');
assert.match(tacticalBridge,/gensrpg:tactical-combat-ready/,'Tactical ready notification missing');
assert.match(tacticalBridge,/gensrpg:tactical-combat-finished/,'Tactical finished notification missing');
assert.match(tacticalBridge,/onFinish:\s*\(\{battle,summary\}/,
  'Tactical bridge must keep its explicit local finish callback seam');
assert.match(tacticalUi,/options\?\.onFinish/,'Tactical UI onFinish callback seam missing');
assert.match(tacticalUi,/options\?\.onCancel/,'Tactical UI onCancel callback seam missing');

// Native DOM/PWA events are separate categories, never app-business bus messages.
assert.match(roomVisual,/dispatchEvent\?\.\(new\s+Event\(["']change["'],\{bubbles:true\}\)\)/,
  'Room visual synthetic native change event characterization drifted');
for(const eventName of ['install','activate','message','fetch']){
  assert.match(worker,new RegExp('addEventListener\\(["\\\']'+eventName+'["\\\']'),
    'service-worker native '+eventName+' event missing');
}

// A first safe common-utility candidate exists: identical pure HTML escaping is
// duplicated across active owners. This test only characterizes that duplication.
const escNeedle='.replace(/[&<>"\\\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"';
assert.ok(worldBuilder.includes(escNeedle),'World Builder HTML escape helper drifted');
assert.ok(roomCreator.includes(escNeedle),'Room Creator HTML escape helper drifted');
assert.ok(statsUi.includes(escNeedle),'Stats UI HTML escape helper drifted');

// The preaudit must not itself create a bus implementation in the current runtime.
for(const rel of [
  'assets/gensrpg/core/dice-v1.js',
  'assets/gensrpg/core/progression-v1.js',
  'assets/gensrpg/core/stats-normalization-v1.js',
  'assets/gensrpg/core/stats-value-engine-v1.js',
  'assets/gensrpg/core/inventory-equipped-view-v1.js'
]){
  const src=read(rel);
  assert.doesNotMatch(src,/\b(?:CustomEvent|dispatchEvent|addEventListener|MutationObserver)\b/,
    rel+' must remain free of event/listener/observer infrastructure in this preaudit');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Event Bus / common utilities preaudit',
  protectedIndexBlob:'2d7677950f04e9a3290ff0062e157a126123891d',
  dungeonLocalCustomEvent:{
    name:'gensrpg:enemy-attack-resolved',
    emitters:2,
    listeners:1
  },
  onlineSharedEventTypes:[...new Set(sharedTypes)].sort(),
  tacticalLifecycleNotifications:[
    'gensrpg:tactical-combat-ready',
    'gensrpg:tactical-combat-finished'
  ],
  firstSafeUtilityCandidate:'pure HTML escaping contract only',
  runtimeModified:false
},null,2));
