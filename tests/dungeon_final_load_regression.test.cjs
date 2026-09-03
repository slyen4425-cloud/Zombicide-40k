const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const builtIndex = path.resolve(process.argv[2] || path.join(root, "index.html"));
const built = fs.readFileSync(builtIndex, "utf8");
const core316 = fs.readFileSync(path.join(root, "assets", "dungeon", "dungeon-core-316.js"), "utf8");
const uiSource = fs.readFileSync(path.join(root, "assets", "dungeon", "dungeon-equipment-ui.js"), "utf8");

function testBuiltLoadOrder() {
  const core316Pos = built.lastIndexOf("assets/dungeon/dungeon-core-316.js");
  const core318Pos = built.lastIndexOf("assets/dungeon/dungeon-core-318.js");
  const roomCreatorPos = built.lastIndexOf("assets/dungeon/dungeon-room-creator-100.js");
  const uiPos = built.lastIndexOf("assets/dungeon/dungeon-equipment-ui.js");

  assert.ok(core316Pos >= 0, "Core 3.16 doit être présent dans la page finale");
  assert.ok(core318Pos >= 0, "Core 3.18 doit être présent dans la page finale");
  assert.ok(roomCreatorPos >= 0, "le Créateur de salles V1 doit être présent dans la page finale");
  assert.ok(uiPos >= 0, "le raccordement final des équipements doit être présent dans la page finale");
  assert.ok(uiPos > core318Pos, "le raccordement équipement doit charger après Core 3.18");
  assert.ok(uiPos > roomCreatorPos, "le raccordement équipement doit être la couche UI finale");

  assert.match(core316, /set_ancient[\s\S]*name:"Armure des Anciens",pieceCount:5/);
  for (const key of ["armor","defense","force","agilite","endurance","intelligence","esprit","initiative","magicDefense","crit"]) {
    assert.match(core316, new RegExp(`${key}:`), `champ rpgBonuses supporté manquant : ${key}`);
  }
  assert.match(core316, /window\.dungeonEquippedSetState=/, "le moteur de set existant doit rester la source de vérité");
}

class Element {
  constructor(tag = "div") {
    this.tagName = String(tag).toUpperCase();
    this.id = "";
    this.className = "";
    this.parentNode = null;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.textContent = "";
    this._innerHTML = "";
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }
  querySelector() { return null; }
  set innerHTML(value) {
    this._innerHTML = String(value);
    for (const child of this.children) child.parentNode = null;
    this.children = [];
  }
  get innerHTML() { return this._innerHTML; }
}

function findById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.children || []) {
    const found = findById(child, id);
    if (found) return found;
  }
  return null;
}

