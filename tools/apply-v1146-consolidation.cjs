const fs=require('node:fs');

function read(p){return fs.readFileSync(p,'utf8')}
function write(p,s){fs.writeFileSync(p,s)}
function mustReplace(s,from,to,label){
  if(!s.includes(from))throw new Error('Missing patch target: '+label);
  return s.replace(from,to);
}
function mustRegex(s,re,to,label){
  if(!re.test(s))throw new Error('Missing regex target: '+label);
  return s.replace(re,to);
}

// 1) Base Tactical UI becomes the single dice presentation owner and uses the Builder wall asset directly.
{
  const p='assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js';let s=read(p);
  s=mustReplace(s,'const WALL_ASSET="assets/dungeon/creatures/dungeon_wall.png";','const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";','base wall asset');
  s=mustReplace(s,".gtv2Cell.blocked{background:#191714 url('${WALL_ASSET}') center/cover no-repeat!important;filter:saturate(.9) brightness(.72)}",".gtv2Cell.blocked{background:#171512 url('${WALL_ASSET}') center/cover no-repeat!important;filter:none!important}",'base wall direct cover');
  const dice=`  async function showDiceResult(attacker,target,result,phase){
    const doc=D();if(!doc||!result?.ok)return;
    if(!doc.getElementById("gtv21146DiceStyle")){const st=doc.createElement("style");st.id="gtv21146DiceStyle";st.textContent='.gtv21146DiceRow{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin:9px 0}.gtv21146DiceRow .gtv2Die{width:62px;height:62px;font-size:26px;animation:gtv21146Dice .24s cubic-bezier(.2,.8,.25,1) both}.gtv2DiceCard.gtv21146Rolling .gtv2DiceResult,.gtv2DiceCard.gtv21146Rolling .gtv2DiceRule strong,.gtv2DiceCard.gtv21146Rolling .gtv2112Explain{visibility:hidden!important}@keyframes gtv21146Dice{0%{transform:translateY(5px) rotate(-5deg) scale(.96)}45%{transform:translateY(-3px) rotate(4deg) scale(1.03)}100%{transform:none}}@media(max-width:430px){.gtv21146DiceRow .gtv2Die{width:54px;height:54px;font-size:23px}}';(doc.head||doc.documentElement||doc.body)?.appendChild(st)}
    const row=[...arr(battle?.log)].reverse().find(x=>x?.type==="attack"&&x.attackerId===attacker.id&&x.targetId===target.id);const raw=arr(result?.rollsDisplay).length?arr(result.rollsDisplay):arr(row?.rollsDisplay).length?arr(row.rollsDisplay):[result.roll];const rolls=raw.filter(v=>Number.isFinite(Number(v))).map(v=>clamp(Math.round(num(v,1)),1,100));if(!rolls.length)rolls.push(clamp(Math.round(num(result.roll,1)),1,100));
    const high=result.rollHighToHit!==false,threshold=result.hitTarget??ruleTarget(result.hitChance,high),dice=rolls.length,hits=Math.max(0,Math.round(num(result.hits,result.hit?1:0))),resultText=dice>1?(hits?\`TOUCHÉ · \${hits}/\${dice} dé(s) · \${result.damage} dégât(s)\`:\`RATÉ · 0/\${dice} dé(s)\`):(result.hit?\`TOUCHÉ · \${result.damage} dégât(s)\`:"RATÉ");
    const overlay=doc.createElement("div");overlay.className="gtv2DiceBackdrop";overlay.innerHTML=\`<div class="gtv2DiceCard gtv21146Rolling" data-v113-dice="single-owner-v1146"><div class="gtv2DicePhase">\${esc(phase)}</div><div class="gtv2DiceTitle">\${esc(actorDisplayName(attacker))} attaque \${esc(actorDisplayName(target))}</div><div class="gtv2DiceSub">\${attacker.side==="enemy"?"Tour d’initiative ennemi — ce n’est pas une riposte automatique.":"Attaque du héros"}</div><div class="gtv21146DiceRow" data-dice-row>\${rolls.map(()=>'<div class="gtv2Die" data-v1146-die>…</div>').join("")}</div><div class="gtv2DiceResult \${result.hit?"ok":"fail"}" data-result style="visibility:hidden">\${resultText}</div><div class="gtv2DiceRule">Réussite si \${high?"D100 ≥":"D100 ≤"} \${threshold} · jet obtenu : <strong style="visibility:hidden">\${rolls.join(" · ")}</strong></div><button class="gtv2Btn good" data-dice-continue disabled>Continuer</button></div>\`;
    doc.body.appendChild(overlay);const card=overlay.querySelector(".gtv2DiceCard"),faces=[...overlay.querySelectorAll("[data-v1146-die]")],button=overlay.querySelector("[data-dice-continue]"),resultEl=overlay.querySelector("[data-result]"),ruleStrong=overlay.querySelector(".gtv2DiceRule strong");
    const randomize=()=>faces.forEach(face=>face.textContent=String(1+Math.floor(Math.random()*100)));randomize();let timer=null;if(typeof setInterval==="function")timer=setInterval(randomize,40);await new Promise(resolve=>setTimeout(resolve,240));if(timer!=null)clearInterval(timer);faces.forEach((face,i)=>face.textContent=String(rolls[i]));card?.classList?.remove?.("gtv21146Rolling");if(resultEl)resultEl.style.visibility="visible";if(ruleStrong)ruleStrong.style.visibility="visible";if(button)button.disabled=false;
    await new Promise(resolve=>{if(!button){overlay.remove();resolve();return}button.addEventListener("click",()=>{overlay.remove();resolve()},{once:true})})
  }
  function nearestOpponent`;
  s=mustRegex(s,/  async function showDiceResult\(attacker,target,result,phase\)\{[\s\S]*?\n  \}\n  function nearestOpponent/,dice,'base single dice owner');
  write(p,s);
}

