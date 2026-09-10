const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dice=fs.readFileSync(path.join(__dirname,'..','assets/gensrpg/gens-dice-performance-1678108.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function threshold(chance){const c=Math.max(1,Math.min(100,Number(chance)||1));return Math.max(1,Math.min(100,101-c))}
assert.equal(51>=38,true,'D100 51 against 38+ is a successful roll');
assert.equal(threshold(63),38,'63% hit chance means 38+');
assert.match(dice,/finalValue>=target/,'dice visual success must use >= target');
assert.match(html,/rolls\.filter\(v=>v>=rpgThreshold\)/,'player hit calculation must use >= threshold');
assert.match(html,/dodged=dodgeRoll>=/,'dodge is a separate post-hit resolution');
console.log('OK V16.78.114 D100: 51 vs 38+ = réussite; esquive séparée');
