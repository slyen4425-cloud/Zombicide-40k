const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function script(id) {
  const match = html.match(new RegExp(`<script id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`));
  assert.ok(match, `script ${id} introuvable`);
  return match[1];
}

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function runCore202(initialRuntime, exploreRuntime) {
  const RT = "gensrpg_dungeon_runtime_v2";
  const localStorage = storage({ [RT]: JSON.stringify(initialRuntime) });
  let enemies = [];
  let spawns = 0;
  const core = {
    render() { return true; },
    show() { return true; },
    explore() {
      if (exploreRuntime) localStorage.setItem(RT, JSON.stringify(exploreRuntime));
      return true;
    }
  };
  const document = {
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() { return { id: "", innerHTML: "", insertAdjacentElement() {} }; }
  };
  const context = {
    console,
    document,
    localStorage,
    window: { DungeonCore01: core },
    DungeonCore01: core,
    requestAnimationFrame(fn) { fn(); },
    setTimeout(fn) { fn(); return 1; },
    loadDungeonConfig() { return { challengeDoorChance: 0 }; },
    loadDungeonSceneElements() { return []; },
    saveDungeonState() {},
    loadChallengeLibrary069() { return []; },
    loadActiveEnemies() { return enemies; },
    saveActiveEnemies(next) { enemies = next; },
    dungeonEncounter(room) {
      spawns += 1;
      enemies.push({ id: `spawn-${spawns}`, enemyId: "dng_skeleton", hp: 1, dungeonRoom: room });
    },
    dungeonBossRoom(room) {
      spawns += 1;
      enemies.push({ id: `boss-${spawns}`, enemyId: "dng_minotaur", hp: 1, dungeonRoom: room });
    }
  };
  vm.runInNewContext(script("dungeonCore202ContentDensity"), context);
  return { core, getSpawns: () => spawns };
}

function testEncounterOnlyRepairsOnRoomCreation() {
  const clearedAmbush = {
    room: 4,
    branch: null,
    last: { kind: "ambush", map: { cells: ["floor"], size: 1 } },
    dc209AmbushDone: { 4: true }
  };
  const resumed = runCore202(clearedAmbush);
  resumed.core.render();
  resumed.core.show();
  resumed.core.render();
  assert.equal(resumed.getSpawns(), 0, "un rendu ne doit jamais recréer les ennemis vaincus");

  const entrance = { room: 0, branch: null, last: null };
  const newRoom = {
    room: 1,
    branch: null,
    positions: {},
    dc313LastTransition: { heroId: "dungeon_aldren", from: 0, to: 1, created: true },
    last: { kind: "ambush", map: { cells: ["floor"], size: 1 } }
  };
  const created = runCore202(entrance, newRoom);
  created.core.explore();
  assert.equal(created.getSpawns(), 1, "un spawn manquant doit être réparé une fois à la création de la salle");
  created.core.render();
  created.core.show();
  assert.equal(created.getSpawns(), 1, "les rendus suivants ne doivent pas dupliquer la rencontre");

  const joinedExisting = runCore202(entrance, {
    ...newRoom,
    dc313LastTransition: { heroId: "dungeon_lyra", from: 0, to: 1, created: false }
  });
  joinedExisting.core.explore();
  assert.equal(joinedExisting.getSpawns(), 0, "rejoindre une salle déjà vidée ne doit pas recréer ses ennemis");
}

class ClassList {
  constructor(owner) { this.owner = owner; this.names = new Set(); }
  add(...names) { names.forEach(name => this.names.add(name)); }
  remove(...names) { names.forEach(name => this.names.delete(name)); }
  contains(name) { return this.names.has(name); }
  set(value) { this.names = new Set(String(value).split(/\s+/).filter(Boolean)); }
  toString() { return [...this.names].join(" "); }
}

class Element {
  constructor(tag = "span") {
    this.tagName = tag.toUpperCase();
    this.nodeType = 1;
    this.childNodes = [];
    this.parentNode = null;
    this.classList = new ClassList(this);
    this.dataset = {};
    this.style = {};
    this.title = "";
  }
  set className(value) { this.classList.set(value); }
  get className() { return this.classList.toString(); }
  appendChild(node) { node.parentNode = this; this.childNodes.push(node); return node; }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.childNodes = this.parentNode.childNodes.filter(node => node !== this);
    this.parentNode = null;
  }
  querySelectorAll(selectors) {
    const wanted = selectors.split(",").map(s => s.trim()).filter(Boolean);
    const matches = node => node.nodeType === 1 && wanted.some(selector => {
      const cls = selector.match(/^\.([\w-]+)/)?.[1];
      return cls ? node.classList.contains(cls) : false;
    });
    const found = [];
    const visit = node => node.childNodes.forEach(child => {
      if (matches(child)) found.push(child);
      if (child.nodeType === 1) visit(child);
    });
    visit(this);
    return found;
  }
}

