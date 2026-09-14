const assert=require('node:assert/strict');
const path=require('node:path');
const Guard=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-session-guard-16781144.js'));

assert.equal(Guard.APP_VERSION,'16.78.114.4');
assert.ok(Guard.RENDER_NAMES.includes('renderDungeonCombatRound'));
assert.ok(Guard.START_NAMES.includes('dc200StartCombat'));

function store(initial={}){const m=new Map(Object.entries(initial));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),_m:m}}
function classList(){return {remove(){},add(){},contains(){return false}}}
function board(visible=true){return {style:{display:visible?'block':'none',visibility:'visible'},parentElement:null,getBoundingClientRect:()=>({width:visible?300:0,height:visible?300:0}),classList:classList()}}
function makeRt({visible=true,family='adventure',bridge=true}={}){
  let currentBoard=board(visible),legacy=0,starts=0,closed=0,battle=null,toast='';
  const modal={style:{display:'block'},classList:classList()};
  const doc={
    body:{style:{overflow:'hidden'}},
    querySelector(sel){if(sel==='#dc047RoomBoard')return currentBoard;if(sel==='.gtv2Overlay')return null;return null},
    querySelectorAll(){return []},
    getElementById(id){return id==='dungeonCombatModal'?modal:null},
    addEventListener(){},
  };
  const rt={
    console,
    document:doc,
    localStorage:store({gensrpg_session_family_guard_v1:family}),
    sessionStorage:store(),
    getActiveGameProfile:()=>({gameStyle:family==='survival'?'survival':'dungeon'}),
    closeDungeonCombat(){closed++},
    showToast(msg){toast=msg},
    dc200StartCombat(){starts++;return {ok:true}},
    startCombat(){starts++;return true},
    openDungeonCombatSetup(){starts++;return true},
    launchCombat200(){starts++;return true},
    renderDungeonCombatRound(){legacy++;return 'legacy'},
    __dc302RenderCombat(){legacy++;return 'legacy302'},
    GensRpgTacticalCombatV2Ui:{getBattle:()=>battle,close(){battle=null}},
    _setVisible(v){currentBoard=board(v)},
    _stats:()=>({legacy,starts,closed,battle,toast,modal})
  };
  if(bridge)rt.GensRpgTacticalCombatV2Bridge={currentBattle:()=>battle,openCurrent(_rt,opts){battle={id:'v2',opts};return {ok:true,battle}}};
  return rt;
}

// 1. Menu / hidden exploration: stale combat must be closed and no combat may restart over menus.
{
  const rt=makeRt({visible:false});
  Guard.install(rt);
  const start=rt.dc200StartCombat(['e1'],'auto-engage-v114');
  assert.equal(start.ok,false);
  assert.equal(start.reason,'menu-or-hidden-exploration-v1144');
  assert.equal(rt.renderDungeonCombatRound(),false,'legacy renderer must be swallowed while menu is active');
  assert.equal(rt._stats().starts,0);
  assert.equal(rt._stats().legacy,0);
  assert.equal(rt._stats().modal.style.display,'none');
}

// 2. Visible exploration: combat can start and renderer seam routes only to Tactical V2.
{
  const rt=makeRt({visible:true});
  Guard.install(rt);
  assert.deepEqual(rt.dc200StartCombat(['e1'],'manual'),{ok:true});
  assert.equal(rt._stats().starts,1,'real tactical start path remains available in exploration');
  const b=rt.renderDungeonCombatRound();
  assert.equal(b.id,'v2');
  assert.equal(rt._stats().legacy,0,'Dungeon legacy combat must never execute');
}

// 3. Emergency Retour menu hold survives the immediate UI transition and clears only after exploration was hidden then shown again.
{
  const rt=makeRt({visible:true});
  Guard.install(rt);
  Guard.setMenuHold(rt,true);
  assert.equal(Guard.holdActive(rt),true);
  assert.equal(rt.dc200StartCombat(['e1'],'auto-engage-v114').ok,false);
  rt._setVisible(false);Guard.syncVisibility(rt);
  assert.equal(Guard.holdActive(rt),true);
  rt._setVisible(true);Guard.syncVisibility(rt);
  assert.equal(Guard.holdActive(rt),false,'returning deliberately to exploration releases the menu hold');
  assert.deepEqual(rt.dc200StartCombat(['e1'],'manual'),{ok:true});
}

// 4. If Tactical V2 is unavailable, fail closed instead of exposing the old Dungeon combat.
{
  const rt=makeRt({visible:true,bridge:false});
  Guard.install(rt);
  assert.equal(rt.__dc302RenderCombat(),false);
  assert.equal(rt._stats().legacy,0);
  assert.match(rt._stats().toast,/ancien combat bloqué/);
}

// 5. Survival is untouched and keeps its native renderer.
{
  const rt=makeRt({visible:false,family:'survival',bridge:false});
  Guard.install(rt);
  assert.equal(rt.renderDungeonCombatRound(),'legacy');
  assert.equal(rt._stats().legacy,1);
}

console.log('V16.78.114.4 combat session recovery + no Dungeon legacy fallback: OK');