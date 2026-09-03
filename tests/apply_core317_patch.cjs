const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const indexPath=path.join(root,'index.html');
const swPath=path.join(root,'service-worker.js');
let html=fs.readFileSync(indexPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');

function replaceLastExact(src,oldText,newText,label){
  if(src.includes(newText))return src;
  const i=src.lastIndexOf(oldText);
  if(i<0)throw new Error('Core 3.17 target missing: '+label);
  return src.slice(0,i)+newText+src.slice(i+oldText.length);
}
function replaceAllExact(src,oldText,newText,label,min=1){
  if(src.includes(newText)&&!src.includes(oldText))return src;
  const parts=src.split(oldText),count=parts.length-1;
  if(count<min){
    if(src.includes(newText))return src;
    throw new Error('Core 3.17 target missing: '+label);
  }
  return parts.join(newText);
}

// Version visible : la chaîne courante est promue sans toucher aux anciennes versions de fichiers.
html=html.replaceAll('16.78.10','16.78.11');

// Réglages d'économie : stock initial éditable par catégorie.
const ecoOld='economy:{enabled:false,currencyName:"Or",currencyIcon:"🪙",startingGold:0,sellPercent:50,merchantBuyMultiplier:1,enemyGoldEnabled:true,merchantEventEnabled:true}';
const ecoNew='economy:{enabled:false,currencyName:"Or",currencyIcon:"🪙",startingGold:0,sellPercent:50,merchantBuyMultiplier:1,merchantStockLimits:{weapons:3,equipment:3,consumables:3,other:3},enemyGoldEnabled:true,merchantEventEnabled:true}';
html=replaceAllExact(html,ecoOld,ecoNew,'economy defaults',2);

const tradeOld='      <label>Prix de revente (% du prix objet)<input id="rpgSellPercent" type="number" min="0" max="1000" value="50"></label>\n      <div class="smodMini">Chaque objet possède sa valeur de base. Le marchand calcule automatiquement les prix avec ces réglages.</div>';
const tradeNew='      <label>Prix de revente (% du prix objet)<input id="rpgSellPercent" type="number" min="0" max="1000" value="50"></label>\n      <div class="dungeonRulesEditorGrid" style="margin-top:8px">\n        <label>Stock Armes<input id="rpgMerchantStockWeapons" type="number" min="0" max="999" value="3"></label>\n        <label>Stock Équipements<input id="rpgMerchantStockEquipment" type="number" min="0" max="999" value="3"></label>\n        <label>Stock Consommables<input id="rpgMerchantStockConsumables" type="number" min="0" max="999" value="3"></label>\n        <label>Stock Autres<input id="rpgMerchantStockOther" type="number" min="0" max="999" value="3"></label>\n      </div>\n      <div class="smodMini">Chaque objet possède sa valeur de base. Le marchand calcule automatiquement les prix et le stock avec ces réglages.</div>';
html=replaceLastExact(html,tradeOld,tradeNew,'economy stock editor');

const ecoRenderOld='set("rpgMerchantBuyMultiplier",eco.merchantBuyMultiplier??1);set("rpgEnemyGoldEnabled",String(eco.enemyGoldEnabled!==false));';
const ecoRenderNew='set("rpgMerchantBuyMultiplier",eco.merchantBuyMultiplier??1);const stock317=eco.merchantStockLimits||{};set("rpgMerchantStockWeapons",stock317.weapons??3);set("rpgMerchantStockEquipment",stock317.equipment??3);set("rpgMerchantStockConsumables",stock317.consumables??3);set("rpgMerchantStockOther",stock317.other??3);set("rpgEnemyGoldEnabled",String(eco.enemyGoldEnabled!==false));';
html=replaceLastExact(html,ecoRenderOld,ecoRenderNew,'economy editor values');

const ecoSaveOld='  e.merchantBuyMultiplier=Math.max(0,Number(document.getElementById("rpgMerchantBuyMultiplier")?.value)||1);\n  e.enemyGoldEnabled=document.getElementById("rpgEnemyGoldEnabled")?.value!=="false";';
const ecoSaveNew='  e.merchantBuyMultiplier=Math.max(0,Number(document.getElementById("rpgMerchantBuyMultiplier")?.value)||1);\n  e.merchantStockLimits={weapons:Math.max(0,Math.min(999,Math.round(Number(document.getElementById("rpgMerchantStockWeapons")?.value)||0))),equipment:Math.max(0,Math.min(999,Math.round(Number(document.getElementById("rpgMerchantStockEquipment")?.value)||0))),consumables:Math.max(0,Math.min(999,Math.round(Number(document.getElementById("rpgMerchantStockConsumables")?.value)||0))),other:Math.max(0,Math.min(999,Math.round(Number(document.getElementById("rpgMerchantStockOther")?.value)||0)))};\n  e.enemyGoldEnabled=document.getElementById("rpgEnemyGoldEnabled")?.value!=="false";';
html=replaceLastExact(html,ecoSaveOld,ecoSaveNew,'economy save');

// Armure : chance de blocage total quand la réduction physique atteindrait zéro.
const armorDefaultOld='    armorReductionStep:2,armorReductionGain:1,minPhysicalDamage:1,\n    spiritMagicResistStep:20,magicResistGain:1,minMagicDamage:1';
const armorDefaultNew='    armorReductionStep:2,armorReductionGain:1,minPhysicalDamage:1,armorZeroBlockChance:75,\n    spiritMagicResistStep:20,magicResistGain:1,minMagicDamage:1';
html=replaceLastExact(html,armorDefaultOld,armorDefaultNew,'armor default chance');

const armorNormOld='  pos("armorReductionStep");non("armorReductionGain",99);non("minPhysicalDamage",99);\n  pos("spiritMagicResistStep");';
const armorNormNew='  pos("armorReductionStep");non("armorReductionGain",99);non("minPhysicalDamage",99);non("armorZeroBlockChance",100);\n  pos("spiritMagicResistStep");';
html=replaceLastExact(html,armorNormOld,armorNormNew,'armor normalization');

const armorMapOld='    drArmorStep:"armorReductionStep",drArmorGain:"armorReductionGain",drMinPhysicalDamage:"minPhysicalDamage",\n    drMagicResistStep:';
const armorMapNew='    drArmorStep:"armorReductionStep",drArmorGain:"armorReductionGain",drMinPhysicalDamage:"minPhysicalDamage",drArmorZeroBlockChance:"armorZeroBlockChance",\n    drMagicResistStep:';
html=replaceLastExact(html,armorMapOld,armorMapNew,'armor editor mapping');

const armorReadOld='    armorReductionStep:v("drArmorStep"),armorReductionGain:v("drArmorGain"),minPhysicalDamage:v("drMinPhysicalDamage"),\n    spiritMagicResistStep:';
const armorReadNew='    armorReductionStep:v("drArmorStep"),armorReductionGain:v("drArmorGain"),minPhysicalDamage:v("drMinPhysicalDamage"),armorZeroBlockChance:v("drArmorZeroBlockChance"),\n    spiritMagicResistStep:';
html=replaceLastExact(html,armorReadOld,armorReadNew,'armor editor read');

const armorUiOld='          <label>Dégâts physiques minimum après armure <input id="drMinPhysicalDamage" type="number" min="0" max="99"></label>\n          <label>Esprit : palier résistance magique';
const armorUiNew='          <label>Dégâts physiques minimum après armure <input id="drMinPhysicalDamage" type="number" min="0" max="99"></label>\n          <label>Chance de blocage total (%) <input id="drArmorZeroBlockChance" type="number" min="0" max="100" value="75"></label>\n          <label>Esprit : palier résistance magique';
html=replaceLastExact(html,armorUiOld,armorUiNew,'armor chance field');

const armorDamageOld='    const final=elemental>0?Math.max(1,configuredMin,elemental-reduction):0;';
const armorDamageNew='    const final=window.DungeonCore317.resolveArmorFloor(elemental,reduction,configuredMin,profile.damageType,rules);';
html=replaceLastExact(html,armorDamageOld,armorDamageNew,'physical zero-damage resolution');

// Core 3.17 doit être chargé en dernier pour surcharger le marchand et ajouter le retour de salle.
const core317Tag='<script src="assets/dungeon/dungeon-core-317.js"></script>';
if(!html.includes(core317Tag)){
  const close=html.lastIndexOf('</body>');
  if(close<0)throw new Error('Core 3.17 target missing: closing body');
  html=html.slice(0,close)+core317Tag+'\n'+html.slice(close);
}

// Cache PWA 16.78.11 + pré-cache du nouveau Core.
sw=sw.replace(/const CACHE_NAME = "gensrpg-cache-[^"]+";/,'const CACHE_NAME = "gensrpg-cache-16.78.11-dungeon-core317";');
if(!sw.includes('"./assets/dungeon/dungeon-core-317.js"')){
  sw=sw.replace('  "./index.html",','  "./index.html",\n  "./assets/dungeon/dungeon-core-317.js",');
}

fs.writeFileSync(indexPath,html);
fs.writeFileSync(swPath,sw);
console.log('Core 3.17 patch applied:',html.length,'bytes index,',sw.length,'bytes service worker');