function testFinalRuntimeContract() {
  const html = new Element("html");
  const head = new Element("head");
  const body = new Element("body");
  const host = new Element("section");
  host.id = "dungeonEquipmentSlots";
  html.appendChild(head);
  html.appendChild(body);
  body.appendChild(host);

  const document = {
    readyState: "complete",
    documentElement: html,
    head,
    body,
    getElementById(id) { return findById(html, id); },
    createElement(tag) { return new Element(tag); },
    querySelector() { return null; },
    addEventListener() {}
  };

  const ancient = [
    { id:"ditem_ancient_helm", name:"Heaume des Anciens", setId:"set_ancient", setPieceId:"head", rpgBonuses:{armor:1,esprit:1} },
    { id:"ditem_ancient_chest", name:"Plastron des Anciens", setId:"set_ancient", setPieceId:"torso", rpgBonuses:{armor:3} },
    { id:"ditem_ancient_gauntlets", name:"Gantelets des Anciens", setId:"set_ancient", setPieceId:"hands", rpgBonuses:{armor:1,force:1} }
  ];
  const set = {
    id:"set_ancient",
    name:"Armure des Anciens",
    pieceCount:5,
    thresholds:[
      {pieces:2,bonuses:{armor:1}},
      {pieces:3,bonuses:{magicDefense:1}},
      {pieces:4,bonuses:{endurance:2}},
      {pieces:5,bonuses:{defense:1,force:1}}
    ]
  };

  let setStateCalls = 0;
  let overrides = {};
  let lateRendererCalls = 0;
  const context = {
    console,
    document,
    MutationObserver: class { observe() {} },
    requestAnimationFrame(fn) { fn(); },
    setTimeout(fn) { fn(); return 1; },
    DUNGEON_EQUIPMENT_SETS: { set_ancient:set },
    dungeonEquippedItems() { return ancient; },
    dungeonSetStateFromItems316(items) {
      setStateCalls += 1;
      const count = new Set(items.map(item => item.setPieceId)).size;
      const activeThresholds = set.thresholds.filter(t => count >= t.pieces);
      return [{ setId:"set_ancient", set, count, items, activeThresholds, bonuses:{armor:1,magicDefense:1} }];
    },
    dungeonItems() { return ancient; },
    itemById(id) { return ancient.find(item => item.id === id) || null; },
    loadDungeonItemOverrides() { return JSON.parse(JSON.stringify(overrides)); },
    saveDungeonItemOverrides(next) { overrides = JSON.parse(JSON.stringify(next)); },
    z40kEscHtml(value) { return String(value); },
    renderDungeonGear() {
      lateRendererCalls += 1;
      host.innerHTML = "<div>renderer tardif</div>";
    }
  };
  context.window = context;

  vm.runInNewContext(uiSource, context, { filename:"dungeon-equipment-ui.js" });

  assert.ok(context.DungeonEquipmentUI, "le bridge final doit être exposé");
  const fieldKeys = Array.from(context.DungeonEquipmentUI.supportedBonusFields, field => field.key);
  for (const key of ["armor","defense","force","agilite","endurance","intelligence","esprit","initiative","magicDefense","crit"]) {
    assert.ok(fieldKeys.includes(key), `réglage équipement final manquant : ${key}`);
  }

  context.renderDungeonGear();
  assert.equal(lateRendererCalls, 1, "le renderer déjà chargé doit continuer à fonctionner");

  const finalBox = document.getElementById("dungeonEquipmentUiFinal");
  assert.ok(finalBox, "le panneau final doit être recréé après le renderer");
  assert.match(finalBox.innerHTML, /Armure des Anciens — 3\/5/);
  assert.match(finalBox.innerHTML, /Paliers obtenus/);
  assert.match(finalBox.innerHTML, /✅ 2 pièces : \+1 Armure/);
  assert.match(finalBox.innerHTML, /✅ 3 pièces : \+1 Défense magique/);
  assert.match(finalBox.innerHTML, /Prochains paliers/);
  assert.match(finalBox.innerHTML, /🔒 4 pièces : \+2 Endurance/);
  assert.match(finalBox.innerHTML, /🔒 5 pièces : \+1 Défense · \+1 Force/);
  assert.match(finalBox.innerHTML, /⚙️ Réglages équipements/);
  for (const label of ["Armure","Défense","Force","Agilité","Endurance","Intelligence","Esprit","Initiative","Défense magique","Critique %"]) {
    assert.match(finalBox.innerHTML, new RegExp(label), `libellé de réglage absent : ${label}`);
  }
  assert.ok(setStateCalls > 0, "l'affichage final doit consommer le moteur de set 3.16 existant");

  const result = context.DungeonEquipmentUI.setEquipmentBonus("ditem_ancient_helm","crit",7);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {ok:true,persisted:true});
  assert.equal(ancient[0].rpgBonuses.crit, 7, "l'édition doit modifier le rpgBonuses existant");
  assert.equal(overrides.ditem_ancient_helm.rpgBonuses.crit, 7, "l'édition doit passer par les overrides existants");
}

function testDeploymentGuard() {
  const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "main.yml"), "utf8");
  assert.match(workflow, /dungeon_runtime_regression\.test\.cjs/, "dungeon_runtime_regression doit bloquer le déploiement");
  assert.match(workflow, /dungeon_final_load_regression\.test\.cjs/, "le test de chargement final doit bloquer le déploiement");
}

testBuiltLoadOrder();
testFinalRuntimeContract();
testDeploymentGuard();
console.log("Dungeon final load regression: OK");