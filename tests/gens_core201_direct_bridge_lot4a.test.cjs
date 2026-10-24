const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

// The active Core201 IIFE moved byte-for-byte to its own classic, parser-
 // synchronous script in Phase12 D8. The historical Bridge contract still
 // checks the original exact JS, not an empty external <script> tag.
const crypto=require('node:crypto');
const external='assets/gensrpg/dungeon/core201-stability-v1.js';
const tag='<script id="dungeonCore201Stability" src="'+external+'"></script>';
assert.equal(html.split(tag).length-1,1,'Core201 classic script must be present exactly once');
assert.equal(html.includes('<script id="dungeonCore201Stability">'),false,'old Core201 inline owner is absent');
const buffer=fs.readFileSync(path.join(root,external));
const gitBlob=crypto.createHash('sha1').update(Buffer.from('blob '+buffer.length+'\0')).update(buffer).digest('hex');
assert.equal(buffer.length,13990,'Core201 script must be byte-identical to pre-D8');
assert.equal(gitBlob,'7edf731fd1aa209ec96490fb8e2cb7af04afd627','no Core201 behavior alteration allowed');
const core=buffer.toString('utf8');

assert.match(core,/function\s+requestCombat201\s*\(enemyIds,reason\)/,
  'Core 2.01 must use one local stateless helper for its two encounter buttons');
assert.ok(core.includes('GensRpgTacticalCombatV2Bridge.requestCombat(window'),
  'Core 2.01 helper must call the canonical Bridge');
assert.ok(core.includes('enemyIds:Array.isArray(enemyIds)?enemyIds.map(String):[]'),
  'Core 2.01 helper must preserve the explicit enemy id list');
assert.ok(core.includes('reason:reason'),
  'Core 2.01 helper must preserve the existing manual/cell reason');
assert.ok(core.includes('entry:"dc201EncounterPanel"'),
  'Core 2.01 must use its own diagnostic entry instead of retaining the historical adapter name');
assert.equal((core.match(/requestCombat201\s*\(/g)||[]).length,3,
  'Core 2.01 must contain one helper definition and exactly two encounter button calls');
assert.doesNotMatch(core,/\bdc200StartCombat\b/,
  'Core 2.01 must contain no remaining reference to the historical dc200StartCombat adapter');

assert.match(core,/const positional=typeof window\.dc305PositionalGameplay===["']function["']&&window\.dc305PositionalGameplay\(\)/,
  'Core 2.01 canonical positional-gameplay gate must remain intact');
assert.match(core,/const on=live\.find\(e=>Number\(x\.enemyCells\?\.\[e\.id\]\)===pos\)/,
  'Core 2.01 must still target only the enemy on the active hero cell in positional mode');
assert.ok(core.includes('JSON.stringify(ids)'),
  'same-room ENGAGER LE COMBAT must keep the full encounter enemy list');
assert.ok(core.includes('String(on.id)'),
  'positional ATTAQUER must keep the enemy on the hero cell');

console.log('GenSrpG combat migration lot 4A OK: Core 2.01 encounter buttons -> canonical Bridge');
