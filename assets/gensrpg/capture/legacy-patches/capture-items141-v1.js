
(function(){
const ITEMS141=[
{id:"cap_ball",name:"Capsule de capture",type:"capture",cat:"Capture",desc:"Capsule standard pour tenter de capturer une créature sauvage.",price:20,captureBonus:0,rarity:"Commun"},
{id:"cap_ball_plus",name:"Capsule renforcée",type:"capture",cat:"Capture",desc:"Améliore sensiblement les chances de capture.",price:65,captureBonus:20,rarity:"Peu commun"},
{id:"cap_ball_ultra",name:"Capsule experte",type:"capture",cat:"Capture",desc:"Capsule haut de gamme pour les créatures rares et puissantes.",price:150,captureBonus:40,rarity:"Rare"},
{id:"cap_potion_s",name:"Potion de soin",type:"heal",cat:"Soin",desc:"Restaure 20 PV à une créature.",price:30,heal:20,rarity:"Commun"},
{id:"cap_potion_m",name:"Super potion",type:"heal",cat:"Soin",desc:"Restaure 50 PV à une créature.",price:70,heal:50,rarity:"Peu commun"},
{id:"cap_potion_full",name:"Potion complète",type:"heal",cat:"Soin",desc:"Restaure tous les PV d'une créature.",price:180,healFull:true,rarity:"Rare"},
{id:"cap_antidote",name:"Antidote",type:"status",cat:"Soin",desc:"Retire Poison.",price:20,clearStatus:"poison",rarity:"Commun"},
{id:"cap_remedy",name:"Remède universel",type:"status",cat:"Soin",desc:"Retire les altérations négatives principales.",price:75,clearAllStatus:true,rarity:"Peu commun"},
{id:"cap_revive",name:"Cristal de réveil",type:"revive",cat:"Soin",desc:"Réveille une créature K.O. avec 35 % de ses PV.",price:140,revivePct:35,rarity:"Rare"},
{id:"cap_attack_tonic",name:"Tonique de puissance",type:"battle_buff",cat:"Combat",desc:"Augmente la Puissance de 30 % pendant 3 tours.",price:60,stat:"force",buffPct:30,duration:3,rarity:"Peu commun"},
{id:"cap_guard_tonic",name:"Tonique de garde",type:"battle_buff",cat:"Combat",desc:"Augmente la Défense de 30 % pendant 3 tours.",price:60,stat:"defense",buffPct:30,duration:3,rarity:"Peu commun"},
{id:"cap_speed_tonic",name:"Tonique de célérité",type:"battle_buff",cat:"Combat",desc:"Augmente la Vitesse de 30 % pendant 3 tours.",price:60,stat:"speed",buffPct:30,duration:3,rarity:"Peu commun"},
{id:"cap_smoke",name:"Bombe fumigène",type:"escape",cat:"Combat",desc:"Facilite fortement la fuite d'un combat sauvage.",price:45,escapeBonus:75,rarity:"Peu commun"},
{id:"loot_herb",name:"Herbe aromatique",type:"loot",cat:"Butin",desc:"Plante recherchée par les herboristes. Principalement destinée à la vente.",price:18,sellValue:18,rarity:"Commun",lootOnly:true},
{id:"loot_fang",name:"Croc poli",type:"loot",cat:"Butin",desc:"Croc intact récupéré après un combat. Se revend correctement.",price:28,sellValue:28,rarity:"Commun",lootOnly:true},
{id:"loot_scale",name:"Écaille irisée",type:"loot",cat:"Butin",desc:"Écaille aux reflets inhabituels appréciée des collectionneurs.",price:55,sellValue:55,rarity:"Peu commun",lootOnly:true},
{id:"loot_crystal",name:"Cristal élémentaire",type:"loot",cat:"Butin",desc:"Cristal chargé d'énergie élémentaire. Objet de valeur.",price:85,sellValue:85,rarity:"Rare",lootOnly:true},
{id:"loot_core",name:"Noyau énergétique",type:"loot",cat:"Butin",desc:"Noyau condensé provenant d'une créature puissante.",price:130,sellValue:130,rarity:"Rare",lootOnly:true},
{id:"loot_relic",name:"Relique ancienne",type:"loot",cat:"Butin",desc:"Objet ancien sans utilité immédiate, mais extrêmement recherché.",price:220,sellValue:220,rarity:"Épique",lootOnly:true},
{id:"loot_gem",name:"Gemme prismatique",type:"loot",cat:"Butin",desc:"Gemme exceptionnelle aux couleurs changeantes.",price:350,sellValue:350,rarity:"Légendaire",lootOnly:true}
];
window.captureItemCatalog141=()=>ITEMS141;

/* catalogue Capture = base conséquente + objets personnalisés pertinents */
const shopOld141=window.captureShopItems;
window.captureShopItems=function(){
 let custom=[];try{custom=ITEMS.filter(it=>{const t=String(it.type||"").toLowerCase();return t.includes("capture")||t.includes("heal")||t.includes("status")}).slice(0,20)}catch(e){}
 const ids=new Set(ITEMS141.map(x=>x.id));
 return [...ITEMS141,...custom.filter(x=>!ids.has(x.id))];
};
window.captureItemById141=id=>captureShopItems().find(x=>String(x.id)===String(id))||null;

/* prix de revente : le loot garde sa vraie valeur, consommables = 50 % */
window.captureItemSellPrice=function(it){
 if(it?.lootOnly)return Math.max(1,Number(it.sellValue??it.price??1)||1);
 return Math.max(1,Math.floor(Math.max(0,Number(it?.price??it?.value??10)||0)*.5));
};

/* magasin : ne vend pas les trésors loot-only */
const renderShopOld141=window.renderCaptureShop;
window.renderCaptureShop=function(){
 renderShopOld141();
 if(captureShopTab!=="buy")return;
 const host=document.getElementById("captureShopList");if(!host)return;
 const heroId=captureActiveHeroId(),st=heroId?loadState(heroId):null;
 const items=captureShopItems().filter(x=>!x.lootOnly);
 host.innerHTML=items.map(it=>`<div class="v2LibCard capItem141">
   <div class="capItemHead141"><strong>${z40kEscHtml(it.name)}</strong><span>${z40kEscHtml(it.rarity||it.cat||"Objet")}</span></div>
   <div class="small">${z40kEscHtml(it.desc||"")}</div>
   <div class="v2LibActions"><button onclick="captureBuyItem('${z40kEscAttr(it.id)}')">🪙 ${Math.max(0,Number(it.price)||0)} · ACHETER</button></div>
 </div>`).join("");
};

/* générateur de loot séparé des objets de boutique */
window.captureRollLoot141=function(battle){
 const trainer=battle?.type==="trainer",levels=(battle?.sides?.B?.creatures||[]).map(c=>Number(c.level)||1);
 const avg=levels.length?levels.reduce((a,b)=>a+b,0)/levels.length:1;
 const chance=Math.min(.72,(trainer?.30:.38)+avg*.006);
 if(Math.random()>chance)return null;
 const pool=ITEMS141.filter(x=>x.lootOnly);
 let roll=Math.random(),tier=roll<.55?0:roll<.82?1:roll<.95?2:3;
 const eligible=pool.filter(x=>{
   const r=x.rarity;return tier===0?r==="Commun":tier===1?r==="Peu commun":tier===2?r==="Rare":["Épique","Légendaire"].includes(r)
 });
 return eligible[Math.floor(Math.random()*eligible.length)]||pool[0];
};

/* récompenses : or + possibilité consommable + trésor de vente */
const rewardOld141=window.captureGenerateBattleRewards;
window.captureGenerateBattleRewards=function(battle){
 const rw=rewardOld141(battle)||{gold:0,itemId:"",itemName:""};
 if(!rw._items141){
   const loot=captureRollLoot141(battle);
   rw.lootId=loot?.id||"";rw.lootName=loot?.name||"";rw.lootValue=loot?captureItemSellPrice(loot):0;
   /* l'ancien drop ne doit jamais donner un objet loot-only par hasard via le shop étendu */
   if(rw.itemId && captureItemById141(rw.itemId)?.lootOnly){rw.itemId="";rw.itemName=""}
   rw._items141=true;
   battle.captureRewards=rw;
 }
 return rw;
};

const grantOld141=window.captureGrantBattleRewards;
window.captureGrantBattleRewards=function(battle){
 const rw=captureGenerateBattleRewards(battle)||{};
 const already=battle?.rewardsGranted;
 const result=grantOld141(battle)||rw;
 if(!already&&rw.lootId){
   const heroId=captureActiveHeroId();if(heroId){
     const st=loadState(heroId);st.inventory=Array.isArray(st.inventory)?st.inventory:[];
     const it=captureItemById141(rw.lootId),f=st.inventory.find(x=>String(x.itemId||x.id)===String(rw.lootId));
     if(f)f.qty=(Number(f.qty)||0)+1;
     else if(it)st.inventory.push({itemId:it.id,id:it.id,name:it.name,type:it.type,desc:it.desc,qty:1,rarity:it.rarity,lootOnly:true,price:it.price,sellValue:it.sellValue,virtual:true});
     localStorage.setItem(key(heroId),JSON.stringify(st));if(String(heroId)===String(current))state=st;
   }
 }
 return result;
};

/* ajoute le loot à l'écran de victoire après rendu */
const renderBattleOld141=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
 renderBattleOld141(b);
 if(!b||b.phase!=="ended"||b.victory?.winner!=="A")return;
 const host=document.getElementById("captureBattleLiveBody"),box=host?.querySelector(".captureRewardBox");if(!host)return;
 const rw=b.captureRewards;
 if(rw?.lootName && !host.querySelector(".capLootReward141")){
   const d=document.createElement("div");d.className="capLootReward141";
   d.innerHTML=`📦 <b>${z40kEscHtml(rw.lootName)}</b> <small>· valeur de vente ${Number(rw.lootValue)||0} 🪙</small>`;
   (box||host.querySelector(".captureVictory"))?.appendChild(d);
 }
};

/* inventaire / vente : récupère correctement les métadonnées des nouveaux objets */
const sellOld141=window.captureSellItem;
window.captureSellItem=function(itemId){
 const heroId=captureActiveHeroId();if(!heroId)return;
 const st=loadState(heroId),entry=(st.inventory||[]).find(x=>String(x.itemId||x.id)===String(itemId));
 const cat=captureItemById141(itemId);
 if(entry&&cat){entry.price=cat.price;entry.sellValue=cat.sellValue;entry.lootOnly=cat.lootOnly;entry.desc=cat.desc;entry.name=cat.name}
 localStorage.setItem(key(heroId),JSON.stringify(st));
 return sellOld141(itemId);
};
})();
