const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');

const PREFIX = 'gensrpg_dungeon_session_eco_160_';
const OWNER = 'dungeonEconomy160';
const plain = value => JSON.parse(JSON.stringify(value));

function runOwnerContract(block, storageSource) {
  function fixture(profile = 'profile-A', initial = {}) {
    const data = new Map(Object.entries(initial));
    const events = [];
    const flags = {read: false, write: false, profile: false};
    let active = profile;
    const localStorage = {
      getItem(key) {
        events.push(['get', String(key)]);
        if (flags.read) throw new Error('read-failure');
        return data.has(String(key)) ? data.get(String(key)) : null;
      },
      setItem(key, value) {
        events.push(['set', String(key), String(value)]);
        if (flags.write) throw new Error('write-failure');
        data.set(String(key), String(value));
      },
      removeItem() { throw new Error('session must not remove storage'); }
    };
    const ctx = {
      localStorage,
      activeGameProfileId() {
        if (flags.profile) throw new Error('profile-failure');
        return active;
      },
      isDungeonMode: () => false,
      isDungeonHeroSheet: () => false,
      isGameMasterDevice: () => true,
      document: {getElementById: () => null},
      alert: message => events.push(['alert', message]),
      openMerchant: () => events.push(['merchant']),
      updateDungeonSearchUi: () => events.push(['search-ui']),
      setTimeout: () => 0
    };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(storageSource, ctx, {filename: 'storage-v1.js'});
    // Execute the complete real owner, including its real MJ/merchant call sites.
    vm.runInContext(block, ctx, {filename: 'inline:' + OWNER});
    assert.deepEqual(events, [], 'install must not read/write session state');
    return {ctx, data, events, flags, setProfile: value => {active = value;}};
  }

  const keyA = PREFIX + 'profile-A';
  const keyB = PREFIX + 'profile-B';
  const cases = [
    [null, {}], ['', {}], ['null', {}], ['{broken', {}],
    ['{}', {}], ['false', {}], ['0', {}], ['17', {}],
    ['"xy"', {'0': 'x', '1': 'y'}],
    ['[4,5]', {'0': 4, '1': 5}],
    ['{"chests":3,"merchantPasses":2,"extra":{"kept":true}}',
      {chests: 3, merchantPasses: 2, extra: {kept: true}}],
    ['{"chests":null,"merchantPasses":-4}', {chests: null, merchantPasses: -4}],
    ['{"key":"legacy-explicit-key","chests":8}', {key: 'legacy-explicit-key', chests: 8}]
  ];
  for (const [raw, overrides] of cases) {
    const f = fixture('profile-A', raw === null ? {} : {[keyA]: raw});
    assert.deepEqual(plain(f.ctx.dungeonSessionEco160()),
      {key: keyA, chests: 0, merchantPasses: 0, ...overrides}, 'read contract: ' + raw);
    assert.deepEqual(f.events, [['get', keyA]], 'read must have no write/remove effect');
  }
  for (const id of [undefined, null, '', false, 0, 'profile-B', 42]) {
    const f = fixture(id);
    // Explicitly set undefined too (fixture's default otherwise replaces it).
    f.setProfile(id);
    const expected = PREFIX + (id ? String(id) : 'dungeon');
    assert.deepEqual(plain(f.ctx.dungeonSessionEco160()),
      {key: expected, chests: 0, merchantPasses: 0});
    assert.deepEqual(f.events, [['get', expected]]);
  }
  {
    const f = fixture();
    f.flags.read = true;
    assert.deepEqual(plain(f.ctx.dungeonSessionEco160()), {key: keyA, chests: 0, merchantPasses: 0});
    f.flags.profile = true;
    assert.throws(() => f.ctx.dungeonSessionEco160(), /profile-failure/,
      'profile lookup failure is outside the historical read catch');
  }
  {
    const f = fixture();
    for (const invalid of [undefined, null, false, 0, '', {}, {key: ''}, {key: 0}]) {
      assert.equal(f.ctx.saveDungeonSessionEco160(invalid), undefined);
    }
    assert.deepEqual(f.events, [], 'missing/falsy key must remain a no-op');
    const value = {key: keyA, chests: 5, merchantPasses: 2, extra: ['kept']};
    assert.equal(f.ctx.saveDungeonSessionEco160(value), undefined, 'writer return contract');
    assert.deepEqual(f.events, [['set', keyA, '{"chests":5,"merchantPasses":2,"extra":["kept"]}']]);
    assert.deepEqual(value, {key: keyA, chests: 5, merchantPasses: 2, extra: ['kept']},
      'writer must not mutate its argument');
    f.events.length = 0;
    f.ctx.saveDungeonSessionEco160({key: 123, chests: 7});
    assert.deepEqual(f.events, [['set', '123', '{"chests":7}']],
      'historical writer accepts a supplied truthy key without recomputing profile');
  }
  {
    const f = fixture('profile-A', {[keyA]: '{"chests":2}', [keyB]: '{"merchantPasses":3}'});
    const a = f.ctx.dungeonSessionEco160();
    f.setProfile('profile-B');
    assert.deepEqual(plain(f.ctx.dungeonSessionEco160()), {key: keyB, chests: 0, merchantPasses: 3});
    a.chests = 9;
    f.ctx.saveDungeonSessionEco160(a);
    assert.equal(f.data.get(keyA), '{"chests":9,"merchantPasses":0}');
    assert.equal(f.data.get(keyB), '{"merchantPasses":3}', 'profile B must not be overwritten');
    f.setProfile('profile-A');
    assert.deepEqual(plain(f.ctx.dungeonSessionEco160()), {key: keyA, chests: 9, merchantPasses: 0});
  }
  {
    const f = fixture('profile-A', {[keyA]: '{"key":"legacy-target","chests":6}'});
    f.ctx.saveDungeonSessionEco160(f.ctx.dungeonSessionEco160());
    assert.equal(f.data.get('legacy-target'), '{"chests":6,"merchantPasses":0}',
      'persisted key override remains legacy behavior; no schema cleanup in Storage');
    const circular = {key: keyA}; circular.self = circular;
    f.events.length = 0;
    assert.throws(() => f.ctx.saveDungeonSessionEco160(circular), /circular|cyclic/i);
    assert.deepEqual(f.events, [], 'serialization must fail before setItem');
    f.flags.write = true;
    assert.throws(() => f.ctx.saveDungeonSessionEco160({key: keyA, chests: 1}), /write-failure/);
  }
  {
    const f = fixture();
    f.ctx.dungeonMjAddChest160(2);
    assert.equal(f.data.get(keyA), '{"chests":2,"merchantPasses":0}');
    assert.deepEqual(f.events.map(e => e[0]), ['get', 'set', 'search-ui', 'alert'],
      'real MJ chest path must save before UI');
    f.events.length = 0;
    f.ctx.dungeonMjActivateMerchant160();
    assert.equal(f.data.get(keyA), '{"chests":2,"merchantPasses":1}');
    assert.deepEqual(f.events.map(e => e[0]), ['get', 'set', 'alert']);
    f.events.length = 0;
    f.ctx.dungeonOpenMerchant160();
    assert.equal(f.data.get(keyA), '{"chests":2,"merchantPasses":0}');
    assert.equal(f.events.at(-1)[0], 'merchant');
    assert.ok(f.events.findIndex(e => e[0] === 'set') < f.events.findIndex(e => e[0] === 'merchant'));
  }
  for (const action of ['dungeonMjAddChest160', 'dungeonMjActivateMerchant160', 'dungeonOpenMerchant160']) {
    const f = fixture('profile-A', {[keyA]: '{"chests":2,"merchantPasses":2}'});
    f.flags.write = true;
    assert.throws(() => f.ctx[action](), /write-failure/, action + ' must propagate write failure');
    assert.ok(!f.events.some(e => ['alert', 'search-ui', 'merchant'].includes(e[0])),
      action + ' must stop before subsequent UI');
    assert.equal(f.data.get(keyA), '{"chests":2,"merchantPasses":2}');
  }
  return {readCases: cases.length, profileCases: 7, actualCallSites: 3,
    writeErrors: 'propagated', profileIsolation: true, persistedKeyOverride: 'preserved'};
}

