
(function(){
/* V16.142 — buffs/debuffs réellement appliqués + visibles */

window.cap142NormStat=function(x){
 const k=String(x||"").toLowerCase().trim();
 const map={def:"defense",armor:"defense",armure:"defense",défense:"defense",
   atk:"force",attack:"force",attaque:"force",puissance:"force",power:"force",
   vitesse:"speed",initiative:"speed",agi:"agi",agility:"agi",agilité:"agi",
   esprit:"spirit",intelligence:"intelligence",int:"intelligence"};
 return map[k]||k;
};
window.cap142StatLabel=function(k){return ({defense:"Défense",force:"Puissance",speed:"Vitesse",agi:"Agilité",spirit:"Esprit",intelligence:"Intelligence"})[cap142NormStat(k)]||String(k||"Stat")};
window.cap142StatusIcon=function(st){
 const k=cap142NormStat(st.stat),down=st.kind==="debuff";
 if(k==="defense")return down?"🛡️⬇":"🛡️⬆";
 if(k==="force")return down?"⚔️⬇":"⚔️⬆";
 if(k==="speed")return down?"⚡⬇":"⚡⬆";
 if(k==="agi")return down?"💨⬇":"💨⬆";
 if(st.kind==="dot")return"☠️";
 if(st.kind==="hot")return"💚";
 return down?"🔻":"🔺";
};

/* +1/+2 anciens deviennent de vrais bonus en % : +30/+40/+50.
   Les valeurs >=20 sont considérées directement comme pourcentages. */
window.cap142EffectPct=function(v){
 v=Number(v)||0;const sign=v<0?-1:1,a=Math.abs(v);
 if(a===0)return 0;
 if(a<20)return sign*(a<=2?30:a<=5?40:50);
 return v;
};
window.cap142ActiveMods=function(c){
 const out={defense:0,force:0,speed:0,agi:0,spirit:0,intelligence:0};
 (c?.statuses||[]).forEach(st=>{
   if(!["buff","debuff"].includes(String(st.kind)))return;
   const k=cap142NormStat(st.stat);if(!(k in out))return;
   let p=cap142EffectPct(st.value);
   if(st.kind==="debuff"&&p>0)p=-p;
   out[k]+=p;
 });
 return out;
};
window.cap142BaseStats=function(c){
 const d=captureCreatureDerivedStats(c?.source?._instance||{},c?.source||{});
 return {defense:Number(d.defense)||0,force:Number(d.force)||0,speed:Number(d.speed)||0,agi:Number(d.agi)||0,spirit:Number(d.spirit)||0,intelligence:Number(d.intelligence)||0};
};
window.cap142EffectiveStats=function(c){
 const b=cap142BaseStats(c),m=cap142ActiveMods(c),r={};
 Object.keys(b).forEach(k=>r[k]=Math.max(0,Math.round(b[k]*(1+(m[k]||0)/100))));
 return {base:b,mods:m,effective:r};
};

/* Applique les buffs au calcul réel des dégâts.
   Défense cible et Puissance acteur sont donc immédiatement effectives. */
const damage142=window.captureBattleDamageValue;
window.captureBattleDamageValue=function(actor,ability,effect){
 let v=damage142(actor,ability,effect);
 const m=cap142ActiveMods(actor),mult=1+(m.force||0)/100;
 return Math.max(1,Math.round(v*Math.max(.1,mult)));
};

/* Intercepte le calcul de stats dérivées uniquement pendant les résolutions combat
   pour que Défense/Agilité/Vitesse modifiées servent aussi au moteur existant. */
const apply142=window.captureBattleApplyAbility;
window.captureBattleApplyAbility=function(battle,actor,ability,target){
 /* normalise la capacité AVANT application */
 if(ability?.effects){
   ability={...ability,effects:ability.effects.map(e=>{
     const kind=String(e.kind||"").toLowerCase();
     if(kind==="buff"||kind==="debuff"){
       let pct=cap142EffectPct(e.value);
       if(kind==="debuff")pct=Math.abs(pct); // le signe vient du kind
       return {...e,stat:cap142NormStat(e.stat),value:pct,duration:Math.max(2,Number(e.duration)||3)};
     }
     return e;
   })};
 }
 const before=(target?.statuses||[]).length;
 const r=apply142(battle,actor,ability,target);
 if(r?.ok && target){
   /* améliore le journal et garantit les métadonnées */
   (target.statuses||[]).slice(before).forEach(st=>{
     if(st.kind==="buff"||st.kind==="debuff"){
       st.stat=cap142NormStat(st.stat);st.value=Math.abs(cap142EffectPct(st.value));st.duration=Math.max(1,Number(st.duration)||1);
       battle.log.push({round:battle.round,type:"status",text:`${target.name} : ${cap142StatLabel(st.stat)} ${st.kind==="buff"?"+":"−"}${st.value}% pendant ${st.duration} tour${st.duration>1?"s":""}.`});
     }
   });
 }
 return r;
};

/* Défense effective dans l'ancien calcul : on ajuste les dégâts finaux selon
   le delta entre défense de base et défense buffée/debuffée. */
const applyDef142=window.captureBattleApplyAbility;
window.captureBattleApplyAbility=function(battle,actor,ability,target){
 if(!target)return applyDef142(battle,actor,ability,target);
 const hp0=Number(target.hp)||0;
 const st=cap142EffectiveStats(target);
 const r=applyDef142(battle,actor,ability,target);
 if(r?.ok && r.damage>0 && st.mods.defense){
   /* moteur ancien a déjà utilisé baseDef : conversion vers effectiveDef */
   const base=Math.max(0,st.base.defense),eff=Math.max(0,st.effective.defense);
   const corrected=Math.max(1,Math.round(r.damage*(100+base)/(100+eff)));
   const diff=corrected-r.damage;
   target.hp=Math.max(0,Math.min(target.maxHp,(Number(target.hp)||0)-diff));
   r.damage=corrected;
   if(battle.lastFx)battle.lastFx.damage=corrected;
   battle.log.push({round:battle.round,type:"detail",text:`Défense modifiée : ${base} ${st.mods.defense>0?"+":"−"} ${Math.abs(eff-base)} → ${eff}. Dégâts finaux : ${corrected}.`});
 }
 return r;
};

/* badges + stats visibles directement sous chaque créature */
window.cap142RenderEffects=function(c){
 const sts=(c?.statuses||[]).filter(st=>Number(st.duration)>0);
 if(!sts.length)return '<div class="capEffects142 emptyfx">Aucun effet actif</div>';
 return `<div class="capEffects142">${sts.map(st=>{
   const pct=["buff","debuff"].includes(st.kind)?Math.abs(cap142EffectPct(st.value)):Number(st.value)||0;
   const txt=st.kind==="buff"?`+${pct}% ${cap142StatLabel(st.stat)}`:st.kind==="debuff"?`−${pct}% ${cap142StatLabel(st.stat)}`:st.name||"Effet";
   return `<span class="${st.kind||""}" title="${z40kEscAttr(st.name||txt)}">${cap142StatusIcon(st)} <b>${z40kEscHtml(txt)}</b> · ${Number(st.duration)||0}t</span>`;
 }).join("")}</div>`;
};
window.cap142RenderStats=function(c){
 const x=cap142EffectiveStats(c),one=(k,label)=>{
   const b=x.base[k],e=x.effective[k],delta=e-b;
   return `<span><b>${label}</b> ${b}${delta?` <em class="${delta>0?"up":"down"}">${delta>0?"+":"−"} ${Math.abs(delta)}</em> = <strong>${e}</strong>`:""}</span>`;
 };
 return `<div class="capStats142">${one("defense","DEF")}${one("force","PUI")}${one("speed","VIT")}${one("agi","AGI")}</div>`;
};

const render142=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
 render142(b);const host=document.getElementById("captureBattleLiveBody");if(!host||!b||b.phase==="ended")return;
 host.querySelectorAll(".captureFightMon").forEach(card=>{
   const name=card.querySelector("strong")?.textContent||"";let c=null;
   for(const k of ["A","B"]){c=(b.sides?.[k]?.creatures||[]).find(x=>x.name===name);if(c)break}
   if(!c)return;
   card.querySelector(".capStats142")?.remove();card.querySelector(".capEffects142")?.remove();
   const info=card.querySelector(".captureFightInfo")||card;
   info.insertAdjacentHTML("beforeend",cap142RenderStats(c)+cap142RenderEffects(c));
 });
};

/* texte des capacités : joueur voit désormais l'effet réel */
const txt142=window.capturePlayerAbilityText132;
window.capturePlayerAbilityText132=function(a){
 if(!a)return txt142?.(a)||"";
 const bits=[];
 (a.effects||[]).forEach(e=>{
   const k=String(e.kind||"").toLowerCase();
   if(k==="buff"||k==="debuff"){
     const pct=Math.abs(cap142EffectPct(e.value)),dur=Math.max(2,Number(e.duration)||3);
     bits.push(`${k==="buff"?"Augmente":"Réduit"} ${cap142StatLabel(e.stat)} de ${pct}% pendant ${dur} tours`);
   }
 });
 return bits.length?bits.join(" · "):(txt142?.(a)||a.desc||"");
};
})();
