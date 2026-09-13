/* GenSrpG Tactical Combat V2 — tactile battlefield UI.
   No legacy combat renderer/timeline dependency. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalCombatV2Ui=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="0.4.0",APP_VERSION="16.78.103";
  let battle=null,options={},selectedTarget="",selectedAttack="",rootEl=null;
  const E=()=>R.GensRpgTacticalCombatV2;
  const A=()=>R.GensRpgTacticalCombatV2Adapter;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const key=(x,y)=>`${x},${y}`;

  function ensureStyle(){
    if(!R.document||R.document.getElementById("gensTacticalV2Style"))return;
    const s=R.document.createElement("style");s.id="gensTacticalV2Style";s.textContent=`
    .gtv2Overlay{position:fixed;inset:0;z-index:30000;background:#090b0feF;color:#f4f1e8;overflow:auto;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
    .gtv2Shell{width:min(100%,960px);margin:auto;padding:10px 10px 28px}.gtv2Top{position:sticky;top:0;z-index:5;background:#10141bf2;border:1px solid #343c48;border-radius:14px;padding:9px;display:flex;align-items:center;gap:8px;box-shadow:0 8px 30px #0008}.gtv2Top strong{flex:1}.gtv2Btn{border:0;border-radius:10px;padding:10px 12px;background:#303946;color:#fff;font-weight:800;font-size:14px}.gtv2Btn:disabled{opacity:.38}.gtv2Btn.danger{background:#6f2925}.gtv2Btn.good{background:#286b48}.gtv2Hud{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.gtv2Card{background:#151a22;border:1px solid #333d4a;border-radius:12px;padding:9px;min-width:0}.gtv2Card small{color:#b9c0ca}.gtv2BattleWrap{overflow:auto;background:#0d1117;border:1px solid #343c48;border-radius:14px;padding:8px}.gtv2Grid{display:grid;gap:2px;margin:auto;width:max-content;touch-action:manipulation}.gtv2Cell{position:relative;width:52px;height:52px;border:1px solid #26303b;background:#151b24;border-radius:7px;padding:0;color:#fff;overflow:hidden}.gtv2Cell.blocked{background:repeating-linear-gradient(45deg,#272b31,#272b31 6px,#1a1d21 6px,#1a1d21 12px)}.gtv2Cell.cover{background:linear-gradient(135deg,#2a2a22,#1b2421);box-shadow:inset 0 0 0 2px #7a7047}.gtv2Cell.cover:after{content:'◈';position:absolute;right:3px;top:1px;font-size:11px;color:#d8c77b;opacity:.9}.gtv2Cell.reachable{outline:2px solid #3f9c69;outline-offset:-3px}.gtv2Cell.targetable{box-shadow:inset 0 0 0 3px #b84237}.gtv2Cell.selected{box-shadow:inset 0 0 0 4px #e6b542}.gtv2Pawn{position:absolute;inset:4px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900;text-align:center;line-height:1.05;padding:2px;border:2px solid #fff8;background:#334;z-index:2}.gtv2Pawn.hero{background:#244d72}.gtv2Pawn.enemy{background:#762f2c}.gtv2Pawn.dead{filter:grayscale(1);opacity:.4}.gtv2Hp{position:absolute;left:3px;right:3px;bottom:2px;height:4px;background:#0008;border-radius:99px;overflow:hidden}.gtv2Hp>i{display:block;height:100%;background:#70bd7c}.gtv2Actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.gtv2Actions .gtv2Btn{flex:1 1 120px}.gtv2Log{max-height:170px;overflow:auto;font-size:13px;line-height:1.4}.gtv2Legend{font-size:12px;color:#b9c0ca;margin:8px 2px}.gtv2Winner{padding:10px;border:1px solid #4d7c5f;background:#163424;border-radius:10px;font-weight:900;text-align:center;margin-top:8px}@media(max-width:600px){.gtv2Hud{grid-template-columns:1fr}.gtv2Cell{width:44px;height:44px}.gtv2Shell{padding:6px 6px 22px}.gtv2Top{border-radius:10px}.gtv2Pawn{font-size:10px}}
    `;R.document.head.appendChild(s);
  }
  function actorLabel(a){return a?.name||a?.id||"?"}
  function current(){return E()?.currentActor?.(battle)||null}
  function targetActor(){return E()?.actorById?.(battle,selectedTarget)||null}
  function canTarget(cur,a){if(!cur||!a||!a.alive||cur.side===a.side)return false;const attacks=cur.attacks||[];return attacks.some(x=>E().attackPreview(battle,cur.id,a.id,x.id).ok)}
  function refreshSelection(){
    const cur=current();if(!cur){selectedTarget="";selectedAttack="";return}
    if(!cur.attacks.some(x=>x.id===selectedAttack))selectedAttack=cur.attacks[0]?.id||"";
    const t=targetActor();if(!t||!t.alive||t.side===cur.side)selectedTarget="";
  }
  function logText(row){
    if(row.type==="turn")return `Tour : ${actorLabel(E().actorById(battle,row.actorId))}`;
    if(row.type==="move")return `${actorLabel(E().actorById(battle,row.actorId))} se déplace de ${row.cost} case(s).`;
    if(row.type==="attack")return `${actorLabel(E().actorById(battle,row.attackerId))} → ${actorLabel(E().actorById(battle,row.targetId))} : ${row.hit?`${row.damage} dégât(s) [${row.roll}/${row.hitChance}%]${row.cellCover?` · couvert -${row.cellCover}%`:""}`:`raté [${row.roll}/${row.hitChance}%]${row.cellCover?` · couvert -${row.cellCover}%`:""}`}`;
    return row.type||"événement";
  }
  function reachableSet(){const cur=current();if(!cur||cur.side!=="hero")return new Map();return new Map(E().reachableCells(battle,cur.id).map(c=>[key(c.x,c.y),c]))}
  function renderGrid(){
    const grid=battle.grid,reach=reachableSet(),blocked=new Set((grid.blocked||[]).map(p=>key(p.x,p.y))),cover=new Set((grid.cover||[]).map(p=>key(p.x,p.y))),cur=current();
    let h=`<div class="gtv2Grid" style="grid-template-columns:repeat(${grid.width},52px)" data-grid>`;
    for(let y=0;y<grid.height;y++)for(let x=0;x<grid.width;x++){
      const k=key(x,y),a=battle.actors.find(q=>q.alive&&q.x===x&&q.y===y),cls=["gtv2Cell"];
      if(blocked.has(k))cls.push("blocked");if(cover.has(k))cls.push("cover");if(reach.has(k)&&(!a||a.id===cur?.id))cls.push("reachable");
      if(a&&canTarget(cur,a))cls.push("targetable");if(a&&a.id===selectedTarget)cls.push("selected");
      h+=`<button class="${cls.join(" ")}" data-x="${x}" data-y="${y}" ${blocked.has(k)?"disabled":""}>`;
      if(a){const hp=Math.max(0,Math.min(100,(a.hp/a.maxHp)*100));h+=`<span class="gtv2Pawn ${a.side}">${esc(a.name.split(" ")[0])}<span class="gtv2Hp"><i style="width:${hp}%"></i></span></span>`}
      h+=`</button>`;
    }
    return h+`</div>`;
  }
  function renderActions(){
    const cur=current();if(!cur||battle.status!=="active")return "";
    if(cur.side!=="hero")return `<div class="gtv2Actions"><button class="gtv2Btn" disabled>IA en résolution…</button></div>`;
    const target=targetActor();
    const attacks=(cur.attacks||[]).map(a=>{const p=target?E().attackPreview(battle,cur.id,target.id,a.id):null;const disabled=!target||!p?.ok||cur.actionsLeft<1;const label=`${esc(a.name)} · ${a.minRange}-${a.maxRange} cases${p?.ok?` · ${p.hitChance}% · ${p.damage} dmg${p.cellCover?` · couvert ${p.cellCover}%`:""}`:""}`;return `<button class="gtv2Btn ${a.id===selectedAttack?"good":""}" data-attack="${esc(a.id)}" ${disabled?"disabled":""}>${label}</button>`}).join("");
    return `<div class="gtv2Actions">${attacks}<button class="gtv2Btn" data-end>Fin du tour</button></div>`;
  }
  function render(){
    if(!rootEl||!battle)return;refreshSelection();const cur=current(),target=targetActor();
    rootEl.innerHTML=`<div class="gtv2Shell"><div class="gtv2Top"><strong>⚔️ Combat tactique · manche ${battle.round}</strong><button class="gtv2Btn danger" data-close>Quitter le combat</button></div>
      <div class="gtv2Hud"><div class="gtv2Card"><strong>${cur?`Tour : ${esc(actorLabel(cur))}`:"Combat terminé"}</strong><br><small>${cur?`Mouvement ${cur.movementLeft}/${cur.movement} · Action ${cur.actionsLeft}`:""}</small></div><div class="gtv2Card"><strong>${target?`Cible : ${esc(actorLabel(target))}`:"Touchez un ennemi pour le cibler"}</strong><br><small>${target?`PV ${target.hp}/${target.maxHp} · DEF ${target.defense} · ARM ${target.armor}`:"Portée, ligne de vue et couvert sont calculés en cases."}</small></div></div>
      <div class="gtv2BattleWrap">${renderGrid()}</div><div class="gtv2Legend">Vert = déplacement · Rouge = cible attaquable · ◈ = couvert · les murs bloquent les tirs.</div>${renderActions()}
      ${battle.status==="ended"?`<div class="gtv2Winner">${battle.winner==="hero"?"🏆 Victoire":"💀 Défaite"}</div><div class="gtv2Actions"><button class="gtv2Btn good" data-commit>Appliquer le résultat et revenir au donjon</button></div>`:""}
      <div class="gtv2Card gtv2Log">${battle.log.slice(-20).reverse().map(x=>`<div>${esc(logText(x))}</div>`).join("")}</div></div>`;
    const g=rootEl.querySelector("[data-grid]");if(g)g.style.gridTemplateColumns=`repeat(${battle.grid.width},min(52px,11vw))`;
  }
  function runAiUntilHero(){
    let guard=0;while(battle?.status==="active"&&current()?.side==="enemy"&&guard++<50){E().aiStep(battle)}
    render();
  }
  function clickCell(x,y){
    const cur=current();if(!cur||cur.side!=="hero"||battle.status!=="active")return;
    const a=battle.actors.find(q=>q.alive&&q.x===x&&q.y===y);
    if(a&&a.side!==cur.side){selectedTarget=a.id;selectedAttack=cur.attacks.find(at=>E().attackPreview(battle,cur.id,a.id,at.id).ok)?.id||cur.attacks[0]?.id||"";render();return}
    if(a&&a.id!==cur.id)return;
    const r=E().moveActor(battle,cur.id,{x,y});if(r.ok)render();
  }
  function doAttack(id){
    const cur=current(),target=targetActor();if(!cur||!target)return;
    selectedAttack=id;const r=E().resolveAttack(battle,cur.id,target.id,id);if(!r.ok){render();return}
    if(battle.status==="active"&&cur.actionsLeft<=0)E().endTurn(battle);
    runAiUntilHero();
  }
  function endHeroTurn(){if(battle?.status!=="active")return;const cur=current();if(cur?.side!=="hero")return;E().endTurn(battle);runAiUntilHero()}
  function close(apply=false){
    const b=battle;let summary=null;
    if(apply&&b)try{summary=A()?.commitBattle?.(R,b,{removeDefeatedEnemies:true})||null}catch(e){console.error("tactical commit",e)}
    rootEl?.remove();rootEl=null;battle=null;selectedTarget="";selectedAttack="";
    const cb=options?.onFinish;const cancel=options?.onCancel;const oldOptions=options;options={};
    try{if(apply&&typeof cb==="function")cb({battle:b,summary,options:oldOptions});else if(!apply&&typeof cancel==="function")cancel({battle:b,options:oldOptions})}catch(e){console.error("tactical finish callback",e)}
    return b;
  }
  function onClick(ev){
    const btn=ev.target.closest?.("button");if(!btn)return;
    if(btn.hasAttribute("data-close")){close(false);return}if(btn.hasAttribute("data-commit")){close(true);return}if(btn.hasAttribute("data-end")){endHeroTurn();return}
    if(btn.dataset.attack){doAttack(btn.dataset.attack);return}
    if(btn.dataset.x!==undefined&&btn.dataset.y!==undefined)clickCell(Number(btn.dataset.x),Number(btn.dataset.y));
  }
  function open(input,opts={}){
    if(!R.document)throw new Error("Tactical UI requires a document");if(!E())throw new Error("Tactical engine unavailable");
    ensureStyle();options=opts||{};battle=input?.actors?E().createBattle(input):A()?.createBattle?.(R,input||{});if(!battle)throw new Error("Cannot create tactical battle");
    rootEl=R.document.createElement("div");rootEl.className="gtv2Overlay";rootEl.setAttribute("data-gens-tactical-v2","1");rootEl.addEventListener("click",onClick);R.document.body.appendChild(rootEl);render();runAiUntilHero();return battle;
  }
  function openCurrentEncounter(opts={}){return open(opts,opts)}
  function getBattle(){return battle}

  return {VERSION,APP_VERSION,open,openCurrentEncounter,close,getBattle,render,runAiUntilHero};
});
