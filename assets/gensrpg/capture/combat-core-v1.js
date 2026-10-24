// GenSrpG Phase9 Capture battle core - identical legacy source relocation.
// Classic script to retain original global lexical/function contract.
// BEGIN_CAPTURE_BATTLE_CORE
const GENS_CAPTURE_BATTLE_TARGETS=[
  ["self","Soi-même"],
  ["ally","1 allié"],
  ["all_allies","Tous les alliés"],
  ["enemy","1 ennemi"],
  ["all_enemies","Tous les ennemis"]
];

function gensIsCaptureGameplay(profile=getActiveGameProfile()){
  try{return !!GensCaptureV1.isProfile(profile)}
  catch(e){return false}
}
function gensCaptureRequireMode(){
  if(gensIsCaptureGameplay())return true;
  console.warn("Capture battle engine blocked outside Capture gameplay.");
  return false;
}
function gensCaptureCombatConfig(profile=getActiveGameProfile()){
  const d=gensBlankRpgSettings().captureCombat;
  try{
    if(profile?.rpgUniverse){
      ensureRpgProfileData(profile);
      return {...d,...(profile.rpgUniverse.captureCombat||{})};
    }
  }catch(e){}
  return {...d};
}

function gensCaptureBattleCreatureSnapshot(c){
  c=c||{};
  const maxHp=Math.max(1,Number(c.hp||c.maxHp||10));
  return {
    instanceId:"bc_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7),
    creatureId:String(c.id||""),
    name:String(c.name||"Créature"),
    level:Math.max(1,Number(c.level)||1),
    hp:maxHp,
    maxHp,
    mana:Math.max(0,Number(c.mana??c.stats?.mana??c.dungeonStats?.mana)||0),
    ko:false,
    abilityIds:[...(c.abilityIds||[])],
    statuses:[],
    cooldowns:{},
    charges:{},
    defended:false,
    initiative:Number(c.initiative??c.stats?.initiative??c.dungeonStats?.initiative??10)||10,
    speed:Number(c.speed??c.stats?.agilite??c.dungeonStats?.agilite??0)||0,
    source:c
  };
}

function gensCaptureBattleSide(name,roster=[],activeSlots=1){
  const creatures=(roster||[]).map(gensCaptureBattleCreatureSnapshot);
  const active=[];
  for(let i=0;i<Math.min(activeSlots,creatures.length);i++)active.push(creatures[i].instanceId);
  return {name:String(name||"Camp"),creatures,active};
}