class TextNode {
  constructor(text) { this.nodeType = 3; this.textContent = text; this.parentNode = null; }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.childNodes = this.parentNode.childNodes.filter(node => node !== this);
    this.parentNode = null;
  }
}

function testCreaturePortraitReplacesEveryLegacyGlyph() {
  const RT = "gensrpg_dungeon_runtime_v2";
  const localStorage = storage({
    [RT]: JSON.stringify({
      room: 1,
      index: 0,
      participants: ["dungeon_aldren"],
      positions: { dungeon_aldren: 0 },
      enemyCells: { enemy1: 0 },
      last: { kind: "ambush", keyEnemyId: "" }
    })
  });
  const cell = new Element("div");
  cell.classList.add("dc047Cell", "enemy", "dc201EnemyToken");
  cell.dataset.dc201Enemy = "👹";
  cell.appendChild(new TextNode("👹"));
  const legacy = new Element("span");
  legacy.classList.add("dc214Enemy");
  cell.appendChild(legacy);
  const board = new Element("div");
  const core = { render() { return true; }, show() { return true; } };
  const document = {
    readyState: "complete",
    body: new Element("body"),
    documentElement: new Element("html"),
    querySelector() { return null; },
    querySelectorAll(selector) {
      if (selector === "#dc047RoomBoard .dc047Grid > .dc047Cell") return [cell];
      return [];
    },
    getElementById(id) { return id === "dc047RoomBoard" ? board : null; },
    createElement(tag) { return new Element(tag); },
    addEventListener() {}
  };
  const context = {
    console,
    document,
    localStorage,
    window: { DungeonCore01: core },
    DungeonCore01: core,
    Node: { TEXT_NODE: 3 },
    MutationObserver: class { observe() {} },
    requestAnimationFrame(fn) { fn(); },
    CHARS: { dungeon_aldren: { name: "Aldren", image: "hero.png" } },
    findCustomHero() { return null; },
    loadActiveEnemies() { return [{ id: "enemy1", enemyId: "dng_skeleton", hp: 1, dungeonRoom: 1 }]; },
    activeEnemyDefinition() { return { name: "Squelette" }; },
    gensDungeonCreatureArt165() { return "assets/dungeon/creatures/dng_skeleton.png"; }
  };
  vm.runInNewContext(script("dungeonCore310PersistenceAndTokens"), context);

  assert.equal(cell.querySelectorAll(".dc214Enemy,.dc212EnemyToken,.dc213EnemyToken").length, 0);
  assert.equal(cell.querySelectorAll(".dc310Hero").length, 1);
  assert.equal(cell.querySelectorAll(".dc310Enemy").length, 1);
  assert.equal(cell.childNodes.filter(node => node.nodeType === 3 && node.textContent.trim()).length, 0);
  assert.equal(cell.classList.contains("dc201EnemyToken"), false);
  assert.equal(cell.dataset.dc201Enemy, undefined);
}

function testCombatItemsDoNotStackHiddenDamagePopup() {
  const combatItems = script("dungeonCore061CombatItems");
  const damageBranch = combatItems.match(/if\(u\.kind==="damage"\)\{([\s\S]*?)\n  \}\n\n  alert/);
  assert.ok(damageBranch, "branche de dégâts des consommables introuvable");
  assert.doesNotMatch(
    damageBranch[1],
    /showEffectPopup/,
    "le résultat du parchemin ne doit pas ouvrir une seconde popup cachée"
  );

  const timeline = script("dungeonCore303TimelineRootFix");
  assert.match(timeline, /"dungeonCombatUseItem061"/, "un consommable doit consommer le tour du héros");
  assert.match(
    timeline,
    /const active=ownsTurn&&!T\.pendingHero&&!resultOpen\(\)/,
    "les actions doivent être verrouillées dès qu'un résultat est en attente"
  );
}

