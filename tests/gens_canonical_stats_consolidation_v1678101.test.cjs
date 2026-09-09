'use strict';
const assert=require('assert');
const fs=require('fs');
const p=require('path');
const root=p.join(__dirname,'..');
const src=fs.readFileSync(p.join(root,'assets/gensrpg/gens-hero-editor-dynamic-167897.js'),'utf8');
const sw=fs.readFileSync(p.join(root,'service-worker.js'),'utf8');

assert.match(src,/APP_VERSION="16\.78\.101"/,'consolidation layer must report V16.78.101');
assert.match(src,/AUTHORITATIVE:true/,'hero editor must have one authoritative canonical renderer');
assert.match(src,/\[data-gens-dynamic-hero-stat-label\]\{display:none!important\}/,'legacy dynamic duplicate labels must stay hidden');
assert.match(src,/function completeGameStats\(/,'runtime sheet must complete directly from canonical definitions');
assert.match(src,/for\(const d of defs\)/,'runtime sheet must iterate active canonical definitions');
assert.match(src,/data-canonical-stat-box/,'custom stats must be rendered directly into the Dungeon sheet');
assert.match(src,/GensStatUpgradePolicy167898\?\.decorateGame/,'new stat boxes must receive the configured upgrade policy');

assert.match(src,/dungeon_aldren:"assets\/dungeon\/creatures\/dng_aldren\.png"/,'Aldren official art must be canonical');
assert.match(src,/c\.image=src;c\.avatar=src;c\.portrait=src;c\.art=src;c\.token=src/,'built-in hero source fields must be repaired before render');
assert.match(src,/wrap\("renderHeroes"/,'party-card renderer must be hooked at source');

assert.match(src,/Bonus de caractéristiques RPG/,'equipment editor must expose canonical RPG bonuses');
assert.match(src,/item\?\.rpgBonuses/,'existing RPG bonus maps must be loaded');
assert.match(src,/target\.rpgBonuses=bonuses/,'edited items must persist canonical rpgBonuses');
assert.match(src,/for\(const d of activeDefs\(\)\)/,'editor choices must come from active stat definitions');

assert.match(src,/select\[data-f="scaleAttribute"\]/,'ability scaling selector must be canonicalized');
assert.match(src,/select\[data-f="stat"\]/,'ability stat buff-debuff selector must be canonicalized');
assert.match(src,/dtalentPassiveAttribute/,'passive attribute selector must be canonicalized');
assert.match(src,/wrap\("dungeonTalentCalculatedAmount"/,'ability runtime scaling must be linked to canonical stat values');
assert.match(src,/api\(\)\?\.value\?\./,'custom stat scaling must read the canonical runtime value');

assert.doesNotMatch(src,/new MutationObserver|MutationObserver\(/,'consolidation must not add a global DOM observer');
assert.match(sw,/gensrpg-cache-16\.78\.101-canonical-stats-consolidation/,'PWA cache must be bumped for V16.78.101');
console.log('GenSrpG V16.78.101 canonical stats consolidation: OK');
