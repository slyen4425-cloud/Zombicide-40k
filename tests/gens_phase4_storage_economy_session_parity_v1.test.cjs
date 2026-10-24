const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {runOwnerContract} = require('./gens_phase4_storage_economy_session_characterization_v1.test.cjs');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const storageSource = fs.readFileSync(path.join(root, 'assets/gensrpg/core/storage-v1.js'), 'utf8');
const match = src.match(/<script\b[^>]*\bid=["']dungeonEconomy160["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(match, 'real Economy owner must exist');

const legacyBlock = match[1];
const oldRead = 'JSON.parse(localStorage.getItem(key)||"{}")';
const oldWrite = 'localStorage.setItem(key,JSON.stringify(rest))';
const coreRead = 'GensStorageV1.readJson(localStorage,key,{})';
const coreWrite = 'GensStorageV1.writeJson(localStorage,key,rest)';

const directReadCount = legacyBlock.split(oldRead).length - 1;
const directWriteCount = legacyBlock.split(oldWrite).length - 1;
const coreReadCount = legacyBlock.split(coreRead).length - 1;
const coreWriteCount = legacyBlock.split(coreWrite).length - 1;

assert.ok(
  (directReadCount === 1 && coreReadCount === 0) ||
  (directReadCount === 0 && coreReadCount === 1),
  'owner must expose exactly one legacy-or-Core session read transport'
);
assert.ok(
  (directWriteCount === 1 && coreWriteCount === 0) ||
  (directWriteCount === 0 && coreWriteCount === 1),
  'owner must expose exactly one legacy-or-Core session write transport'
);

const candidateBlock = legacyBlock
  .replace(oldRead, coreRead)
  .replace(oldWrite, coreWrite);

assert.equal(candidateBlock.split(oldRead).length - 1, 0, 'candidate read must remove direct JSON transport');
assert.equal(candidateBlock.split(oldWrite).length - 1, 0, 'candidate write must remove direct JSON transport');
assert.equal(candidateBlock.split(coreRead).length - 1, 1, 'candidate must contain one Core session read');
assert.equal(candidateBlock.split(coreWrite).length - 1, 1, 'candidate must contain one Core session write');

const current = runOwnerContract(legacyBlock, storageSource);
const candidate = runOwnerContract(candidateBlock, storageSource);
assert.deepEqual(candidate, current, 'Core transport candidate must preserve the complete real-owner contract');

console.log(JSON.stringify({
  scenario: 'Phase 4 Economy Session real-owner Core transport parity',
  owner: 'dungeonEconomy160',
  currentTransport: directReadCount ? 'legacy-direct' : 'core',
  candidateTransport: 'GensStorageV1',
  reads: 1,
  writes: 1,
  parity: true
}, null, 2));
