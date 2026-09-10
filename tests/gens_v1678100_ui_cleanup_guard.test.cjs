const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-ui-cleanup-1678100.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(src),'V16.78.113 cleanup syntax');
assert.match(src,/APP_VERSION="16\.78\.113"/);
assert.match(index,/id="dc01Heroes"/,'Dungeon party cards must exist');
assert.match(index,/function renderHeroes\(x\)/,'Dungeon party renderer must remain present');
assert.match(index,/id="dungeonCombatFormula"/,'legacy rule summary container must remain present for compatibility');
assert.match(sw,/gensrpg-cache-16\.78\.113-combat-profiler-fix/);
assert.ok(sw.includes('gens-dungeon-ui-cleanup-1678100.js'));
assert.match(src,/partyObserver\.observe\(host,/,'party art observer must be scoped to the party host');
const hookAll=(src.match(/function hookAll\(\)\{[^\n]+/)||[''])[0];
assert.ok(!hookAll.includes('renderDungeonHeroStats')&&!hookAll.includes('renderDungeonAttributes'),'cleanup must never hook combat-hot stat rendering');
assert.doesNotMatch(src,/tries\+\+<60|setTimeout\(retry,100\)/,'cleanup must not poll the UI for six seconds');

let partySrc='assets/old/crossed-swords.png';
const styleObj=()=>({display:'',visibility:'',setProperty(k,v,p){this[k]=v;if(k==='display')this.priority=p},getPropertyValue(k){return this[k]||''}});
const partyImg={alt:'',hidden:false,style:styleObj(),getAttribute(k){return k==='src'?partySrc:null},setAttribute(k,v){if(k==='src')partySrc=v;this[k]=v},tagName:'IMG'};
const partyCard={textContent:'Aldren\nGuerrier humain · Entrée',querySelector(sel){return sel==='img'?partyImg:null},firstChild:partyImg,children:[partyImg],insertBefore(){}};
const partyHost={querySelectorAll(sel){return sel==='.dc01Hero'?[partyCard]:[]}};
const labels={},inputs={};
for(const id of ['hcRpgForce','hcRpgAgility','hcRpgIntelligence','hcRpgSpirit','hcRpgEndurance','hcRpgDefense','hcRpgArmor','hcRpgInitiative','hcRpgMovement']){const style={value:'',setProperty(k,v,p){if(k==='display'){this.value=v;this.priority=p}}};const label={hidden:false,style,dataset:{},setAttribute(k,v){this[k]=v}};labels[id]=label;inputs[id]={closest(sel){return sel==='label'?label:null}}}
const mkLine=t=>({textContent:t,hidden:false,style:{display:''}}),lines=[mkLine('⭐ 1 niveau tous les 10 XP'),mkLine('⚔️ Tous les 10 Force : +0 dégâts physiques.'),mkLine('🎯 D100 : chance finale ...'),mkLine('🧱 Défense : ancienne règle'),mkLine('🔷 Tous les 10 Esprit : +10 mana'),mkLine('💥 Tous les 10 Agilité : +0% critique'),mkLine('❤️ Tous les 10 Endurance : +2 PV max.')];
const summary={querySelectorAll(sel){return sel==='.dungeonRuleLine'?lines:[]}};
const document={readyState:'loading',addEventListener(){},getElementById(id){if(id==='dc01Heroes')return partyHost;if(id==='dungeonCombatFormula')return summary;return inputs[id]||null},createElement(){return {style:styleObj(),setAttribute(){}}}};
const ctx={console,document,setTimeout,clearTimeout,requestAnimationFrame:()=>0,MutationObserver:class{observe(){} disconnect(){}}};ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-dungeon-ui-cleanup-1678100.js'});
const api=ctx.GensDungeonUiCleanup1678100;assert.ok(api);
api.repairPartyCards();assert.equal(partySrc,'assets/dungeon/creatures/dng_aldren.png','party card must use official Aldren art');
api.hideLegacyHeroInputs();for(const id of Object.keys(labels)){assert.equal(labels[id].hidden,true,id+' legacy label hidden');assert.equal(labels[id].style.value,'none');assert.equal(labels[id].style.priority,'important')}
api.cleanRuleSummary();assert.equal(lines[0].hidden,false);assert.equal(lines[2].hidden,false);assert.equal(lines[4].hidden,false);assert.equal(lines[6].hidden,false);assert.equal(lines[1].hidden,true);assert.equal(lines[3].hidden,true);assert.equal(lines[5].hidden,true);
console.log('V16.78.113 guard: party art + stat cleanup retained without combat-hot UI work');