let gensPendingCaptureBattleSetup=null;
function gensOpenCaptureBattleSetup(sideA,sideB,opts={}){
  const cfg={...gensCaptureCombatConfig(),...opts};
  gensPendingCaptureBattleSetup={sideA,sideB,opts};
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=String(v)};
  set("captureBattleSetupSlots",Math.max(1,Math.min(3,Number(cfg.activeSlots)||1)));
  const max=Math.max(1,Number(cfg.maxBattleTeam||cfg.teamSize)||6);
  set("captureBattleSetupTeam",Math.min(max,Math.max(1,Number(opts.teamSize||cfg.teamSize)||6)));
  set("captureBattleSetupController",opts.controller||cfg.controller==="mj"?"mj":"auto");
  set("captureBattleSetupRecall",opts.recallCost||cfg.recallCost||"turn");
  const it=document.getElementById("captureBattleSetupItems");if(it)it.checked=opts.itemsAllowed??cfg.itemsAllowed??true;
  const ca=document.getElementById("captureBattleSetupCapture");if(ca)ca.checked=opts.captureAllowed??(opts.type==="wild");
  set("captureBattleSetupItemSlots",Math.max(0,Number(opts.itemSlots??cfg.itemSlots)??4));
  set("captureBattleSetupItemsPerTurn",Math.max(0,Number(opts.itemsPerTurn??cfg.itemsPerTurn)??1));
  set("captureBattleSetupVictory",opts.victoryMode||cfg.victoryMode||"all_ko");
  const de=document.getElementById("captureBattleSetupDefend");if(de)de.checked=opts.defendAllowed??cfg.defendAllowed??true;
  const modal=document.getElementById("captureBattleSetupModal");
  if(modal){
    if(modal.parentElement!==document.body)document.body.appendChild(modal);
    modal.style.display="flex";
    modal.classList.add("open");
  }
}
function gensCloseCaptureBattleSetup(){document.getElementById("captureBattleSetupModal")?.classList.remove("open");gensPendingCaptureBattleSetup=null}
function gensConfirmCaptureBattleSetup(){
  const p=gensPendingCaptureBattleSetup;if(!p)return null;
  const base=gensCaptureCombatConfig(),min=Math.max(1,Number(base.minBattleTeam)||1),max=Math.max(min,Number(base.maxBattleTeam||base.teamSize)||6);
  const cfg={
    ...p.opts,
    activeSlots:Math.max(1,Math.min(3,Number(document.getElementById("captureBattleSetupSlots")?.value)||1)),
    teamSize:Math.max(min,Math.min(max,Number(document.getElementById("captureBattleSetupTeam")?.value)||max)),
    controller:document.getElementById("captureBattleSetupController")?.value||"auto",
    recallCost:document.getElementById("captureBattleSetupRecall")?.value||"turn",
    itemsAllowed:document.getElementById("captureBattleSetupItems")?.checked!==false,
    captureAllowed:!!document.getElementById("captureBattleSetupCapture")?.checked,
    itemSlots:Math.max(0,Math.min(20,Number(document.getElementById("captureBattleSetupItemSlots")?.value)||0)),
    itemsPerTurn:Math.max(0,Math.min(10,Number(document.getElementById("captureBattleSetupItemsPerTurn")?.value)||0)),
    victoryMode:document.getElementById("captureBattleSetupVictory")?.value||"all_ko",
    defendAllowed:document.getElementById("captureBattleSetupDefend")?.checked!==false
  };
  gensCloseCaptureBattleSetup();
  const b=gensCreateCaptureBattle(p.sideA,p.sideB,cfg);
  if(!b)return null;
  gensCaptureBattleInit(b);
  window.gensCurrentCaptureBattle=b;
  return b;
}
function gensCreateTrainerProfile(data={}){
  return {
    id:data.id||("trainer_"+Date.now().toString(36)),
    name:data.name||"Dresseur",
    role:data.role||"trainer",
    art:data.art||"",
    roster:Array.isArray(data.roster)?data.roster:[],
    controller:data.controller||"inherit",
    aiProfile:data.aiProfile||"balanced",
    battleRules:{...(data.battleRules||{})},
    rewards:{gold:Math.max(0,Number(data.rewards?.gold)||0),items:[...(data.rewards?.items||[])],badge:data.rewards?.badge||""}
  };
}
function gensTrainerBattleOptions(trainer,extra={}){
  const base=gensCaptureCombatConfig(),r=trainer?.battleRules||{};
  return {...base,...r,...extra,type:extra.type||"trainer",captureAllowed:r.captureAllowed===true,controller:trainer?.controller&&trainer.controller!=="inherit"?trainer.controller:base.controller};
}
function gensCaptureNpcChooseAction(battle,sideKey="B"){
  const active=gensCaptureBattleActiveCreatures(battle,sideKey);
  if(!active.length)return {kind:"none"};
  const actor=active[Math.floor(Math.random()*active.length)];
  const abilities=captureBattleAbilities(actor);
  const usable=abilities.filter(a=>a.type==="active");
  if(usable.length){
    const ability=usable[Math.floor(Math.random()*usable.length)];
    const targets=gensCaptureBattleTargets(battle,actor.instanceId,gensCaptureAbilityTargetMode(ability));
    return {kind:"ability",actorInstanceId:actor.instanceId,abilityId:ability.id,targetInstanceId:targets[0]?.instanceId||null};
  }
  return {kind:"pass",actorInstanceId:actor.instanceId};
}
function gensCaptureBattleNeedsHumanControl(battle,sideKey="B"){
  return (battle?.config?.controller||"auto")==="mj" || battle?.sides?.[sideKey]?.controller==="mj";
}
function gensCreateCaptureBattle(sideA,sideB,opts={}){
  if(!gensCaptureRequireMode())return null;
  const cfg={...gensCaptureCombatConfig(),...opts};
  cfg.activeSlots=Math.max(1,Math.min(3,Number(cfg.activeSlots)||1));
  const minTeam=Math.max(1,Number(cfg.minBattleTeam)||1),maxTeam=Math.max(minTeam,Number(cfg.maxBattleTeam||cfg.teamSize)||6);
  cfg.teamSize=Math.max(minTeam,Math.min(maxTeam,Number(cfg.teamSize)||maxTeam));
  sideA={...(sideA||{}),roster:[...(sideA?.roster||[])].slice(0,cfg.teamSize)};
  sideB={...(sideB||{}),roster:[...(sideB?.roster||[])].slice(0,cfg.teamSize)};
  return {
    id:"capture_battle_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,6),
    type:opts.type||"wild",
    round:1,
    activeSide:"A",
    config:cfg,
    phase:"setup",
    turnIndex:0,
    turnOrder:[],
    itemUseThisTurn:{A:0,B:0},
    battleBags:{A:[],B:[]},
    victory:null,
    rewards:opts.rewards||{},
    sides:{
      A:{...gensCaptureBattleSide(sideA?.name||"Joueur",sideA?.roster||[],cfg.activeSlots),controller:sideA?.controller||"human"},
      B:{...gensCaptureBattleSide(sideB?.name||"Adversaire",sideB?.roster||[],cfg.activeSlots),controller:sideB?.controller||(cfg.controller==="mj"?"mj":"auto")}
    },
    log:[]
  };
}


