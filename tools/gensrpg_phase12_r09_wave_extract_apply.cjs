"use strict";
const fs = require("node:fs");
const crypto = require("node:crypto");
const vm = require("node:vm");
const cp = require("node:child_process");
const ORIGINAL = "6eeed45a0a12085c1b107ee6c24b49040277ca54";
const NEW_INDEX = "4dbe3314d5048f2def404ed674498c0670c04fc1";
const NEW_MODULE = "515642eda275802c50af867d5712517d47020414";
const BASE_SHA = "f458f0dce79a6bf0034c69bca36313f671d51fc4";
const MODULE = "assets/gensrpg/survival/legacy-wave-presets-spawn-v1.js";
const HOOK = '<script src="' + MODULE + '"></script>\n';
const spans = "520059,520206;520207,520383;520384,520471;520472,520693;520694,520783;520785,522089;522090,522236;522237,522377;522378,522897;522899,524039;524040,524277;524536,524748;524749,524990;524991,525741;525742,526275;526335,526808;526809,527590;527591,527757;527759,528229;528230,528324;528325,528416;528417,528575;528576,528690;528691,528973;528974,529442;529443,529764;529765,531613;531614,532244;532245,534090;534091,534733;534734,534793;534794,535618;535619,536330;536331,537318;537321,537643;537644,537810;537811,538022;538023,541350;541351,541692;541693,542660;542661,543116;543117,543818;543819,544231;544232,544556;544557,544754;544755,544970;544971,545490;545491,545885;545886,546179;546180,547548;547550,548436;548437,548884;548885,549409;553583,553728;553729,553913;553914,554119;554120,554203;554204,554454;554455,554580;554581,554711;554713,554817;554818,554923;554924,555358;555359,556014;556016,556291;556292,557780;557782,558105;558106,558202;558290,558745;559127,559443;559444,559649;559651,563745".split(";").map(s => s.split(",").map(Number));
const header = "/* GenSrpG — R09 / propriétaire Survie (éditeur de vagues, réserve et apparition).\n * Extraction de déclarations historiques inchangées depuis index.html R08.\n * Script classique synchrone; les constantes partagées demeurent dans l'ancien script.\n * Ne pas déplacer dans un autre propriétaire sans audit de contrat.\n */\n";
function blob(x) {
  const b = Buffer.from(x, "utf8");
  return crypto.createHash("sha1").update("blob " + b.length + "\0").update(b).digest("hex");
}
function invariant(ok, reason) {if (!ok) throw Error(reason);}
function compile(source) {new vm.Script(source, {filename: "gensrpg-r09-legacy.js"});}
function extract(source) {
  invariant(Buffer.byteLength(source, "utf8") === 2131805 && blob(source) === ORIGINAL, "R09: §26 source mismatch");
  const scripts = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  invariant(scripts.length === 163, "R09: unexpected script count " + scripts.length);
  const m = scripts[19], body = m[2];
  invariant(body.length === 798592, "R09: source JS span changed");
  const names = ["defaultZombieConfig", "loadZombieConfig", "showSpawnResolution"];
  const selected = spans.map(([a,b]) => body.slice(a,b));
  invariant(spans.length === 72, "R09: selected function count");
  invariant(selected[0].startsWith("function " + names[0] + "("), "R09: first declaration mismatch");
  invariant(selected.at(-1).startsWith("function " + names[2] + "("), "R09: final declaration mismatch");
  invariant(selected.every(x=>/^(?:async )?function [A-Za-z_$][\w$]*\(/.test(x)), "R09: invalid declaration in selection");
  const module = header + selected.join("\n\n") + "\n";
  let remaining = body;
  for (const [a,b] of spans.slice().reverse()) remaining = remaining.slice(0,a) + remaining.slice(b);
  compile(module); compile(remaining);
  let rollback = remaining;
  for (const [a,b] of spans) rollback = rollback.slice(0,a) + body.slice(a,b) + rollback.slice(a);
  invariant(rollback === body, "R09: rollback is not byte exact");
  const start = source.indexOf(m[0],m.index), bodyStart = source.indexOf(body,m.index);
  invariant(start >= 0 && bodyStart >= 0, "R09: script location not found");
  let html = source.slice(0,bodyStart) + remaining + source.slice(bodyStart+body.length);
  html = html.slice(0,start) + HOOK + html.slice(start);
  invariant(Buffer.byteLength(html) === 2093066 && blob(html) === NEW_INDEX, "R09: output index mismatch");
  invariant(Buffer.byteLength(module) === 39292 && blob(module) === NEW_MODULE, "R09: module mismatch");
  return {html,module};
}
const mode=process.argv[2]||"--check-source";
if (mode==="--check-source") {
  extract(fs.readFileSync("index.html","utf8"));
  invariant(!fs.existsSync(MODULE), "R09: module already exists");
  process.stdout.write("R09 source GREEN: 72 functions / d7 exact\n");
} else if (mode==="--apply") {
  invariant(!fs.existsSync(MODULE), "R09: module already exists");
  const result=extract(fs.readFileSync("index.html","utf8"));
  const swPath="service-worker.js", sw=fs.readFileSync(swPath,"utf8");
  const cacheMarker="-r08-shared-ability-skill-catalog",newMarker=cacheMarker+"-r09-survival-wave-spawn";
  invariant(sw.includes(cacheMarker) && !sw.includes(newMarker), "R09: PWA version guard mismatch");
  const swUpdated=sw.replace(cacheMarker,newMarker)
    .replace('"./assets/gensrpg/builders/legacy-ability-skill-catalog-v1.js"',
    '"./assets/gensrpg/builders/legacy-ability-skill-catalog-v1.js","./'+MODULE+'"');
  invariant(swUpdated.includes("./"+MODULE), "R09: missing PWA asset");
  const ownerPath="docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json";
  const owners=JSON.parse(fs.readFileSync(ownerPath,"utf8"));
  invariant(!owners.files[MODULE], "R09: duplicate owner");
  owners.files[MODULE]={owner:"GenSrpG Survie / vague, réserve et apparition R09",domain:"survival",role:"72 fonctions originales de l'éditeur de vagues, pioche d'apparition et affichage spawn; aucun moteur de combat dupliqué; script classique synchrone"};
  fs.mkdirSync(require("node:path").dirname(MODULE),{recursive:true});
  fs.writeFileSync(MODULE,result.module,"utf8");
  fs.writeFileSync("index.html",result.html,"utf8");
  fs.writeFileSync(swPath,swUpdated,"utf8");
  fs.writeFileSync(ownerPath,JSON.stringify(owners,null,2)+"\n","utf8");
  process.stdout.write("R09 applied: 72 original Survival declarations\n");
} else if (mode==="--verify") {
  const original=cp.execFileSync("git",["show",BASE_SHA+":index.html"],{maxBuffer:8*1024*1024}).toString("utf8");
  const expected=extract(original);
  invariant(fs.readFileSync("index.html","utf8")===expected.html, "R09: index mismatch to source");
  invariant(fs.readFileSync(MODULE,"utf8")===expected.module, "R09: owner mismatch");
  const sw=fs.readFileSync("service-worker.js","utf8");
  invariant(sw.includes("./"+MODULE) && sw.includes("-r09-survival-wave-spawn"), "R09: PWA missing");
  const owners=JSON.parse(fs.readFileSync("docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json","utf8"));
  invariant(owners.files[MODULE]?.domain==="survival", "R09: wrong owner");
  invariant(blob(original)===ORIGINAL, "R09: rollback cannot recover exact R08");
  process.stdout.write("R09 verified: byte-exact rollback to R08; source and module SHA GREEN\n");
} else {throw Error("Unknown mode: "+mode);}
