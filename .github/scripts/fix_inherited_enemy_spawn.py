from pathlib import Path

zone=Path('assets/dungeon/dungeon-zone-content-167824.js')
s=zone.read_text(encoding='utf-8')
old='function currentContext(){const x=readRuntime();if(!x?.last?.worldRuntime167823)return null;const dungeonId=String(x.last.worldDungeonId||""),nodeId=String(x.last.worldNodeId||"");if(!dungeonId||!nodeId)return null;return {x,dungeonId,nodeId,content:getZoneContent(dungeonId,nodeId),hero:activeHeroId(x),state:stateFor(x,dungeonId,nodeId)}}'
new='function currentContext(){const x=readRuntime();if(!x?.last?.worldRuntime167823)return null;const dungeonId=String(x.last.worldDungeonId||""),nodeId=String(x.last.worldNodeId||"");if(!dungeonId||!nodeId)return null;let content=getZoneContent(dungeonId,nodeId);if(content.mode==="inherit"&&x.last?.worldZoneContent167824?.mode&&x.last.worldZoneContent167824.mode!=="inherit")content=normalizeContent(x.last.worldZoneContent167824);return {x,dungeonId,nodeId,content,hero:activeHeroId(x),state:stateFor(x,dungeonId,nodeId)}}'
if old not in s: raise SystemExit('currentContext marker not found')
s=s.replace(old,new,1)
zone.write_text(s,encoding='utf-8')

runtime=Path('assets/dungeon/dungeon-authored-runtime-167839.js')
s=runtime.read_text(encoding='utf-8')
old='function applyContent(g,pack){effectiveContent(g,pack.node,pack.room);try{return !!zoneApi()?.applyCurrentZone?.()}catch(e){console.warn("Authored Dungeon content",e);return false}}'
new='function applyContent(g,pack){const content=effectiveContent(g,pack.node,pack.room),x=readRt();if(x?.last){x.last.worldZoneContent167824=clone(content);writeRt(x)}try{return !!zoneApi()?.applyCurrentZone?.()}catch(e){console.warn("Authored Dungeon content",e);return false}}'
if old not in s: raise SystemExit('applyContent marker not found')
s=s.replace(old,new,1)
runtime.write_text(s,encoding='utf-8')

test=Path('tests/dungeon_zone_content_v167824.test.cjs')
t=test.read_text(encoding='utf-8')
marker="assert.ok(enemies.some(e=>e.enemyId==='dng_ghoul'),'mixed mode must add configured enemy');\n"
extra=marker+"\nx=JSON.parse(store.getItem(RT));x.last.worldContentApplied167824=null;x.last.worldZoneContent167824={mode:'fixed',enemies:[{id:'inh',enemyId:'dng_wraith',qty:2,cell:3}],chests:[{id:'inhch',cell:5,rarity:'common',gold:1,items:[]}],traps:[],puzzles:[],npcs:[],items:[]};store.setItem(RT,JSON.stringify(x));api.saveZoneContent('d1','n1',{mode:'inherit'});assert.equal(api.applyCurrentZone({force:true}),true,'an inherited authored zone must apply the effective room template content');x=JSON.parse(store.getItem(RT));assert.equal(enemies.filter(e=>e.enemyId==='dng_wraith').length,2,'inherited authored enemies must be instantiated');assert.equal(x.last.map.cells[5],'chest','inherited authored chest marker must remain available to interactions');assert.equal(api.openChest('inhch'),true,'inherited authored chest must use the same effective content as enemy spawning');\n"
if marker not in t: raise SystemExit('zone test marker not found')
t=t.replace(marker,extra,1)
test.write_text(t,encoding='utf-8')