const GENS_CAPTURE_BATTLE_SAVE_KEY="gensrpg_capture_battle_current_v1";
function gensCaptureBattleInit(battle){
  if(!battle)return null;
  battle.phase="battle";
  gensCaptureBattleBuildTurnOrder(battle);
  gensCaptureBattleSave(battle);
  return battle;
}
function gensCaptureBattleInitiative(creature){
  const d=captureCreatureDerivedStats(creature?.source?._instance||{},creature?.source||{});
  if(captureCreatureStatRules().speed.enabled===false)return Math.random()*10;
  return d.speed + Math.random();
}
function gensCaptureBattleBuildTurnOrder(battle){
  const entries=[];
  for(const sideKey of ["A","B"]){
    gensCaptureBattleActiveCreatures(battle,sideKey).forEach(c=>entries.push({sideKey,instanceId:c.instanceId,initiative:Number(c.initiative)||0,speed:Number(c.speed)||0}));
  }
  entries.sort((a,b)=>b.initiative-a.initiative||b.speed-a.speed||a.instanceId.localeCompare(b.instanceId));
  battle.turnOrder=entries;
  if(battle.turnIndex>=entries.length)battle.turnIndex=0;
  return entries;
}
function gensCaptureBattleCurrentTurn(battle){
  return battle?.turnOrder?.[battle.turnIndex]||null;
}
function gensCaptureBattleStartTurn(battle){
  const t=gensCaptureBattleCurrentTurn(battle);if(!t)return null;
  battle.itemUseThisTurn[t.sideKey]=0;
  const hit=gensCaptureBattleCreature(battle,t.instanceId);
  if(hit){
    hit.creature.defended=false;
    Object.keys(hit.creature.cooldowns||{}).forEach(k=>hit.creature.cooldowns[k]=Math.max(0,(Number(hit.creature.cooldowns[k])||0)-1));
    gensCaptureTickStatuses(battle,hit.creature,"turn_start");
  }
  gensCaptureBattleSave(battle);return t;
}
function gensCaptureBattleEndTurn(battle){
  const t=gensCaptureBattleCurrentTurn(battle),hit=t?gensCaptureBattleCreature(battle,t.instanceId):null;
  if(hit)gensCaptureTickStatuses(battle,hit.creature,"turn_end");
  battle.turnIndex++;
  if(battle.turnIndex>=battle.turnOrder.length){battle.turnIndex=0;battle.round++;gensCaptureBattleBuildTurnOrder(battle)}
  gensCaptureBattleEvaluateVictory(battle);
  gensCaptureBattleSave(battle);
  return gensCaptureBattleCurrentTurn(battle);
}
function gensCaptureTickStatuses(battle,c,phase){
  if(!c||!Array.isArray(c.statuses))return;
  c.statuses.forEach(st=>{
    if(st.phase&&st.phase!==phase)return;
    if(st.kind==="dot"){c.hp=Math.max(0,c.hp-(Math.max(0,Number(st.value)||0)));battle.log.push({round:battle.round,type:"status",text:c.name+" subit "+(Number(st.value)||0)+" dégâts ("+(st.name||"effet")+")"})}
    if(st.kind==="hot"){c.hp=Math.min(c.maxHp,c.hp+Math.max(0,Number(st.value)||0))}
    if(st.duration!==undefined)st.duration=Math.max(0,(Number(st.duration)||0)-1);
  });
  c.statuses=c.statuses.filter(st=>st.duration===undefined||st.duration>0);
  if(c.hp<=0&&!c.ko)gensCaptureBattleHandleKo(battle,c.instanceId);
}
function gensCaptureBattleDefend(battle,instanceId){
  if(!battle?.config?.defendAllowed)return {ok:false,reason:"defend_forbidden"};
  const h=gensCaptureBattleCreature(battle,instanceId);if(!h||h.creature.ko)return {ok:false};
  h.creature.defended=true;battle.log.push({round:battle.round,type:"defend",text:h.creature.name+" se défend"});return {ok:true};
}
function gensCapturePrepareBattleBag(battle,sideKey,items=[]){
  if(!battle?.config?.itemsAllowed){battle.battleBags[sideKey]=[];return[]}
  const max=Math.max(0,Number(battle.config.itemSlots)||0);
  battle.battleBags[sideKey]=(items||[]).slice(0,max).map(x=>({...x,qty:Math.max(0,Number(x.qty)||1)}));
  gensCaptureBattleSave(battle);return battle.battleBags[sideKey];
}
function gensCaptureUseBattleItem(battle,sideKey,itemId,targetInstanceId=null){
  if(!battle?.config?.itemsAllowed)return {ok:false,reason:"items_forbidden"};
  const lim=Math.max(0,Number(battle.config.itemsPerTurn)||0);
  if((battle.itemUseThisTurn[sideKey]||0)>=lim)return {ok:false,reason:"item_limit"};
  const bag=battle.battleBags?.[sideKey]||[],it=bag.find(x=>String(x.id)===String(itemId)&&Number(x.qty)>0);
  if(!it)return {ok:false,reason:"missing_item"};
  const target=targetInstanceId?gensCaptureBattleCreature(battle,targetInstanceId)?.creature:null;
  const heal=Math.max(0,Number(it.heal||it.healHp)||0);
  if(target&&heal)target.hp=Math.min(target.maxHp,target.hp+heal);
  if(target&&it.clearStatus)target.statuses=(target.statuses||[]).filter(st=>st.id!==it.clearStatus&&st.name!==it.clearStatus);
  it.qty--;battle.itemUseThisTurn[sideKey]=(battle.itemUseThisTurn[sideKey]||0)+1;
  battle.log.push({round:battle.round,type:"item",side:sideKey,text:battle.sides[sideKey].name+" utilise "+(it.name||"un objet")});
  gensCaptureBattleSave(battle);return {ok:true,item:it,target};
}
function gensCaptureAbilityCanUse(creature,ability){
  if(!creature||!ability||ability.type!=="active")return {ok:false,reason:"invalid"};
  const r=gensAbilityUseRule(ability);
  if(r.mode==="cooldown"&&(Number(creature.cooldowns?.[ability.id])||0)>0)return {ok:false,reason:"cooldown"};
  if(r.mode==="charges"){
    if(creature.charges?.[ability.id]===undefined)creature.charges[ability.id]=Math.max(0,Number(r.value)||0);
    if(creature.charges[ability.id]<=0)return {ok:false,reason:"charges"};
  }
  if(r.mode==="mana"&&(Number(creature.mana)||0)<Math.max(0,Number(r.value)||0))return {ok:false,reason:"mana"};
  return {ok:true,rule:r};
}
function gensCaptureConsumeAbilityUse(creature,ability){
  const ck=gensCaptureAbilityCanUse(creature,ability);if(!ck.ok)return ck;const r=ck.rule;
  if(r.mode==="charges")creature.charges[ability.id]=Math.max(0,(Number(creature.charges[ability.id])||0)-1);
  if(r.mode==="mana")creature.mana=Math.max(0,(Number(creature.mana)||0)-Math.max(0,Number(r.value)||0));
  if(r.mode==="cooldown")creature.cooldowns[ability.id]=Math.max(0,Number(r.value)||0);
  return {ok:true};
}
function gensCaptureBattleEvaluateVictory(battle){
  if(!battle)return null;
  if(gensCaptureBattleIsDefeated(battle,"B"))battle.victory={winner:"A",reason:"all_ko"};
  else if(gensCaptureBattleIsDefeated(battle,"A"))battle.victory={winner:"B",reason:"all_ko"};
  if(battle.victory){
    battle.phase="ended";
    if(battle.victory.winner==="A"){
      try{captureAwardBattleXp(battle)}catch(e){console.warn("XP Capture",e)}
    }
  }
  return battle.victory;
}
function gensCaptureBattleSave(battle){
  if(!battle?.config?.saveBattle)return;
  try{localStorage.setItem(GENS_CAPTURE_BATTLE_SAVE_KEY,JSON.stringify(battle))}catch(e){}
}
function gensCaptureBattleLoad(){
  try{const b=JSON.parse(localStorage.getItem(GENS_CAPTURE_BATTLE_SAVE_KEY)||"null");return b&&b.id?b:null}catch(e){return null}
}
function gensCaptureBattleClearSave(){try{localStorage.removeItem(GENS_CAPTURE_BATTLE_SAVE_KEY)}catch(e){}}
function gensCaptureBattleOtherSide(sideKey){return sideKey==="A"?"B":"A"}

