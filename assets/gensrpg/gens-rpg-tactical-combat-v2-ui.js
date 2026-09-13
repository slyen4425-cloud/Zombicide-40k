/* GenSrpG Tactical Combat V2 — tactile battlefield UI.
   V16.78.107: playable mobile actions, D100 roll feedback, terrain texture and actor art.
   No legacy combat renderer/timeline dependency. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalCombatV2Ui=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="0.5.1",APP_VERSION="16.78.107";
  let battle=null,options={},selectedTarget="",selectedAttack="",rootEl=null,busy=false,notice="";
  const E=()=>R.GensRpgTacticalCombatV2;
  const A=()=>R.GensRpgTacticalCombatV2Adapter;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const key=(x,y)=>`${x},${y}`;
  async function waitAnimation(anim){try{if(anim?.finished)await anim.finished}catch(e){}}

  function ensureStyle(){
    if(!R.document||R.document.getElementById("gensTacticalV2Style"))return;
    const s=R.document.createElement("style");s.id="gensTacticalV2Style";s.textContent=`
    .gtv2Overlay{position:fixed;inset:0;z-index:30000;background:#090b0ff2;color:#f4f1e8;overflow:auto;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
    .gtv2Shell{width:min(100%,960px);margin:auto;padding:10px 10px 28px}.gtv2Top{position:sticky;top:0;z-index:5;background:#10141bf5;border:1px solid #343c48;border-radius:14px;padding:9px;display:flex;align-items:center;gap:8px;box-shadow:0 8px 30px #0008}.gtv2Top strong{flex:1}.gtv2Btn{border:0;border-radius:10px;padding:11px 12px;background:#303946;color:#fff;font-weight:800;font-size:14px;min-height:44px}.gtv2Btn:disabled{opacity:.38}.gtv2Btn.danger{background:#6f2925}.gtv2Btn.good{background:#286b48}.gtv2Btn.warn{background:#765d20}.gtv2Btn.active{outline:2px solid #e6b542;outline-offset:1px}.gtv2Hud{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.gtv2Card{background:#151a22;border:1px solid #333d4a;border-radius:12px;padding:9px;min-width:0}.gtv2Card small{color:#b9c0ca}.gtv2BattleWrap{overflow:auto;background:#0d1117;border:1px solid #343c48;border-radius:14px;padding:8px;box-shadow:inset 0 0 30px #0007}.gtv2Grid{display:grid;gap:2px;margin:auto;width:max-content;touch-action:manipulation}.gtv2Cell{position:relative;width:52px;height:52px;border:1px solid #26303b;background:#151b24 url('assets/dungeon/creatures/dng_floor_stone_01.png') center/cover no-repeat;border-radius:7px;padding:0;color:#fff;overflow:hidden;box-shadow:inset 0 0 12px #0006}.gtv2Cell.blocked{background:#1b1d20 url('assets/dungeon/creatures/dng_wall_block.jpg') center/cover no-repeat;filter:saturate(.7) brightness(.75)}.gtv2Cell.cover{box-shadow:inset 0 0 0 3px #9a8749,inset 0 0 12px #0007}.gtv2Cell.cover:after{content:'◈';position:absolute;right:3px;top:1px;font-size:12px;color:#f4d86f;text-shadow:0 1px 2px #000;opacity:.95}.gtv2Cell.reachable{outline:3px solid #45bf78;outline-offset:-4px}.gtv2Cell.targetable{box-shadow:inset 0 0 0 4px #d94a3e,inset 0 0 12px #0007}.gtv2Cell.selected{outline:4px solid #f3bf3f;outline-offset:-4px}.gtv2Cell.current{box-shadow:inset 0 0 0 4px #5ca8ff,inset 0 0 12px #0007}.gtv2Pawn{position:absolute;inset:3px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:900;text-align:center;line-height:1.05;border:2px solid #fff9;background:#334;z-index:2;overflow:hidden;text-shadow:0 1px 3px #000}.gtv2Pawn.hero{background:#244d72}.gtv2Pawn.enemy{background:#762f2c}.gtv2Pawn.dead{filter:grayscale(1);opacity:.4}.gtv2Pawn img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.gtv2Pawn b{position:absolute;left:1px;right:1px;bottom:5px;z-index:3;background:#0009;border-radius:5px;padding:1px;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gtv2Hp{position:absolute;left:3px;right:3px;bottom:2px;height:4px;background:#000b;border-radius:99px;overflow:hidden;z-index:4}.gtv2Hp>i{display:block;height:100%;background:#70bd7c}.gtv2Actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.gtv2Actions .gtv2Btn{flex:1 1 130px}.gtv2Targets{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px}.gtv2Target{flex:0 0 auto;min-width:130px;text-align:left}.gtv2Target em{display:block;font-style:normal;font-size:11px;color:#c7ced7;margin-top:2px}.gtv2Hint{margin:8px 0;padding:9px 10px;border-radius:10px;background:#171f29;border:1px solid #354559;font-size:13px}.gtv2Hint.warn{background:#332919;border-color:#7a6128}.gtv2Log{max-height:170px;overflow:auto;font-size:13px;line-height:1.4}.gtv2Legend{font-size:12px;color:#b9c0ca;margin:8px 2px}.gtv2Winner{padding:10px;border:1px solid #4d7c5f;background:#163424;border-radius:10px;font-weight:900;text-align:center;margin-top:8px}.gtv2DiceBackdrop{position:fixed;inset:0;z-index:31000;background:#05070bc9;display:grid;place-items:center;padding:20px}.gtv2DiceCard{width:min(92vw,360px);background:#151a22;border:2px solid #566171;border-radius:18px;padding:20px;text-align:center;box-shadow:0 18px 60px #000c}.gtv2DiceTitle{font-size:15px;color:#ccd3dc}.gtv2Die{width:112px;height:112px;margin:16px auto;border-radius:24px;display:grid;place-items:center;background:linear-gradient(145deg,#f4efe2,#bfc8d5);color:#161a20;font-size:30px;font-weight:1000;box-shadow:inset 0 0 0 5px #ffffff66,0 12px 30px #0008}.gtv2DiceResult{font-size:18px;font-weight:900}.gtv2DiceResult.ok{color:#79d796}.gtv2DiceResult.fail{color:#f07c72}@media(max-width:600px){.gtv2Hud{grid-template-columns:1fr}.gtv2Cell{width:44px;height:44px}.gtv2Shell{padding:6px 6px 22px}.gtv2Top{border-radius:10px}.gtv2Pawn{font-size:9px}.gtv2Pawn b{font-size:7px}.gtv2Btn{font-size:13px;padding:10px}}
    `;R.document.head.appendChild(s);
  }
  function actorLabel(a){return a?.name||a?.id||"?"}
  function current(){return E()?.currentActor?.(battle)||null}
  function targetActor(){return E()?.actorById?.(battle,selectedTarget)||null}
  function selectedAttackActor(){const cur=current();return cur?.attacks?.find(a=>a.id===selectedAttack)||cur?.attacks?.[0]||null}
  function canTarget(cur,a){if(!cur||!a||!a.alive||cur.side===a.side)return false;const attacks=cur.attacks||[];return attacks.some(x=>E().attackPreview(battle,cur.id,a.id,x.id).ok)}
  function refreshSelection(){
    const cur=current();if(!cur){selectedTarget="";selectedAttack="";return}
    if(!cur.attacks.some(x=>x.id===selectedAttack))selectedAttack=cur.attacks[0]?.id||"";
    const t=targetActor();if(!t||!t.alive||t.side===cur.side)selectedTarget="";
  }
  function logText(row){
    if(row.type==="turn")return `Tour : ${actorLabel(E().actorById(battle,row.actorId))}`;
    if(row.type==="move")return `${actorLabel(E().actorById(battle,row.actorId))} se déplace de ${row.cost} case(s).`;
    if(row.type==="attack")return `${actorLabel(E().actorById(battle,row.attackerId))} → ${actorLabel(E().actorById(battle,row.targetId))} : ${row.hit?`${row.damage} dégât(s) [D100 ${row.roll} ≤ ${row.hitChance}]${row.cellCover?` · couvert -${row.cellCover}%`:""}`:`raté [D100 ${row.roll} > ${row.hitChance}]${row.cellCover?` · couvert -${row.cellCover}%`:""}`}`;
    return row.type||"événement";
  }
  function reachableSet(){const cur=current();if(!cur||cur.side!=="hero"||busy)return new Map();return new Map(E().reachableCells(battle,cur.id).map(c=>[key(c.x,c.y),c]))}
  function pawnHtml(a){
    const hp=Math.max(0,Math.min(100,(a.hp/a.maxHp)*100)),art=a.meta?.art?esc(a.meta.art):"",short=esc((a.name||a.id||"?").split(" ")[0]);
    return `<span class="gtv2Pawn ${a.side}">${art?`<img src="${art}" alt="">`:short}<b>${short}</b><span class="gtv2Hp"><i style="width:${hp}%"></i></span></span>`;
  }
  function renderGrid(){
    const grid=battle.grid,reach=reachableSet(),blocked=new Set((grid.blocked||[]).map(p=>key(p.x,p.y))),cover=new Set((grid.cover||[]).map(p=>key(p.x,p.y))),cur=current();
    let h=`<div class="gtv2Grid" style="grid-template-columns:repeat(${grid.width},52px)" data-grid>`;
    for(let y=0;y<grid.height;y++)for(let x=0;x<grid.width;x++){
      const k=key(x,y),a=battle.actors.find(q=>q.alive&&q.x===x&&q.y===y),cls=["gtv2Cell"];
      if(blocked.has(k))cls.push("blocked");if(cover.has(k))cls.push("cover");if(reach.has(k)&&(!a||a.id===cur?.id))cls.push("reachable");
      if(a&&canTarget(cur,a))cls.push("targetable");if(a&&a.id===selectedTarget)cls.push("selected");if(a&&a.id===cur?.id)cls.push("current");
      h+=`<button class="${cls.join(" ")}" data-x="${x}" data-y="${y}" ${blocked.has(k)||busy?"disabled":""}>`;
      if(a)h+=pawnHtml(a);
      h+=`</button>`;
    }
    return h+`</div>`;
  }
  function previewReason(p){
    if(!p)return "Choisis une cible.";
    if(p.ok)return `${p.hitChance}% de toucher · ${p.damage} dégât(s) · distance ${p.distance}`;
    if(p.reason==="out-of-range")return `Hors de portée : ${p.distance} case(s), portée ${p.minRange}-${p.maxRange}.`;
    if(p.reason==="line-of-sight")return "Ligne de vue bloquée par le terrain.";
    if(p.reason==="no-action")return "Aucune action restante.";
    return "Cette attaque n'est pas possible depuis cette case.";
  }
  function renderTargets(){
    const cur=current();if(!cur||cur.side!=="hero"||battle.status!=="active")return "";
    const atk=selectedAttackActor();
    const targets=battle.actors.filter(a=>a.alive&&a.side!==cur.side);
    if(!targets.length)return "";
    return `<div class="gtv2Targets">${targets.map(t=>{const p=atk?E().attackPreview(battle,cur.id,t.id,atk.id):null;const txt=p?.ok?`${p.hitChance}% · ${p.damage} dmg`:p?.reason==="out-of-range"?`distance ${p.distance}`:"non attaquable";return `<button class="gtv2Btn gtv2Target ${t.id===selectedTarget?"active":""}" data-target="${esc(t.id)}" ${busy?"disabled":""}>🎯 ${esc(actorLabel(t))}<em>PV ${t.hp}/${t.maxHp} · ${txt}</em></button>`}).join("")}</div>`;
  }
  function renderActions(){
    const cur=current();if(!cur||battle.status!=="active")return "";
    if(cur.side!=="hero")return `<div class="gtv2Actions"><button class="gtv2Btn" disabled>IA en résolution…</button></div>`;
    const target=targetActor();
    const attacks=(cur.attacks||[]).map(a=>{const p=target?E().attackPreview(battle,cur.id,target.id,a.id):null;const disabled=busy||cur.actionsLeft<1;const label=`⚔️ ${esc(a.name)} · portée ${a.minRange}-${a.maxRange}${p?.ok?` · ${p.hitChance}% · ${p.damage} dmg`:""}`;return `<button class="gtv2Btn ${a.id===selectedAttack?"good":""}" data-attack="${esc(a.id)}" ${disabled?"disabled":""}>${label}</button>`}).join("");
    const p=target&&selectedAttackActor()?E().attackPreview(battle,cur.id,target.id,selectedAttackActor().id):null;
    const approach=target&&!p?.ok&&p?.reason==="out-of-range"&&cur.movementLeft>0?`<button class="gtv2Btn warn" data-approach ${busy?"disabled":""}>👣 Approcher la cible</button>`:"";
    return `<div class="gtv2Actions">${attacks}${approach}<button class="gtv2Btn" data-end ${busy?"disabled":""}>Fin du tour</button></div>`;
  }
  function renderHint(){
    const cur=current();if(!cur)return "";
    if(notice)return `<div class="gtv2Hint warn">${esc(notice)}</div>`;
    if(cur.side!=="hero")return `<div class="gtv2Hint">L'ennemi joue. Le lancer D100 apparaît avant l'application du résultat.</div>`;
    const target=targetActor(),atk=selectedAttackActor();
    if(!target)return `<div class="gtv2Hint">1. Choisis une cible ci-dessous ou touche son pion. 2. Déplace-toi sur une case verte si nécessaire. 3. Appuie sur ton attaque.</div>`;
    const p=atk?E().attackPreview(battle,cur.id,target.id,atk.id):null;
    return `<div class="gtv2Hint ${p?.ok?"":"warn"}">${esc(previewReason(p))}</div>`;
  }
  function render(){
    if(!rootEl||!battle)return;refreshSelection();const cur=current(),target=targetActor();
    rootEl.innerHTML=`<div class="gtv2Shell"><div class="gtv2Top"><strong>⚔️ Combat tactique · manche ${battle.round}</strong><button class="gtv2Btn danger" data-close ${busy?"disabled":""}>Quitter le combat</button></div>
      <div class="gtv2Hud"><div class="gtv2Card"><strong>${cur?`Tour : ${esc(actorLabel(cur))}`:"Combat terminé"}</strong><br><small>${cur?`Mouvement ${cur.movementLeft}/${cur.movement} · Action ${cur.actionsLeft}`:""}</small></div><div class="gtv2Card"><strong>${target?`Cible : ${esc(actorLabel(target))}`:"Aucune cible"}</strong><br><small>${target?`PV ${target.hp}/${target.maxHp} · DEF ${target.defense} · ARM ${target.armor}`:"Touchez un ennemi ou utilisez la liste des cibles."}</small></div></div>
      <div class="gtv2BattleWrap">${renderGrid()}</div><div class="gtv2Legend">Vert = déplacement · Rouge = ennemi attaquable maintenant · Or = cible sélectionnée · ◈ = couvert.</div>${renderTargets()}${renderHint()}${renderActions()}
      ${battle.status==="ended"?`<div class="gtv2Winner">${battle.winner==="hero"?"🏆 Victoire":"💀 Défaite"}</div><div class="gtv2Actions"><button class="gtv2Btn good" data-commit>Appliquer le résultat et revenir au donjon</button></div>`:""}
      <div class="gtv2Card gtv2Log">${battle.log.slice(-20).reverse().map(x=>`<div>${esc(logText(x))}</div>`).join("")}</div></div>`;
    const g=rootEl.querySelector("[data-grid]");if(g)g.style.gridTemplateColumns=`repeat(${battle.grid.width},min(52px,11vw))`;
  }
  async function showRoll(result){
    if(!rootEl||!result?.ok)return;
    const attacker=E().actorById(battle,result.attackerId),target=E().actorById(battle,result.targetId),ok=!!result.hit;
    const layer=R.document.createElement("div");layer.className="gtv2DiceBackdrop";layer.innerHTML=`<div class="gtv2DiceCard"><div class="gtv2DiceTitle">${esc(actorLabel(attacker))} → ${esc(actorLabel(target))}</div><div class="gtv2Die">D100</div><div class="gtv2DiceResult">Jet en cours…</div></div>`;rootEl.appendChild(layer);
    const die=layer.querySelector(".gtv2Die"),res=layer.querySelector(".gtv2DiceResult"),card=layer.querySelector(".gtv2DiceCard");
    if(die?.animate)await waitAnimation(die.animate([{transform:"rotate(-12deg) scale(.82)"},{transform:"rotate(10deg) scale(1.08)",offset:.35},{transform:"rotate(-8deg) scale(.96)",offset:.7},{transform:"rotate(0deg) scale(1)"}],{duration:380,easing:"cubic-bezier(.15,.8,.25,1)",fill:"forwards"}));
    if(die)die.textContent=String(result.roll);if(res){res.className=`gtv2DiceResult ${ok?"ok":"fail"}`;res.textContent=ok?`✅ Touché · ${result.roll} ≤ ${result.hitChance} · ${result.damage} dégât(s)`:`❌ Raté · ${result.roll} > ${result.hitChance}`}
    if(card?.animate)await waitAnimation(card.animate([{transform:"scale(1)"},{transform:"scale(1.025)",offset:.45},{transform:"scale(1)"}],{duration:420,easing:"ease-out"}));
    layer.remove();
  }
  async function runAiUntilHero(){
    let guard=0;busy=true;render();
    while(battle?.status==="active"&&current()?.side==="enemy"&&guard++<50){
      const r=E().aiStep(battle);
      if(r?.attack?.ok)await showRoll(r.attack);
      if(battle?.status==="active"&&current()?.side==="enemy")render();
    }
    busy=false;notice="";render();
  }
  function clickCell(x,y){
    const cur=current();if(!cur||cur.side!=="hero"||battle.status!=="active"||busy)return;
    const a=battle.actors.find(q=>q.alive&&q.x===x&&q.y===y);
    if(a&&a.side!==cur.side){selectedTarget=a.id;notice="";render();return}
    if(a&&a.id!==cur.id)return;
    const r=E().moveActor(battle,cur.id,{x,y});if(r.ok){notice="";render()}else{notice=r.reason==="insufficient-movement"?"Pas assez de mouvement pour cette case.":"Case inaccessible.";render()}
  }
  function selectTarget(id){const cur=current(),a=E().actorById(battle,id);if(!cur||!a||!a.alive||a.side===cur.side)return;selectedTarget=a.id;notice="";render()}
  function moveTowardTarget(){
    const cur=current(),target=targetActor();if(!cur||!target||busy)return;
    const cells=E().reachableCells(battle,cur.id).filter(c=>c.cost>0);if(!cells.length){notice="Aucune case atteignable.";render();return}
    cells.sort((a,b)=>E().distance(a,target)-E().distance(b,target)||a.cost-b.cost);
    const best=cells[0],r=E().moveActor(battle,cur.id,best);if(r.ok){notice="";render()}else{notice="Impossible de s'approcher davantage.";render()}
  }
  async function doAttack(id){
    const cur=current();if(!cur||busy||cur.side!=="hero")return;
    selectedAttack=id;let target=targetActor();
    if(!target){
      const candidates=battle.actors.filter(a=>a.alive&&a.side!==cur.side).map(a=>({a,p:E().attackPreview(battle,cur.id,a.id,id)}));
      const valid=candidates.filter(x=>x.p.ok).sort((x,y)=>x.p.distance-y.p.distance)[0];
      if(valid){selectedTarget=valid.a.id;target=valid.a}else{notice="Choisis une cible, puis déplace-toi si elle est hors de portée.";render();return}
    }
    const preview=E().attackPreview(battle,cur.id,target.id,id);if(!preview.ok){notice=previewReason(preview);render();return}
    busy=true;notice="";render();
    const r=E().resolveAttack(battle,cur.id,target.id,id);if(!r.ok){busy=false;notice=previewReason(r);render();return}
    await showRoll(r);
    if(battle.status==="active"&&cur.actionsLeft<=0)E().endTurn(battle);
    if(battle.status==="active")await runAiUntilHero();else{busy=false;render()}
  }
  async function endHeroTurn(){if(battle?.status!=="active"||busy)return;const cur=current();if(cur?.side!=="hero")return;E().endTurn(battle);await runAiUntilHero()}
  function close(apply=false){
    if(busy)return null;const b=battle;let summary=null;
    if(apply&&b)try{summary=A()?.commitBattle?.(R,b,{removeDefeatedEnemies:true})||null}catch(e){console.error("tactical commit",e)}
    rootEl?.remove();rootEl=null;battle=null;selectedTarget="";selectedAttack="";notice="";
    const cb=options?.onFinish;const cancel=options?.onCancel;const oldOptions=options;options={};
    try{if(apply&&typeof cb==="function")cb({battle:b,summary,options:oldOptions});else if(!apply&&typeof cancel==="function")cancel({battle:b,options:oldOptions})}catch(e){console.error("tactical finish callback",e)}
    return b;
  }
  function onClick(ev){
    const btn=ev.target.closest?.("button");if(!btn)return;
    if(btn.hasAttribute("data-close")){close(false);return}if(btn.hasAttribute("data-commit")){close(true);return}if(btn.hasAttribute("data-end")){endHeroTurn();return}if(btn.hasAttribute("data-approach")){moveTowardTarget();return}
    if(btn.dataset.target){selectTarget(btn.dataset.target);return}if(btn.dataset.attack){doAttack(btn.dataset.attack);return}
    if(btn.dataset.x!==undefined&&btn.dataset.y!==undefined)clickCell(Number(btn.dataset.x),Number(btn.dataset.y));
  }
  function open(input,opts={}){
    if(!R.document)throw new Error("Tactical UI requires a document");if(!E())throw new Error("Tactical engine unavailable");
    ensureStyle();options=opts||{};battle=input?.actors?E().createBattle(input):A()?.createBattle?.(R,input||{});if(!battle)throw new Error("Cannot create tactical battle");
    rootEl=R.document.createElement("div");rootEl.className="gtv2Overlay";rootEl.setAttribute("data-gens-tactical-v2","1");rootEl.addEventListener("click",onClick);R.document.body.appendChild(rootEl);render();if(current()?.side==="enemy")runAiUntilHero();return battle;
  }
  function openCurrentEncounter(opts={}){return open(opts,opts)}
  function getBattle(){return battle}

  return {VERSION,APP_VERSION,open,openCurrentEncounter,close,getBattle,render,runAiUntilHero,showRoll,clickCell,doAttack,moveTowardTarget};
});