function testLevelUpsAreQueuedUntilCombatEnds() {
  const localStorage = storage();
  const body = new Element("body");
  const combat = new Element("div");
  combat.id = "dungeonCombatModal";
  combat.style.display = "block";
  combat.classList.add("dc200CombatOpen");
  body.appendChild(combat);

  const findById = (node, id) => {
    if (node.id === id) return node;
    for (const child of node.childNodes || []) {
      const found = findById(child, id);
      if (found) return found;
    }
    return null;
  };
  const timers = [];
  let popupCalls = 0;
  const document = {
    body,
    createElement(tag) { return new Element(tag); },
    getElementById(id) { return findById(body, id); },
    querySelector() { return null; }
  };
  const context = {
    console,
    document,
    localStorage,
    window: {},
    CHARS: { dungeon_lyra: { name: "Lyra" } },
    current: "",
    state: null,
    dungeonCombatActive: true,
    dungeonRpgLevelFromXp(xp) { return 1 + Math.floor(Number(xp || 0) / 10); },
    dungeonSyncProgressionForState(id, st) {
      st.skillPoints = Math.floor(st.xp / 10);
      st.statPoints = Math.floor(st.xp / 10);
    },
    activeProg() { return { levelUpRestore: "none" }; },
    findCustomHero() { return null; },
    key(id) { return `state-${id}`; },
    z40kEscHtml(value) { return String(value); },
    showEffectPopup() { popupCalls += 1; },
    setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; },
    clearTimeout() {}
  };
  vm.runInNewContext(script("dungeonCore312TurnAndPopupFixes"), context);

  const st = { xp: 20, wounds: 0 };
  assert.equal(context.window.dungeonHandleLevelUp071("dungeon_lyra", 0, st, 80), true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.window.dungeonDebug312())),
    { queued: 2, open: false, busy: true }
  );
  assert.equal(popupCalls, 0, "les niveaux ne doivent plus utiliser l'effectModal générique");

  context.dungeonCombatActive = false;
  combat.style.display = "none";
  combat.classList.remove("dc200CombatOpen");
  timers.shift().fn();
  assert.equal(context.window.dungeonDebug312().queued, 1);
  assert.equal(context.window.dungeonDebug312().open, true);
  assert.match(document.getElementById("dc312LevelText").innerHTML, /Lyra passe niveau 2/);

  context.window.dc312CloseLevelPopup();
  timers.shift().fn();
  assert.equal(context.window.dungeonDebug312().queued, 0);
  assert.equal(context.window.dungeonDebug312().open, true);
  assert.match(document.getElementById("dc312LevelText").innerHTML, /Lyra passe niveau 3/);
}

function spatialModel() {
  const context = { window: {} };
  vm.runInNewContext(script("dungeonCore313SpatialModel"), context);
  assert.ok(context.window.DungeonSpatial313, "le modèle spatial 3.13 doit être exposé");
  return context.window.DungeonSpatial313;
}

function testExistingRunMigratesWithoutMovingHeroes() {
  const spatial = spatialModel();
  const runtime = {
    participants: ["aldren", "lyra", "brom"],
    index: 0,
    room: 4,
    last: { kind: "enemy", map: { size: 2, cells: ["entry", "floor", "enemy", "exit"] } },
    positions: { aldren: 1, lyra: 0, brom: 3 },
    remaining: { aldren: 2, lyra: 3, brom: 1 },
    enemyCells: { skeleton: 2 }
  };

  spatial.ensure(runtime);

  assert.deepEqual(
    JSON.parse(JSON.stringify(runtime.heroRooms)),
    { aldren: 4, lyra: 4, brom: 4 },
    "une sauvegarde antérieure doit migrer dans la salle courante sans téléportation"
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(runtime.positions)),
    { aldren: 1, lyra: 0, brom: 3 },
    "la migration doit conserver chaque case existante"
  );
  assert.equal(runtime.roomStates["4"].last.kind, "enemy");
  assert.equal(runtime.spatialVersion, 1);
}

