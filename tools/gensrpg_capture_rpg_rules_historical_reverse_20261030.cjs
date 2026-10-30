'use strict';
// History-only reverse of ONE authorized Capture rules-writer change.
// Never imported by production or used to change saved user data.
// The R14 original byte-exact extraction remains independently certified.
const crypto=require('node:crypto');
const ORIGINAL_SHA='3faa1131bd6a9a2c4a672a4f18d49f49bcdb9107';
const REVIEWED_SHA='6a2707ebbc2574b2263e84d97add06f2905b8fba';
const OLD_BLOCK="  p.rpgUniverse.captureCombat={\n    activeSlots:Math.max(1,Math.min(3,Number(document.getElementById(\"rpgCaptureActiveSlots\")?.value)||1)),\n    teamSize:Math.max(1,Math.min(20,Number(document.getElementById(\"rpgCaptureTeamSize\")?.value)||6)),\n    minBattleTeam:Math.max(1,Math.min(20,Number(document.getElementById(\"rpgCaptureMinBattleTeam\")?.value)||3)),\n    maxBattleTeam:Math.max(1,Math.min(20,Number(document.getElementById(\"rpgCaptureMaxBattleTeam\")?.value)||6)),\n    recallCost:document.getElementById(\"rpgCaptureRecallCost\")?.value||\"turn\",\n    autoReplaceKo:document.getElementById(\"rpgCaptureAutoReplaceKo\")?.checked!==false,\n    itemsAllowed:document.getElementById(\"rpgCaptureItemsAllowed\")?.checked!==false,\n    captureAllowed:true,\n    controller:document.getElementById(\"rpgCaptureController\")?.value||\"auto\",\n    allowBattleOverride:document.getElementById(\"rpgCaptureAllowBattleOverride\")?.checked!==false,\n    itemSlots:Math.max(0,Math.min(20,Number(document.getElementById(\"rpgCaptureItemSlots\")?.value)||0)),\n    itemsPerTurn:Math.max(0,Math.min(10,Number(document.getElementById(\"rpgCaptureItemsPerTurn\")?.value)||0)),\n    defendAllowed:document.getElementById(\"rpgCaptureDefendAllowed\")?.checked!==false,\n    initiativeMode:\"dynamic\",\n    victoryMode:document.getElementById(\"rpgCaptureVictoryMode\")?.value||\"all_ko\",\n    saveBattle:document.getElementById(\"rpgCaptureSaveBattle\")?.checked!==false,\n    healMode:document.getElementById(\"rpgCaptureHealMode\")?.value||\"free\",\n    healCost:Math.max(0,Number(document.getElementById(\"rpgCaptureHealCost\")?.value)||0)\n  };";
const NEW_BLOCK="  // Capture World owns team limits and healing economy, not Combat Lab rules.\n  // Preserve historical rule keys unchanged until an explicit consented migration.\n  const previous=p.rpgUniverse.captureCombat;\n  const preserved=previous&&typeof previous===\"object\"&&!Array.isArray(previous)?previous:{};\n  p.rpgUniverse.captureCombat={\n    ...preserved,\n    teamSize:Math.max(1,Math.min(20,Number(document.getElementById(\"rpgCaptureTeamSize\")?.value)||6)),\n    minBattleTeam:Math.max(1,Math.min(20,Number(document.getElementById(\"rpgCaptureMinBattleTeam\")?.value)||3)),\n    maxBattleTeam:Math.max(1,Math.min(20,Number(document.getElementById(\"rpgCaptureMaxBattleTeam\")?.value)||6)),\n    healMode:document.getElementById(\"rpgCaptureHealMode\")?.value||\"free\",\n    healCost:Math.max(0,Number(document.getElementById(\"rpgCaptureHealCost\")?.value)||0)\n  };";
function gitBlob(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update('blob '+b.length+String.fromCharCode(0)).update(b).digest('hex');}
function restoreOriginalR14Owner(source){
 const sha=gitBlob(source);
 if(sha===ORIGINAL_SHA)return source;
 if(sha!==REVIEWED_SHA)throw new Error('Unauthorized Builders owner drift: history restore refused');
 if(source.split(NEW_BLOCK).length!==2)throw new Error('Reviewed Capture writer not unique');
 const original=source.replace(NEW_BLOCK,OLD_BLOCK);
 if(gitBlob(original)!==ORIGINAL_SHA)throw new Error('R14 original bytes not restored');
 return original;
}
module.exports={restoreOriginalR14Owner};