function gensCaptureBattleCreature(battle,instanceId){
  for(const k of ["A","B"]){
    const c=battle?.sides?.[k]?.creatures?.find(x=>x.instanceId===instanceId);
    if(c)return {sideKey:k,creature:c};
  }
  return null;
}

function gensCaptureBattleActiveCreatures(battle,sideKey){
  const side=battle?.sides?.[sideKey];if(!side)return[];
  return (side.active||[]).map(id=>side.creatures.find(c=>c.instanceId===id)).filter(c=>c&&!c.ko);
}

function gensCaptureBattleReserve(battle,sideKey){
  const side=battle?.sides?.[sideKey];if(!side)return[];
  const active=new Set(side.active||[]);
  return side.creatures.filter(c=>!c.ko&&!active.has(c.instanceId));
}

function gensCaptureBattleCanRecall(battle,sideKey,activeInstanceId,reserveInstanceId){
  const side=battle?.sides?.[sideKey];if(!side)return false;
  if(!(side.active||[]).includes(activeInstanceId))return false;
  const reserve=side.creatures.find(c=>c.instanceId===reserveInstanceId);
  return !!reserve&&!reserve.ko&&!(side.active||[]).includes(reserveInstanceId);
}

function gensCaptureBattleRecall(battle,sideKey,activeInstanceId,reserveInstanceId){
  if(battle?.config?.recallCost==="forbidden")return {ok:false,reason:"recall_forbidden"};
  if(!gensCaptureBattleCanRecall(battle,sideKey,activeInstanceId,reserveInstanceId))return {ok:false,reason:"invalid_switch"};
  const side=battle.sides[sideKey],ix=side.active.indexOf(activeInstanceId);
  side.active[ix]=reserveInstanceId;
  const incoming=side.creatures.find(c=>c.instanceId===reserveInstanceId);
  battle.log.push({round:battle.round,type:"switch",side:sideKey,out:activeInstanceId,in:reserveInstanceId,text:side.name+" envoie "+(incoming?.name||"une créature")});
  return {ok:true,cost:battle.config.recallCost||"turn",incoming};
}

