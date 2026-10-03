from pathlib import Path
import json

OLD_INDEX_BLOB = "02a052bc231728eb383e17c83e61a958be0ac58c"
NEW_INDEX_BLOB = "f523410e175ee4946059da8e8ee8519295fb63c5"

index = Path("index.html")
text = index.read_text(encoding="utf-8")

load_old = """<script src="assets/gensrpg/survival/entry-v1.js?v=1"></script>
<script src="assets/gensrpg/dungeon/entry-v1.js?v=1"></script>"""
load_new = load_old + '\n<script src="assets/gensrpg/capture/entry-v1.js?v=1"></script>'
assert text.count(load_old) == 1, "unexpected entry load seam"
text = text.replace(load_old, load_new, 1)

provider_old = """const gensCaptureStartConfiguredGame139V1=window.startConfiguredGame;
const gensCaptureStartModuleSessionV1=async()=>{
  if(gensShellActiveModuleV1()!=="capture")return false;
  await gensCaptureStartConfiguredGame139V1();
  return true;
};
window.GensShellModuleLaunchV1.register("capture",gensCaptureStartModuleSessionV1);"""
provider_new = """const gensCaptureStartConfiguredGame139V1=window.startConfiguredGame;
window.GensCaptureV1.install(gensCaptureStartConfiguredGame139V1);"""
assert text.count(provider_old) == 1, "unexpected Capture139 provider seam"
text = text.replace(provider_old, provider_new, 1)
index.write_text(text, encoding="utf-8", newline="")

entry = Path("assets/gensrpg/capture/entry-v1.js")
entry.write_text("""\
"use strict";

(function installGensCaptureV1(root){
  const VERSION="1.0.0";
  let legacyStartConfiguredGame=null;
  let installed=false;

  async function startModuleSession(){
    const shell=root.GensShellModuleLaunchV1;
    if(!shell||typeof shell.activeModule!=="function")return false;
    if(shell.activeModule()!=="capture")return false;
    if(typeof legacyStartConfiguredGame!=="function")return false;
    await legacyStartConfiguredGame();
    return true;
  }

  function install(legacyStart){
    if(typeof legacyStart!=="function")throw new TypeError("GensCaptureV1.install requires the Capture139 legacy start function");
    if(installed){
      if(legacyStartConfiguredGame!==legacyStart)throw new Error("GensCaptureV1 legacy start owner already bound");
      return true;
    }
    const shell=root.GensShellModuleLaunchV1;
    if(!shell||typeof shell.register!=="function")throw new Error("GensCaptureV1 requires GensShellModuleLaunchV1");
    legacyStartConfiguredGame=legacyStart;
    shell.register("capture",startModuleSession);
    installed=true;
    return true;
  }

  function status(){
    return Object.freeze({installed,legacyBound:typeof legacyStartConfiguredGame==="function"});
  }

  root.GensCaptureV1=Object.freeze({VERSION,install,startModuleSession,status});
})(typeof window!=="undefined"?window:globalThis);
""", encoding="utf-8", newline="")

contract = {
  "version": 1,
  "phase": 3,
  "module": "capture",
  "status": "partial-runtime-loaded",
  "plannedEntry": "assets/gensrpg/capture/entry-v1.js",
  "owns": [
    "Monster Capture public runtime entry",
    "Capture module-launch provider"
  ],
  "consumes": [
    "core public contracts",
    "Shell module-launch public contract",
    "temporary legacy Capture139 session start binding"
  ],
  "forbidden": [
    "Dungeon private runtime",
    "Survival private runtime",
    "PvP private runtime",
    "Tactical private runtime",
    "Capture gameplay ownership inside the public entry"
  ],
  "lifecycle": {
    "install": "explicit Capture139 legacy binding; registers the Capture public provider exactly once",
    "dispose": "not temporary in this seam; no listener observer timer or storage state is created"
  },
  "invariants": [
    "the active entry exposes only the public GensCaptureV1 namespace",
    "the entry owns the public Capture module-launch provider but not Capture gameplay/session initialization",
    "Capture139 remains the sole temporary legacy session initializer during this seam",
    "the entry has no DOM storage listener observer timer retry Dungeon Tactical Combat or Exploration dependency",
    "only one Shell register capture provider is active",
    "historical Dungeon compatibility remains unchanged until separately audited"
  ],
  "publicEntries": {
    "moduleScreenReturn": {
      "contract": "assets/gensrpg/shell/module-screen-return-contract-v1.json",
      "operation": "returnToPrimaryView",
      "status": "declared-not-loaded",
      "ownership": "module-owned-primary-view"
    },
    "moduleLaunch": {
      "contract": "assets/gensrpg/shell/module-launch-contract-v1.json",
      "operation": "startModuleSession",
      "status": "loaded-public-provider",
      "ownership": "module-owned-session-start"
    }
  },
  "activatedPhase": 9,
  "publicRuntimeApi": "GensCaptureV1"
}

Path("assets/gensrpg/capture/module-contract-v1.json").write_text(
  json.dumps(contract, ensure_ascii=False, indent=2) + "\n",
  encoding="utf-8",
  newline=""
)