function testDoorCrossingMovesOnlyActiveHero() {
  const spatial = spatialModel();
  const runtime = {
    participants: ["aldren", "lyra", "brom"],
    index: 0,
    room: 0,
    last: null,
    positions: { aldren: -1, lyra: -1, brom: -1 },
    remaining: { aldren: 3, lyra: 3, brom: 3 },
    enemyCells: {}
  };
  spatial.ensure(runtime);

  const roomOne = {
    kind: "enemy",
    room: 1,
    map: { size: 2, cells: ["entry", "floor", "enemy", "exit"], entryIdx: 0, exitIdx: 3 }
  };
  spatial.setRoom(runtime, "aldren", 1);
  runtime.room = 1;
  runtime.last = roomOne;
  runtime.enemyCells = { skeleton: 2 };
  runtime.positions.aldren = 0;
  spatial.persist(runtime);

  assert.equal(spatial.roomOf(runtime, "aldren"), 1);
  assert.equal(spatial.roomOf(runtime, "lyra"), 0);
  assert.equal(runtime.positions.lyra, -1);
  assert.deepEqual(Array.from(spatial.heroesHere(runtime)), ["aldren"]);

  runtime.index = 1;
  spatial.activate(runtime, "lyra");
  assert.equal(runtime.room, 0, "le tour de Lyra doit revenir à sa propre salle");
  assert.equal(runtime.last, null);
  assert.equal(runtime.positions.aldren, 0, "la position d'Aldren doit rester mémorisée en salle 1");

  spatial.setRoom(runtime, "lyra", 1);
  spatial.activate(runtime, "lyra");
  runtime.positions.lyra = 0;
  assert.equal(runtime.last.kind, "enemy", "Lyra doit rejoindre la salle déjà générée");
  assert.equal(runtime.positions.aldren, 0);
  assert.equal(runtime.positions.brom, -1);
  assert.deepEqual(Array.from(spatial.heroesHere(runtime)), ["aldren", "lyra"]);
}

function testRoomSnapshotsSurviveTurnChanges() {
  const spatial = spatialModel();
  const runtime = {
    participants: ["aldren", "lyra"], index: 0, room: 1,
    last: { kind: "chest", map: { size: 1, cells: ["entry"] }, marker: "room-one" },
    positions: { aldren: 0, lyra: 4 }, remaining: {}, enemyCells: {},
    heroRooms: { aldren: 1, lyra: 2 },
    roomStates: {
      "2": { last: { kind: "boss", map: { size: 1, cells: ["exit"] }, marker: "room-two" }, enemyCells: { boss: 0 } }
    },
    heroBranchStates: {}
  };

  spatial.ensure(runtime);
  spatial.persist(runtime);
  runtime.index = 1;
  spatial.activate(runtime, "lyra");
  assert.equal(runtime.room, 2);
  assert.equal(runtime.last.marker, "room-two");
  assert.equal(runtime.enemyCells.boss, 0);

  runtime.index = 0;
  spatial.activate(runtime, "aldren");
  assert.equal(runtime.room, 1);
  assert.equal(runtime.last.marker, "room-one");
}

function testCombatParticipationUsesConfiguredRange() {
  const spatial = spatialModel();
  const runtime = {
    participants: ["aldren", "lyra", "brom", "remote"], index: 0, room: 1,
    last: { kind: "enemy", map: { size: 3, cells: Array(9).fill("floor") } },
    positions: { aldren: 0, lyra: 2, brom: 8, remote: 1 }, remaining: {}, enemyCells: {},
    heroRooms: { aldren: 1, lyra: 1, brom: 1, remote: 2 }, roomStates: {}, heroBranchStates: {}
  };
  spatial.ensure(runtime);

  assert.deepEqual(
    Array.from(spatial.participatingHeroes(runtime, "aldren", 2, true)),
    ["aldren", "lyra"],
    "seuls les héros de la même salle à portée doivent participer"
  );
  assert.deepEqual(
    Array.from(spatial.participatingHeroes(runtime, "aldren", 2, false)),
    ["aldren", "lyra", "brom"],
    "le mode narratif conserve tous les héros de la même zone"
  );

  runtime.last.map.cells[1] = "wall";
  runtime.last.map.cells[4] = "wall";
  assert.deepEqual(
    Array.from(spatial.participatingHeroes(runtime, "aldren", 2, true)),
    ["aldren"],
    "la portée doit suivre les cases praticables et ne pas traverser les murs"
  );
}

function testLocalCombatLossIsNotGlobalDefeat() {
  const spatial = spatialModel();
  assert.equal(
    spatial.combatDefeatScope(["aldren", "lyra", "brom"], ["aldren", "lyra"], ["brom"]),
    "local",
    "deux combattants KO ne doivent pas tuer le troisième héros resté ailleurs"
  );
  assert.equal(
    spatial.combatDefeatScope(["aldren", "lyra", "brom"], ["aldren", "lyra"], []),
    "global",
    "la partie se termine seulement quand tout le groupe est KO"
  );
  assert.equal(
    spatial.combatDefeatScope(["aldren", "lyra", "brom"], ["aldren", "lyra"], ["lyra", "brom"]),
    "none",
    "le combat continue tant qu'un combattant est encore debout"
  );

  const runtime = script("dungeonCore200Rebuild");
  assert.match(runtime, /function wholePartyDown200/, "le runtime doit distinguer combat perdu et groupe entier KO");
  assert.match(runtime, /COMBATTANTS HORS COMBAT/, "une défaite locale doit rendre la main au héros survivant");
  assert.match(runtime, /Les ennemis restent dans la salle/, "une défaite locale ne doit pas supprimer les ennemis");

  for (const id of ["dungeonCore213Stability", "dungeonCore214SingleAuthority"]) {
    const core = script(id);
    const fnName = id.includes("213") ? "allPartyDown" : "partyDown";
    const body = core.match(new RegExp(`function ${fnName}\\(\\)\\{[\\s\\S]*?\\n\\}`))?.[0] || "";
    assert.match(body, /gensrpg_dungeon_runtime_v2/, `${id} doit vérifier tous les héros du runtime`);
    assert.doesNotMatch(body, /dungeonCombatSelection/, `${id} ne doit pas confondre combattants et groupe entier`);
  }

  assert.match(
    script("dungeonCore303TimelineRootFix"),
    /dc315ResolveCombatWipe/,
    "la timeline finale doit arrêter un combat dont tous les participants sont KO"
  );
}

