'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('dungeon-profiles-diagnostic.html','utf8');
const pages=fs.readFileSync('.github/workflows/main.yml','utf8');
assert.match(pages,/cp -f dungeon-profiles-diagnostic\.html _site\/dungeon-profiles-diagnostic\.html/,'Pages must actually publish optional diagnostic');
const found=html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
assert.ok(found,'diagnostic script present');
const script=found[1];
new vm.Script(script);
assert.doesNotMatch(html,/<script\s+src=/i,'no runtime scripts');
assert.doesNotMatch(script,/\blocalStorage\s*\.\s*(setItem|removeItem|clear)\s*\(/,'must never change localStorage');
assert.doesNotMatch(script,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/,'must not send data');
function read(seed){
 const els=new Map(['status','report','feedback','copy'].map(k=>[k,{value:'',textContent:'',addEventListener(){},focus(){},select(){}}]));
 const calls=[];
 const localStorage={getItem(k){calls.push(k);return seed},setItem(){throw Error('write forbidden')},removeItem(){throw Error('delete forbidden')},clear(){throw Error('clear forbidden')}};
 vm.runInNewContext(script,{document:{getElementById:k=>els.get(k)},localStorage,navigator:{clipboard:{writeText:async()=>{}}}});
 assert.deepEqual(calls,['gensrpg_game_profiles_v1']);
 return JSON.parse(els.get('report').value);
}
const rows=[
 {id:'game_profile_dungeon_demo',name:'Dungeon',builtIn:true,rpgUniverse:{}},
 {id:'game_profile_dungeon_demo',name:'Dungeon',builtIn:true,rpgUniverse:{}},
 {id:'gp_other',name:'Dungeon',builtIn:true,rpgUniverse:{}},
 {id:'game_profile_zombicide_base',name:'Survie',builtIn:true}
];
const duplicate=read(JSON.stringify(rows));
assert.equal(duplicate.dungeonTotal,3);
assert.equal(duplicate.identifiantsRepetes[0].occurrences,2);
assert.equal(duplicate.nomsRepetees[0].occurrences,3);
assert.equal(duplicate.profilsTotal,4);
assert.deepEqual(duplicate.profils.map(x=>x.nom),rows.map(x=>x.name));
const ok=read(JSON.stringify([rows[0]]));
assert.equal(ok.dungeonTotal,1);
assert.equal(ok.identifiantsRepetes.length,0);
assert.equal(read(null).profilsTotal,0);
assert.ok(read('{bad').erreur);
console.log('GREEN Dungeon opt-in diagnostic: safe read-only, detects repeated IDs and different IDs with same name');