function main() {
  const root = path.join(__dirname, '..');
  const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const match = src.match(/<script\b[^>]*\bid=["']dungeonEconomy160["'][^>]*>([\s\S]*?)<\/script>/i);
  assert.ok(match, 'real Economy owner must exist');
  const block = match[1];
  const outside = src.slice(0, match.index) + src.slice(match.index + match[0].length);
  for (const needle of [PREFIX, 'dungeonSessionEco160', 'saveDungeonSessionEco160']) {
    assert.equal(outside.includes(needle), false, 'unexpected owner/call site in another inline script: ' + needle);
  }
  assert.equal((block.match(/window\.dungeonSessionEco160\s*=/g) || []).length, 1);
  assert.equal((block.match(/window\.saveDungeonSessionEco160\s*=/g) || []).length, 1);
  assert.equal(block.split(PREFIX).length - 1, 1, 'one profile key factory');
  assert.equal(block.includes('removeItem'), false);
  assert.equal(block.includes('gensrpg_dungeon_runtime_v2'), false);

  // Include unnamed inline scripts above and every tracked JS file here; do not rely on Phase 2 alone.
  const jsFiles = cp.execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'})
    .split('\0').filter(file => file.endsWith('.js'));
  for (const file of jsFiles) {
    const code = fs.readFileSync(path.join(root, file), 'utf8');
    for (const needle of [PREFIX, 'dungeonSessionEco160', 'saveDungeonSessionEco160']) {
      assert.equal(code.includes(needle), false, 'additional external owner/call site: ' + file + ' / ' + needle);
    }
  }
  const result = runOwnerContract(block,
    fs.readFileSync(path.join(root, 'assets/gensrpg/core/storage-v1.js'), 'utf8'));
  console.log(JSON.stringify({scenario: 'Economy Session real-owner characterization',
    owner: OWNER, keyPrefix: PREFIX, ...result}, null, 2));
}

module.exports = {runOwnerContract};
if (require.main === module) main();
