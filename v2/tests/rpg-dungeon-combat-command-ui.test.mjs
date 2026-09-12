import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('combat command module imports without a browser DOM',async()=>{
  const mod=await import('../src/ui/dungeon-combat-command-ui.js');
  assert.equal(typeof mod.polishDungeonCombat,'function');
});

test('combat presentation keeps native engine controls as source of truth',async()=>{
  const source=await read('src/ui/dungeon-combat-command-ui.js');
  assert.match(source,/data-dungeon-combat-skill/);
  assert.match(source,/data-dungeon-combat-target/);
  assert.match(source,/data-dungeon-use-skill/);
  assert.match(source,/dispatchEvent\(new Event\('change',\{bubbles:true\}\)\)/);
  assert.match(source,/queueMicrotask\(\(\)=>buildTargetButtons/);
  assert.match(source,/MutationObserver/);
  assert.doesNotMatch(source,/executeDungeonHeroSkill|prepareSkillAction|evaluateAttackPosition|resolveAndAdvance|applyEffect/);
});

test('combat command layer exposes game-like skill and target cards',async()=>{
  const source=await read('src/ui/dungeon-combat-command-ui.js');
  const css=await read('src/ui/dungeon-combat-command-ui.css');
  assert.match(source,/1 · Compétence/);
  assert.match(source,/2 · Cible/);
  assert.match(source,/⚔️ Lancer l’action/);
  assert.match(source,/combatant-hero/);
  assert.match(source,/combatant-enemy/);
  assert.match(source,/combat-resource-meter/);
  assert.match(css,/\.combat-command-card\.active/);
  assert.match(css,/\.combat-command-target\.active/);
  assert.match(css,/\.combatant-card\.combatant-hero/);
  assert.match(css,/\.combatant-card\.combatant-enemy/);
  assert.match(css,/position:sticky/);
});

test('V2 entrypoint loads the combat command presentation after existing combat styles',async()=>{
  const html=await read('index.html');
  const base=html.indexOf('./src/ui/dungeon-combat-mobile.css');
  const commands=html.indexOf('./src/ui/dungeon-combat-command-ui.css');
  const script=html.indexOf('./src/ui/dungeon-combat-command-ui.js');
  assert.ok(base>=0);
  assert.ok(commands>base);
  assert.ok(script>=0);
});
