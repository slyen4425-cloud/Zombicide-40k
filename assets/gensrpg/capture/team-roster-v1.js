// GenSrpG Phase 9 Capture Team / Reserve V1: physically moved legacy owner.
// Classic synchronous script: original global API, persisted keys, and rules unchanged.
// BEGIN_CAPTURE_TEAM_SECTION_1
function captureActiveHeroId(){
  try{
    const participants=normalizeGameParticipants();
    if(current && participants.map(String).includes(String(current))) return String(current);
    if(participants.length) return String(participants[0]);
    return String(current||"");
  }catch(e){ return String(current||""); }
}
function captureActiveHeroState(){
  const id=captureActiveHeroId();if(!id)return null;
  try{return loadState(id)}catch(e){return null}
}
function captureTeamEntityRoster(heroId=captureActiveHeroId()){
  if(!heroId)return [];
  try{
    const st=ensureHeroCreatureState(loadState(heroId));
    const pool=loadSharedEntities();
    return (st.creatureTeam||[]).map(inst=>{
      const ent=pool.find(x=>String(x.id)===String(inst.entityId||inst.creatureId||""));
      if(!ent)return null;
      return {...ent,hp:Math.max(1,Number(inst.maxHp||inst.hp||ent.hp)||10),level:Number(inst.level||ent.level)||1,_instance:inst};
    }).filter(Boolean);
  }catch(e){return[]}
}
// END_CAPTURE_TEAM_SECTION_1
// BEGIN_CAPTURE_TEAM_SECTION_2
function captureFindOwnedCreature(uid){
  const heroId=captureActiveHeroId();if(!heroId)return null;
  const st=ensureHeroCreatureState(loadState(heroId));
  for(const where of ["creatureTeam","creatureReserve"]){
    const inst=(st[where]||[]).find(x=>String(x.uid)===String(uid));
    if(inst)return {heroId,st,inst,where,entity:creatureEntityForInstance(inst)};
  }
  return null;
}
// END_CAPTURE_TEAM_SECTION_2
// BEGIN_CAPTURE_TEAM_SECTION_3
function ensureHeroCreatureState(st){
  if(!st)return st;
  if(!Array.isArray(st.creatureTeam))st.creatureTeam=[];
  if(!Array.isArray(st.creatureReserve))st.creatureReserve=[];
  st.creatureTeam=st.creatureTeam.filter(Boolean).slice(0,6);
  st.creatureReserve=st.creatureReserve.filter(Boolean);
  return st;
}
function heroCreatureState(heroId=current){
  const st=ensureHeroCreatureState(loadState(heroId));
  if(heroId===current)state=st;
  return st;
}
function creatureInstance(entityId){
  const e=loadSharedEntities().find(x=>x.id===entityId);
  const baseHp=Math.max(1,Number(e?.hp||e?.stats?.hp||10)||10);
  return {
    uid:"ci_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,6),
    entityId,
    level:Math.max(1,Number(e?.level)||1),
    xp:0,
    talentPoints:0,
    statPoints:0,
    statAlloc:{power:0,defense:0,agility:0,speed:0,spirit:0,hp:0},
    talents:[],
    knownAbilityIds:Array.isArray(e?.abilityIds)?e.abilityIds.slice():[],
    activeAbilityIds:Array.isArray(e?.abilityIds)?e.abilityIds.slice(0,4):[],
    maxHp:baseHp,
    hp:baseHp,
    capturedAt:Date.now()
  };
}
function creatureEntityForInstance(inst){return loadSharedEntities().find(x=>x.id===inst?.entityId)||null}
function saveHeroCreatureState(heroId,st){
  ensureHeroCreatureState(st);
  localStorage.setItem(key(heroId),JSON.stringify(st));
  if(heroId===current)state=st;
}

