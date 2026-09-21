const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const baseEngine=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2.js'));
globalThis.GensRpgTacticalCombatV2=baseEngine;
require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-rules.js'));
const V11411=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

function extractFunction(name){
  const token='function '+name+'(';
  const start=index.indexOf(token);
  assert.ok(start>=0,'missing inline owner '+name);
  const brace=index.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,block=false;
  for(let i=brace;i<index.length;i++){
    const c=index[i],n=index[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return index.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

function dungeonContext(rules){
  const ctx={Math,Number,loadDungeonRpgRules:()=>rules};
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  for(const name of ['dungeonHitBonusForMode','dungeonClampHitChance','d100ThresholdFromChance','dungeonAttackerCharacteristic','dungeonDefenseReduction']){
    vm.runInContext(extractFunction(name),ctx,{filename:'index#'+name});
  }
  return ctx;
}

const defaults={
  meleeHitStep:10,meleeHitGain:5,
  rangedHitStep:10,rangedHitGain:5,
  magicHitStep:10,magicHitGain:5,
  defensePenaltyPerPoint:1,
  hitChanceMin:5,hitChanceMax:95
};
const D=dungeonContext(defaults);

assert.equal(D.dungeonHitBonusForMode('melee',10),5);
assert.equal(D.dungeonHitBonusForMode('ranged',10),5);
assert.equal(D.dungeonHitBonusForMode('magic',20),10);
assert.equal(D.dungeonClampHitChance(55),55);
assert.equal(D.dungeonClampHitChance(-10),5);
assert.equal(D.dungeonClampHitChance(120),95);

D.dungeonDerivedDefenseForHero=()=>12;
assert.equal(
  D.dungeonDefenseReduction({attackCharacteristic:10},'hero'),
  2,
  'Dungeon Defense must penalize only the amount above attacker characteristic'
);
D.dungeonDerivedDefenseForHero=()=>5;
assert.equal(
  D.dungeonDefenseReduction({attackCharacteristic:10},'hero'),
  0,
  'Dungeon Defense below attacker characteristic must not penalize hit chance'
);

const Dcustom=dungeonContext({...defaults,defensePenaltyPerPoint:2,hitChanceMin:20,hitChanceMax:80});
Dcustom.dungeonDerivedDefenseForHero=()=>14;
assert.equal(Dcustom.dungeonDefenseReduction({attackCharacteristic:10},'hero'),8);
assert.equal(Dcustom.dungeonClampHitChance(5),20);
assert.equal(Dcustom.dungeonClampHitChance(99),80);

for(const [chance,threshold] of [[5,96],[37,64],[53,48],[55,46],[80,21],[95,6]]){
  assert.equal(D.d100ThresholdFromChance(chance),threshold,'Dungeon high-D100 threshold for '+chance);
  assert.equal(V11411.thresholdForChance(chance,true),threshold,'Tactical high-D100 threshold for '+chance);
  assert.equal(V11411.displayHit(threshold,chance,true),true);
  if(threshold>1)assert.equal(V11411.displayHit(threshold-1,chance,true),false);
}

function battle({defense=12,dodge=6,cellCover=false,hit=55}={}){
  const state=baseEngine.createBattle({
    grid:{width:5,height:3,blocked:[],cover:cellCover?[{x:2,y:1}]:[]},
    actors:[
      {id:'a',side:'hero',x:0,y:1,hp:10,maxHp:10,initiative:20,defense:0,dodge:0,attacks:[{id:'shot',minRange:1,maxRange:4,hit,power:1,lineOfSight:true,tags:['ranged']}]},
      {id:'t',side:'enemy',x:2,y:1,hp:10,maxHp:10,initiative:1,defense,dodge,attacks:[{id:'x',minRange:1,maxRange:1,hit:70,power:1,lineOfSight:false}]}
    ]
  });
  return state;
}

let state=battle({defense:12,dodge:6,hit:55});
let p=baseEngine.attackPreview(state,'a','t','shot');
assert.equal(p.hitChance,37,'Tactical must subtract full Defense and Dodge directly from hit chance');
let calc=V11411.hitCalculation(p,baseEngine.actorById(state,'t'),p.attack,true);
assert.equal(calc.baseHit,55);
assert.equal(calc.defensePenalty,12);
assert.equal(calc.dodgePenalty,6);
assert.equal(calc.finalChance,37);
assert.equal(calc.threshold,64);

state=battle({defense:5,dodge:0,hit:55});
p=baseEngine.attackPreview(state,'a','t','shot');
assert.equal(p.hitChance,50,'Tactical Defense below attacker characteristic is still subtracted directly');

state=battle({defense:12,dodge:0,hit:55});
const noDodge=baseEngine.attackPreview(state,'a','t','shot').hitChance;
state=battle({defense:12,dodge:40,hit:55});
const highDodge=baseEngine.attackPreview(state,'a','t','shot').hitChance;
assert.equal(noDodge,43);
assert.equal(highDodge,5,'Tactical Dodge must be consumed inside the hit chance and clamped at 5');

state=battle({defense:0,dodge:0,cellCover:true,hit:55});
p=baseEngine.attackPreview(state,'a','t','shot');
assert.equal(p.cellCover,20,'Tactical rules owner must apply current cell cover value');
assert.equal(p.hitChance,35,'Tactical cell cover must reduce final hit chance before D100');

state=battle({defense:0,dodge:0,hit:100});
assert.equal(baseEngine.attackPreview(state,'a','t','shot').hitChance,95,'Tactical high clamp must remain 95');
state=battle({defense:99,dodge:99,hit:1});
assert.equal(baseEngine.attackPreview(state,'a','t','shot').hitChance,5,'Tactical low clamp must remain 5');

const basic=extractFunction('dungeonCombatBasicAttack');
const enemyAttack=extractFunction('rollEnemyAttack');
const applyDamage=extractFunction('applyDungeonAttackDamage');

assert.match(
  basic,
  /Math\.max\(0,\(targetDerived\.defense-value\)\*Math\.max\(0,Number\(rules\.defensePenaltyPerPoint\)\|\|0\)\)/,
  'Dungeon hero attack must retain Defense-vs-attacker-characteristic comparison'
);
assert.doesNotMatch(
  basic,
  /dodge.*chance|chance.*dodge/i,
  'Dungeon basic hit chance must not merge Dodge into its initial hit chance'
);
assert.match(
  enemyAttack,
  /if\(hit\)\{[\s\S]*?if\(target\.dodge>0\)\{dodgeRoll=Math\.floor\(Math\.random\(\)\*100\)\+1;dodged=dodgeRoll>=Math\.max\(1,101-target\.dodge\)\}/,
  'Dungeon enemy attack must retain a second Dodge D100 after a hit'
);
assert.match(
  applyDamage,
  /if\(derived\.dodge>0\)\{dodgeRoll=Math\.floor\(Math\.random\(\)\*100\)\+1;isDodged=dodgeRoll>=Math\.max\(1,101-derived\.dodge\)\}/,
  'Dungeon hero-to-enemy damage path must retain its separate Dodge D100'
);

const derivedCore=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-derived-values-v1.js'),'utf8');
const valueCore=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-value-engine-v1.js'),'utf8');
for(const [label,src] of [['derived',derivedCore],['value',valueCore]]){
  assert.doesNotMatch(src,/Math\.random|resolveAttack|displayHit|attackPreview|rollEnemyAttack|dungeonCombatBasicAttack/,
    'Core Stats '+label+' must stay value/modifier-only during S10');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S10 hit-defense-dodge characterization',
  dungeonHighD100:true,
  tacticalHighD100:true,
  dungeonDefenseExcessOnly:true,
  tacticalDefenseDirect:true,
  dungeonDodgeSeparateRoll:true,
  tacticalDodgeInsideHitChance:true,
  tacticalCoverInsideHitChance:true,
  dungeonConfigurableHitBounds:true,
  tacticalFixedBounds:[5,95],
  coreStatsResolutionOwner:false,
  gameplayChanged:false
},null,2));