function testRuntimeUsesSpatialParticipationAndNoGroupReset() {
  const runtime = script("dungeonCore200Rebuild");
  const explore = runtime.match(/function explore\(\)\{[\s\S]*?\} function moveTo/)?.[0] || "";
  assert.match(runtime, /participatingHeroes/, "un combat doit limiter les héros selon la salle et la portée configurée");
  assert.match(runtime, /combatParticipationRange/, "la portée d'entraide doit provenir de l'éditeur");
  assert.match(runtime, /spatialSetRoom\(x,heroId,targetRoom\)/, "la porte doit déplacer seulement le héros actif");
  assert.doesNotMatch(
    explore,
    /ensurePositions\(x,true\)/,
    "explorer une salle ne doit plus réinitialiser les positions de tout le groupe"
  );
  assert.match(explore, /const movementLeft=/, "le mouvement restant doit être capturé avant le changement de salle");
  assert.equal(
    (explore.match(/x\.remaining\[heroId\]=movementLeft/g) || []).length,
    2,
    "le mouvement restant doit être conservé dans une salle nouvelle comme dans une salle existante"
  );
  assert.doesNotMatch(
    explore,
    /x\.remaining\[heroId\]=moveMax\(heroId\)/,
    "franchir une porte ne doit pas rendre tous les points de mouvement"
  );
  const branchEntry = runtime.match(/function enterBranch\(id\)\{[\s\S]*?function leaveBranch/)?.[0] || "";
  assert.match(branchEntry, /x\.remaining\[hero\]=movementLeft/, "une sous-salle doit aussi conserver le mouvement restant");
  assert.doesNotMatch(branchEntry, /x\.remaining\[hero\]=moveMax\(hero\)/, "une sous-salle ne doit pas offrir un nouveau tour gratuit");
}

function testEnemyAlertsAndBowContextRecovery() {
  const runtime = script("dungeonCore200Rebuild");
  assert.match(runtime, /RENFORTS ENNEMIS/, "les renforts doivent afficher un popup bloquant");
  assert.match(runtime, /HÉROS REPÉRÉ/, "une détection ennemie doit prévenir avant le combat automatique");
  assert.match(
    html,
    /if\(!e\|\|!it\|\|!st\)\{[\s\S]*?dungeonCombatRestoreHeroContext\(\)/,
    "une attaque d'arme refusée doit libérer le contexte du héros"
  );
  assert.match(runtime, /function visibleEnemies\(\)/, "la visibilité des ennemis doit être distincte de leur engagement");

  const finalTokens = script("dungeonCore310PersistenceAndTokens");
  const visible = finalTokens.match(/function enemies\(x\)\{[\s\S]*?\n\}/)?.[0] || "";
  assert.doesNotMatch(visible, /dc200BypassedBy/, "le tour d'un héros furtif ne doit pas masquer les ennemis aux autres héros");
}

testEncounterOnlyRepairsOnRoomCreation();
testCreaturePortraitReplacesEveryLegacyGlyph();
testCombatItemsDoNotStackHiddenDamagePopup();
testLevelUpsAreQueuedUntilCombatEnds();
testExistingRunMigratesWithoutMovingHeroes();
testDoorCrossingMovesOnlyActiveHero();
testRoomSnapshotsSurviveTurnChanges();
testCombatParticipationUsesConfiguredRange();
testLocalCombatLossIsNotGlobalDefeat();
testRuntimeUsesSpatialParticipationAndNoGroupReset();
testEnemyAlertsAndBowContextRecovery();
console.log("Dungeon regression tests: OK");
