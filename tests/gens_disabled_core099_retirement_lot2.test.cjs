const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.doesNotMatch(html,/id="dungeonCore099FinalTacticalAuthority"/,
  'disabled Core 0.99 tactical authority script must be retired');
assert.doesNotMatch(html,/window\.dc099EngageCombat\s*=\s*engage99\b/,
  'disabled Core 0.99 engage99 assignment must leave with its retired script');
assert.doesNotMatch(html,/window\.dc099Paint\s*=\s*paint99\b/,
  'disabled Core 0.99 paint99 assignment must leave with its retired script');
assert.doesNotMatch(html,/window\.dc099SyncMainAction\s*=\s*syncMain99\b/,
  'disabled Core 0.99 syncMain99 assignment must leave with its retired script');

assert.equal((html.match(/id="dungeonCore099FinalTacticalCss"/g)||[]).length,1,
  'Core 0.99 CSS is deliberately outside this combat-runtime retirement lot');
assert.equal((html.match(/id="dungeonCore100UiCleanup"/g)||[]).length,1,
  'Core 1.00 UI cleanup CSS must remain untouched in this lot');
assert.match(html,/\.dc047Cell\.dc098Reach\.dc099Reachable/,
  'legacy dc099Reachable CSS reference is deliberately left for a separate visual characterization');

console.log('GenSrpG lot 2 OK: disabled Core 0.99 assignments retired while later compatibility aliases and adjacent visual CSS remain untouched');
