const assert=require('node:assert/strict');
const path=require('node:path');
const Repair=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-runtime-repair-1678106.js'));

const PROFILES_KEY='gensrpg_game_profiles_v1';
const ACTIVE_KEY='gensrpg_game_profile_active_v1';
const FAMILY_KEY='gensrpg_session_family_guard_v1';
const canonical={id:'game_profile_dungeon_demo',name:'Dungeon',builtIn:true,gameStyle:'dungeon'};
const duplicate={id:'gp_duplicate_dungeon_1',name:'Dungeon',builtIn:true,gameStyle:'dungeon'};
const custom={id:'gp_custom_dungeon',name:'Dungeon',builtIn:false,gameStyle:'dungeon'};
const capture={id:'gp_mt7ker7t_m2iw9',name:'Monster Capture',builtIn:true,gameStyle:'dungeon'};
const survival={id:'gp_survival',name:'Survie',builtIn:true,gameStyle:'survival'};
const store=new Map([
  [PROFILES_KEY,JSON.stringify([canonical,duplicate,custom,capture,survival])],
  [ACTIVE_KEY,duplicate.id],
  [FAMILY_KEY,'adventure']
]);
let saved=null,legacyRenders=0,opened=0,closed=0,battle=null,rerenders=0;
const host={innerHTML:''};
const modal={style:{display:'block'},classList:{remove(){}}};
const rt={
  console,
  localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))},
  getActiveGameProfile:()=>canonical,
  renderGensFamilyGamesIfVisible(){rerenders++},
  saveGameProfiles(list){saved=list;store.set(PROFILES_KEY,JSON.stringify(list));return true},
  document:{body:{style:{overflow:'hidden'}},getElementById:id=>id==='dungeonCombatSetupView'?host:id==='dungeonCombatModal'?modal:null},
  closeDungeonCombat(){closed++;host.innerHTML='';},
  GensRpgTacticalCombatV2Bridge:{
    currentBattle:()=>battle,
    openCurrent(_runtime,opts){opened++;battle={id:'battle-'+opened,opts};return {ok:true,battle}}
  },
  GensRpgTacticalCombatV2Ui:{getBattle:()=>battle},
  GensRpgTacticalCombatV2Adapter:{},
  __dc302RenderCombat(){legacyRenders++;return 'legacy-302'},
  __dc214RenderCombat(){legacyRenders++;return 'legacy-214'},
  __dc200StableRenderCombatRound(){legacyRenders++;return 'legacy-stable'},
  renderDungeonCombatRound(){legacyRenders++;return 'legacy-round'}
};

assert.equal(Repair.APP_VERSION,'16.78.106');
assert.equal(Repair.install(rt),true);
assert.equal(rt.GENS_RPG_REAL_TACTICAL_ROUTE_VERSION,'16.78.106');

// Existing corrupted storage is repaired once, but legitimate Dungeon-style universes remain.
const repaired=JSON.parse(store.get(PROFILES_KEY));
assert.equal(repaired.filter(p=>p.builtIn&&p.gameStyle==='dungeon'&&p.name==='Dungeon').length,1);
assert.ok(repaired.some(p=>p.id===canonical.id));
assert.ok(repaired.some(p=>p.id===custom.id),'user-created Dungeon universe must not be removed');
assert.ok(repaired.some(p=>p.id===capture.id),'Monster Capture must not be removed');
assert.equal(store.get(ACTIVE_KEY),canonical.id,'active duplicate must be redirected to canonical Dungeon');
assert.equal(rerenders,1);

// The actual renderer seam reached by the closure-local Runtime 2.00 launch is intercepted.
const first=rt.__dc302RenderCombat();
assert.equal(first.id,'battle-1');
assert.equal(opened,1);
assert.equal(legacyRenders,0,'legacy renderer must not run in RPG/Dungeon');
assert.equal(closed,1,'legacy modal/state must be closed after tactical handoff');
assert.match(host.innerHTML,/data-gens-tactical-v2-route="16\.78\.106"/,'legacy host must stay non-empty so Runtime 2.00 accepts the handoff');

// Subsequent legacy render attempts while V2 is open remain swallowed.
rt.__dc302RenderCombat();
assert.equal(opened,1);
assert.equal(legacyRenders,0);
assert.equal(closed,2);

// Future profile saves are sanitized too.
rt.saveGameProfiles([canonical,{...duplicate,id:'gp_duplicate_dungeon_2'},custom,capture]);
assert.equal(saved.filter(p=>p.builtIn&&p.gameStyle==='dungeon'&&p.name==='Dungeon').length,1);
assert.ok(saved.some(p=>p.id===custom.id));
assert.ok(saved.some(p=>p.id===capture.id));

// Explicit Survival family always keeps the native renderer, even with stale Dungeon profile data.
store.set(FAMILY_KEY,'survival');
battle=null;
const nativeResult=rt.__dc302RenderCombat();
assert.equal(nativeResult,'legacy-302');
assert.equal(legacyRenders,1);
assert.equal(opened,1);

console.log('V16.78.106 real runtime routing + Dungeon dedupe OK');