// 2) V111 keeps multi-dice combat resolution, but no longer rewrites dice DOM. Walls use cover like floors.
{
  const p='assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js';let s=read(p);
  s=mustReplace(s,'const WALL_SIZE="100% 100%";','const WALL_SIZE="cover";','V111 wall size');
  s=mustRegex(s,/  function paintDiceOverlay\(rt=R\)\{[\s\S]*?\n  function bindClicks/,`  function paintDiceOverlay(rt=R){return false}\n  function bindClicks`,'disable V111 dice DOM renderer');
  write(p,s);
}

// 3) V112 remains explanation/detail authority, but wall rendering is direct and it never animates or replaces dice.
{
  const p='assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js';let s=read(p);
  const oldWall=`    .\${WALL_CLASS},.gtv2Cell.blocked,#drc100Grid .drc100Cell.wall{position:relative!important;background-image:none!important;overflow:hidden!important}\n    .\${WALL_CLASS}::before,.gtv2Cell.blocked::before,#drc100Grid .drc100Cell.wall::before{content:"";position:absolute;inset:0;z-index:0;background:url("\${WALL_ASSET}") center/cover no-repeat!important;pointer-events:none;transform:translateZ(0)}\n    .\${WALL_CLASS}>*,.gtv2Cell.blocked>* ,#drc100Grid .drc100Cell.wall>*{position:relative;z-index:1}.dav167870WallCell.\${WALL_CLASS}>*{visibility:hidden!important}`;
  const newWall=`    .\${WALL_CLASS},.gtv2Cell.blocked,#drc100Grid .drc100Cell.wall{position:relative!important;background:#171512 url("\${WALL_ASSET}") center/cover no-repeat!important;overflow:hidden!important}\n    .\${WALL_CLASS}::before,.gtv2Cell.blocked::before,#drc100Grid .drc100Cell.wall::before{content:none!important;display:none!important}\n    .\${WALL_CLASS}>*,.gtv2Cell.blocked>* ,#drc100Grid .drc100Cell.wall>*{position:relative;z-index:1}.dav167870WallCell.\${WALL_CLASS}>*{visibility:hidden!important}`;
  s=mustReplace(s,oldWall,newWall,'V112 direct wall CSS');
  const oldDiceCss='.gtv2112Explain{margin-top:8px;padding:8px 9px;background:#151c25;border:1px solid #39495a;border-radius:9px;font-size:12px;line-height:1.4}.gtv2111DiceRow .gtv2Die,.gtv2DiceCard>.gtv2Die{animation:gtv2112DiceRoll .72s cubic-bezier(.18,.8,.28,1)}@keyframes gtv2112DiceRoll{0%{transform:rotate(-20deg) scale(.72);filter:blur(1px)}35%{transform:rotate(15deg) scale(1.12)}70%{transform:rotate(-7deg) scale(.96)}100%{transform:rotate(0) scale(1);filter:none}}';
  const newDiceCss='.gtv2112Explain{margin-top:8px;padding:8px 9px;background:#151c25;border:1px solid #39495a;border-radius:9px;font-size:12px;line-height:1.4}';
  s=mustReplace(s,oldDiceCss,newDiceCss,'remove V112 dice animation');
  const funcs=`  function markWallCells(rt=R){const D=doc(rt);if(!D)return 0;let n=0;const state=runtimeState(rt),kinds=arr(state?.last?.map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];for(let i=0;i<cells.length;i++){const wall=normalizeText(kinds[i])==="wall"||cells[i].classList?.contains?.("dav167870WallCell");if(!wall)continue;const el=cells[i];el.classList?.add(WALL_CLASS);el.style?.setProperty?.("background-image",\`url("\${WALL_ASSET}")\`,"important");el.style?.setProperty?.("background-size","cover","important");el.style?.setProperty?.("background-position","center","important");el.style?.setProperty?.("background-repeat","no-repeat","important");n++}for(const el of D.querySelectorAll?.(".gtv2Cell.blocked,#drc100Grid .drc100Cell.wall,#dc047RoomBoard .dav167870WallCell")||[]){el.classList?.add(WALL_CLASS);el.style?.setProperty?.("background-image",\`url("\${WALL_ASSET}")\`,"important");el.style?.setProperty?.("background-size","cover","important");el.style?.setProperty?.("background-position","center","important");el.style?.setProperty?.("background-repeat","no-repeat","important");n++}return n}\n  function patchDice(rt=R){const D=doc(rt),card=D?.querySelector?.(".gtv2DiceCard");if(!card)return false;const row=latestAttackRow(rt);if(!row)return false;let note=card.querySelector?.(".gtv2112Explain");if(!note){note=D.createElement("div");note.className="gtv2112Explain";const button=card.querySelector?.("[data-dice-continue]");if(button)card.insertBefore(note,button);else card.appendChild(note)}note.textContent=explainAttack(row);return true}\n  function maintain`;
  s=mustRegex(s,/  function markWallCells\(rt=R\)\{[\s\S]*?\n  function maintain/,funcs,'V112 direct wall + explanation-only dice');
  write(p,s);
}

// 4) V113 keeps room/sub-room scope and detection only. Wall repaint becomes idempotent; its old 680 ms dice animation is disabled.
{
  const p='assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js';let s=read(p);
  s=mustReplace(s,'const WALL_ASSET="assets/dungeon/creatures/dungeon_wall.png";','const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";','V113 wall asset');
  s=s.replace(/100% 100%/g,'cover');
  s=mustRegex(s,/  function paintWalls\(rt=R\)\{[\s\S]*?\n\n  function latestAttackRow/,`  function paintWalls(rt=R){let n=0;for(const el of wallTargets(rt)){el.classList?.add?.("gtv2113Wall");if(el?.style?.setProperty){el.style.setProperty("background-image",\`url("\${WALL_ASSET}")\`,"important");el.style.setProperty("background-size","cover","important");el.style.setProperty("background-position","center","important");el.style.setProperty("background-repeat","no-repeat","important")}n++}return n}\n\n  function latestAttackRow`,'V113 idempotent wall painter');
  s=mustRegex(s,/  function animateDiceOverlay\(rt=R\)\{[\s\S]*?\n  \}\n\n  function maintain/,`  function animateDiceOverlay(rt=R){return false}\n\n  function maintain`,'disable V113 dice animation');
  const old='const wrapped=function(runtime,options={}){const realRt=runtime||rt,sel=selectCombatants(realRt,options||{}),next={...(options||{}),heroIds:sel.heroIds,enemyIds:sel.enemyIds},battle=base.call(this,realRt,next);applyRuntimePositions(realRt,battle,sel);return battle};';
  const neu='const wrapped=function(runtime,options={}){const realRt=runtime||rt,sel=selectCombatants(realRt,options||{}),next={...(options||{}),heroIds:sel.heroIds,enemyIds:sel.enemyIds},battle=base.call(this,realRt,next);applyRuntimePositions(realRt,battle,sel);try{realRt?.GensRpgTacticalStats1678110?.decorateBattle?.(realRt,battle,{force:true})}catch(e){}return battle};';
  s=mustReplace(s,old,neu,'V113 final canonical stat snapshot');
  write(p,s);
}

// 5) Retire the failed V114.5 wall/dice/stat overlay. V114.3 stays for transition/menu, V114.4 for session guard.
{
  const p='assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js';let s=read(p);
  s=mustRegex(s,/\n  function loadFinal1145\(\)\{[\s\S]*?\n  \}\n\n  function loadVisualDice1143/,`\n  function loadVisualDice1143`,'remove V114.5 loader');
  s=mustReplace(s,'const install=()=>{try{R.GensRpgTacticalVisualDice16781142?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V114.3 tactical UX install",e)}loadFinal1145()};','const install=()=>{try{R.GensRpgTacticalVisualDice16781142?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V114.3 tactical UX install",e)}};','stop V114.5 after V114.3');
  s=mustReplace(s,'s.async=false;s.onload=install;s.onerror=()=>{console.error("GenSrpG V114.3 tactical UX load failed");loadFinal1145()};','s.async=false;s.onload=install;s.onerror=()=>console.error("GenSrpG V114.3 tactical UX load failed");','V114.3 error path');
  s=s.replace('     V114.5 loads last: pre-painted wall cells, one short D100 animation and current canonical hero stats link.','     V114.6 consolidates wall and dice ownership in the base tactical UI; V110 remains the sole canonical stats bridge.');
  write(p,s);
}

// 6) PWA cache bump. Keep the retired V114.5 file out of the active precache path.
{
  const p='service-worker.js';let s=read(p);
  s=mustReplace(s,'const CACHE_NAME = "gensrpg-cache-16.78.114.5-wall-dice-stats";','const CACHE_NAME = "gensrpg-cache-16.78.114.6-consolidated-tactical-runtime";','cache bump');
  s=s.replace(',"./assets/gensrpg/gens-rpg-tactical-wall-dice-stats-16781145.js"','');
  write(p,s);
}

console.log('V16.78.114.6 consolidation patch applied');