// END_CAPTURE_TEAM_SECTION_3
// BEGIN_CAPTURE_TEAM_SECTION_4
function captureCreatureCardHtml(inst,where,index){
  const e=creatureEntityForInstance(inst);if(!e)return"";
  const img=e.artData||e.iconData||"";
  const icon=img?`<img src="${z40kEscAttr(img)}">`:`<div style="font-size:42px;text-align:center">${z40kEscHtml(e.icon||"🐲")}</div>`;
  const moveBtn=where==="team"
    ? `<button type="button" onclick="moveCreatureToReserve(${index});renderCaptureHeroSheet()">📦 RÉSERVE</button>`
    : `<button type="button" onclick="moveCreatureToTeam('${z40kEscAttr(inst.uid)}');renderCaptureHeroSheet()">⬆️ ÉQUIPE</button>`;
  const lvl=Math.max(1,Number(inst.level||e.level)||1);
  const xp=Math.max(0,Number(inst.xp)||0),next=captureXpToNextLevel(lvl);
  return `<div class="captureCreatureCard">${icon}<strong>${z40kEscHtml(e.name)}</strong>
    <div class="small">Niv. ${lvl}</div>
    <div class="small">PV ${Math.max(0,Number(inst.hp??e.hp)||0)} / ${Math.max(1,Number(inst.maxHp??e.hp)||1)}</div>
    <div class="captureXpLine">⭐ XP ${xp} / ${next}</div>
    <div class="v2LibActions"><button type="button" onclick="captureOpenCreatureDetail('${z40kEscAttr(inst.uid)}')">📊 STATS</button>${moveBtn}</div></div>`;
}
function renderCaptureHeroTeam(){
  const box=document.getElementById("captureHeroTeamGrid");if(!box||!current)return;
  const st=heroCreatureState(current),arr=st.creatureTeam||[];
  const cfg=gensCaptureCombatConfig(),max=Math.max(1,Number(cfg.teamSize)||6);
  const badge=document.getElementById("captureTeamCountBadge");if(badge)badge.textContent=arr.length+" / "+max;
  box.innerHTML=arr.length?arr.map((x,i)=>captureCreatureCardHtml(x,"team",i)).join(""):'<div class="empty">Aucune créature dans l’équipe.</div>';
}
function renderCaptureHeroReserve(){
  const box=document.getElementById("captureHeroReserveList");if(!box||!current)return;
  const arr=heroCreatureState(current).creatureReserve||[];
  box.innerHTML=arr.length?arr.map(x=>captureCreatureCardHtml(x,"reserve",-1)).join(""):'<div class="empty">Réserve vide.</div>';
}
// END_CAPTURE_TEAM_SECTION_4
// BEGIN_CAPTURE_TEAM_SECTION_5
function creatureCanEvolveInstance(inst){
  const e=creatureEntityForInstance(inst);if(!e?.canEvolve||!e.evolution?.targetId)return false;
  if(e.evolution.condition==="manual")return true;
  return (Number(inst?.level)||1)>=Math.max(1,Number(e.evolution.level)||1);
}
function evolveCreatureInstance(uid,source){
  if(!current)return;
  const st=heroCreatureState(current),arr=source==="reserve"?st.creatureReserve:st.creatureTeam;
  const inst=arr.find(x=>x.uid===uid);if(!inst)return;
  const e=creatureEntityForInstance(inst);if(!e?.evolution?.targetId)return;
  if(!creatureCanEvolveInstance(inst)){alert("Cette créature ne remplit pas encore la condition d’évolution.");return}
  const target=loadSharedEntities().find(x=>x.id===e.evolution.targetId);if(!target){alert("Forme d’évolution introuvable.");return}
  inst.entityId=target.id;inst.evolvedFrom=e.id;inst.evolvedAt=Date.now();
  saveHeroCreatureState(current,st);renderHeroCreatureTeam();renderCreatureReserve();
  showEffectPopup("🧬","ÉVOLUTION",z40kEscHtml(e.name)+" évolue en <strong>"+z40kEscHtml(target.name)+"</strong> !","Évolution",false);
}
function moveCreatureToReserve(index){
  if(!current)return;
  const st=heroCreatureState(current);if(!st.creatureTeam[index])return;
  st.creatureReserve.push(st.creatureTeam[index]);
  st.creatureTeam.splice(index,1);
  saveHeroCreatureState(current,st);renderHeroCreatureTeam();
}
function moveCreatureToTeam(uid){
  if(!current)return;
  const st=heroCreatureState(current);
  if(st.creatureTeam.length>=6){alert("L’équipe active contient déjà 6 créatures.");return}
  const i=st.creatureReserve.findIndex(x=>x.uid===uid);if(i<0)return;
  st.creatureTeam.push(st.creatureReserve[i]);st.creatureReserve.splice(i,1);
  saveHeroCreatureState(current,st);renderHeroCreatureTeam();renderCreatureReserve();
}
function releaseCreature(uid,source){
  if(!current||!confirm("Relâcher définitivement cette créature ?"))return;
  const st=heroCreatureState(current),arr=source==="team"?st.creatureTeam:st.creatureReserve;
  const i=arr.findIndex(x=>x.uid===uid);if(i>=0)arr.splice(i,1);
  saveHeroCreatureState(current,st);renderHeroCreatureTeam();renderCreatureReserve();
}
function openCreatureReserve(){
  if(!current)return;
  const m=document.getElementById("creatureReserveModal");if(!m)return;
  m.style.display="flex";renderCreatureReserve();
}
function closeCreatureReserve(){const m=document.getElementById("creatureReserveModal");if(m)m.style.display="none"}
function renderCreatureReserve(){
  const box=document.getElementById("creatureReserveList");if(!box||!current)return;
  const st=heroCreatureState(current),arr=st.creatureReserve||[];
  box.innerHTML=arr.length?arr.map(inst=>{
    const e=creatureEntityForInstance(inst);if(!e)return"";
    return `<div class="v2LibCard">
      <div class="v2LibHead"><strong>${z40kEscHtml(e.name)}</strong><span class="badge">Niv. ${inst.level||e.level||1}</span></div>
      <div class="small">${z40kEscHtml(e.desc||"")}</div>
      <div class="v2LibActions">
        ${creatureCanEvolveInstance(inst)?`<button onclick="evolveCreatureInstance(\'${z40kEscAttr(inst.uid)}\',\'reserve\')">🧬 ÉVOLUER</button>`:""}
        <button onclick="moveCreatureToTeam('${z40kEscAttr(inst.uid)}')">⬆️ ÉQUIPE</button>
        <button class="creatorDelete" onclick="releaseCreature('${z40kEscAttr(inst.uid)}','reserve')">RELÂCHER</button>
      </div>
    </div>`;
  }).join(""):'<div class="empty">Réserve vide.</div>';
}
// END_CAPTURE_TEAM_SECTION_5
