'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm');
const FILE='assets/gensrpg/dungeon/core200-rebuild-v1.js',BASE='ca77d8e5651892b39c37f1c035823014e8cdf7e0';
const original=cp.execFileSync('git',['show',BASE+':'+FILE],{encoding:'utf8',maxBuffer:2*1024*1024});
const modified=fs.readFileSync(FILE,'utf8');
const before="   mapCells.forEach((idx,k)=>{\n     if(roomChests[k])return;\n     const rarity=dungeonPickChestRarity?.(cfg())||'common';\n     addDungeonSceneElement?.({\n       kind:'chest',\n       name:'Coffre '+(dungeonRarityLabel?.(rarity)||rarity),\n       rarity,\n       trapped:false,\n       room:x.room,\n       cellIndex:idx,\n       fromMap:true,\n       branch200:branch\n     });\n     changed=true;\n   });";
const after="   mapCells.forEach((idx,k)=>{\n     if(roomChests[k])return;\n     const rarity=dungeonPickChestRarity?.(cfg())||'common';\n     const created=addDungeonSceneElement?.({\n       kind:'chest',\n       name:'Coffre '+(dungeonRarityLabel?.(rarity)||rarity),\n       rarity,\n       trapped:false,\n       room:x.room,\n       cellIndex:idx,\n       fromMap:true,\n       branch200:branch\n     });\n     // Conserver dans la sauvegarde finale le coffre que le propriétaire\n     // de scène vient de créer ; \"all\" précède cet ajout.\n     if(created?.id&&!all.some(e=>String(e.id)===String(created.id)))all.push(created);\n     changed=true;\n   });";
assert.equal(original.split(before).length,2,'single chest scene authority');
const beforeGhost="     if(!Number.isInteger(idx)){\n       // Coffre scène sans case : créer une vraie case libre.\n       idx=nearestFree(x);";
const afterGhost="     if(!Number.isInteger(idx)){\n       // La carte fait autorité pour les coffres provenant de la carte.\n       // Après fouille, une vieille scène fromMap ne peut recréer une case\n       // coffre à une autre position durant REPRENDRE LA PARTIE.\n       if(e.fromMap===true){\n         const stale=all.findIndex(a=>String(a.id)===String(e.id));\n         if(stale>=0){all.splice(stale,1);changed=true}\n         return;\n       }\n       // Les coffres créés explicitement hors carte conservent leur raccord.\n       idx=nearestFree(x);";
assert.equal(original.split(beforeGhost).length,2,'one Core200 missing-map scene branch');
assert.equal(modified,original.replace(before,after).replace(beforeGhost,afterGhost),
  'only both approved changes within Core200 scene authority, no other production drift');
new vm.Script(modified,{filename:FILE});
const changed=cp.execFileSync('git',['diff','--name-only',BASE,'--','assets/','index.html','service-worker.js','docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'],{encoding:'utf8'}).trim();
assert.equal(changed,FILE,'only approved Core200 source changed; all runtime and modes otherwise unchanged');
console.log('Dungeon Core200 scene ownership exact diff PASS, all other runtime unchanged');