function gensCaptureBattleHandleKo(battle,instanceId){
  const hit=gensCaptureBattleCreature(battle,instanceId);if(!hit)return {ok:false};
  const {sideKey,creature}=hit;
  creature.hp=0;creature.ko=true;
  const side=battle.sides[sideKey];
  const ix=side.active.indexOf(instanceId);
  const reserve=gensCaptureBattleReserve(battle,sideKey);
  let replacement=null;
  if(ix>=0){
    if(battle.config.autoReplaceKo!==false&&reserve.length){
      replacement=reserve[0];
      side.active[ix]=replacement.instanceId;
    }else{
      side.active.splice(ix,1);
    }
  }
  battle.log.push({round:battle.round,type:"ko",side:sideKey,instanceId,text:creature.name+" est K.O."});
  return {ok:true,sideKey,creature,replacement,needsChoice:!replacement&&reserve.length>0};
}

function gensCaptureBattleIsDefeated(battle,sideKey){
  const side=battle?.sides?.[sideKey];if(!side)return true;
  return !side.creatures.some(c=>!c.ko&&c.hp>0);
}

function gensCaptureBattleTargets(battle,actorInstanceId,targetMode="enemy"){
  const hit=gensCaptureBattleCreature(battle,actorInstanceId);if(!hit)return[];
  const own=hit.sideKey,other=gensCaptureBattleOtherSide(own);
  if(targetMode==="self")return [hit.creature];
  if(targetMode==="ally")return gensCaptureBattleActiveCreatures(battle,own).filter(c=>c.instanceId!==actorInstanceId);
  if(targetMode==="all_allies")return gensCaptureBattleActiveCreatures(battle,own);
  if(targetMode==="all_enemies")return gensCaptureBattleActiveCreatures(battle,other);
  return gensCaptureBattleActiveCreatures(battle,other);
}

function gensCaptureAbilityTargetMode(ability){
  const effects=ability?.effects||[];
  const explicit=effects.find(e=>e?.target)?.target;
  if(["self","ally","all_allies","enemy","all_enemies"].includes(explicit))return explicit;
  // Migration / sécurité : les anciennes compétences de soin n'avaient souvent
  // aucun champ target et étaient donc envoyées sur l'ennemi.
  const kinds=effects.map(e=>String(e?.kind||"").toLowerCase());
  if(kinds.some(k=>["heal","healing","hot","regenhp"].includes(k)))return "self";
  if(kinds.length && kinds.every(k=>["buff","shield","armor","defense"].includes(k)))return "self";
  return "enemy";
}
// END_CAPTURE_BATTLE_CORE
