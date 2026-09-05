const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-exact-trap-runtime-167845.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const trap={id:'trap-rune',cell:6,trapType:'reference',refId:'dtrap_rune',label:'Rune explosive',once:true};
const runtime={participants:['hero'],index:0,room:1,positions:{hero:0},last:{authoredRuntime167839:true,worldRuntime167823:true,worldDungeonId:'world-1',worldNodeId:'zone-1',map:{cells:['entry','floor','floor','floor','trap','floor','trap','floor','exit']},worldZoneContent167824:{mode:'fixed',traps:[trap]}}};
const store=storage({[RT]:JSON.stringify(runtime)});
let scene=[
 {id:'manual',kind:'trap',room:1,cellIndex:2,trapId:'dart',detected:false},
 {id:'legacy-random',kind:'trap',room:1,cellIndex:4,trapId:'snare',detected:true,dc202:true}
],resolved=[];
const core={render(){return true},show(){return true},explore(){return true}};
const context={console,JSON,Math,Date,localStorage:store,setTimeout(){return 1},DungeonCore01:core,DungeonSpatial313:{ensure(){},persist(){}},
 loadDungeonSceneElements(){return JSON.parse(JSON.stringify(scene))},saveDungeonSceneElements(v){scene=JSON.parse(JSON.stringify(v))},
 dungeonTrapTypes(){return {dart:{id:'dart',name:'Salve'},snare:{id:'snare',name:'Entrave'},rune:{id:'rune',name:'Rune instable'},collapse:{id:'collapse',name:'Éboulement'}}},
 dungeonResolveTrapAgainstHero(id,hero,show){resolved.push({id,hero,show});return {ok:false}}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-exact-trap-runtime-167845.js'});
const api=context.DungeonExactTrapRuntime167845;assert.ok(api);assert.equal(api.normalizeTrapId('dtrap_rune'),'rune');
let x=JSON.parse(store.getItem(RT));assert.equal(x.last.map.cells[6],'floor','le marqueur trap brut doit être neutralisé pour bloquer le tirage aléatoire');assert.equal(x.last.map.cells[4],'floor','le marqueur du piège aléatoire legacy doit être retiré dans une salle construite');
let exact=scene.find(e=>e.exactTrap167845);assert.ok(exact,'un piège exact de scène doit être créé');assert.equal(exact.trapId,'rune');assert.equal(exact.detected,false,'le piège exact doit rester caché par défaut');assert.ok(scene.some(e=>e.id==='manual'),'un piège manuel étranger doit être conservé');assert.equal(scene.some(e=>e.id==='legacy-random'),false,'un piège aléatoire legacy dc202 doit être supprimé dans une salle construite');
exact.detected=true;context.saveDungeonSceneElements(scene);api.sync(JSON.parse(store.getItem(RT)));exact=scene.find(e=>e.exactTrap167845);assert.equal(exact.detected,true,'un piège révélé par le système de détection doit rester révélé après synchronisation');
x=JSON.parse(store.getItem(RT));x.positions.hero=6;x.last.map.cells[6]='trap';store.setItem(RT,JSON.stringify(x));core.render();
assert.deepEqual(resolved,[{id:'rune',hero:'hero',show:true}],'le contact doit déclencher exactement la référence configurée');x=JSON.parse(store.getItem(RT));assert.equal(x.last.map.cells[6],'floor');assert.equal(x.worldContentState167824['world-1']['zone-1'].triggeredTraps['trap-rune'],true);assert.equal(scene.some(e=>e.exactTrap167845),false,'le piège consommé ne doit plus pouvoir être détecté/réutilisé');assert.ok(scene.some(e=>e.id==='manual'));
resolved=[];core.render();assert.equal(resolved.length,0,'un piège déjà consommé ne doit pas se redéclencher');
console.log('Dungeon exact trap runtime V16.78.45: OK');
