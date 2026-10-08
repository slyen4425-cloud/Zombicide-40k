from pathlib import Path
import hashlib,json,re

OLD_BLOB="462abc969e7ac636f8ac4ee54c0d14fe51b83e7d"
NEW_BLOB="26421e0347305437fe2b1dc149b3e4fb8b3761bd"
OLD_SIZE=8165794
NEW_SIZE=8165823

def blob(b):
    return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
def replace_once(text,old,new,label):
    if text.count(old)!=1:
        raise AssertionError(f"{label}: expected one exact seam, got {text.count(old)}")
    return text.replace(old,new,1)
def patch_file(path,updates):
    p=Path(path)
    s=p.read_text(encoding="utf-8")
    for old,new in updates:
        s=replace_once(s,old,new,str(p))
    p.write_text(s,encoding="utf-8",newline="")
    return s

p=Path("index.html")
raw=p.read_bytes()
assert len(raw)==OLD_SIZE and blob(raw)==OLD_BLOB, "Rule 26 exact baseline mismatch: STOP"
s=raw.decode("utf-8")
anchor='<script src="assets/gensrpg/capture/session-start-v1.js?v=1"></script>'
s=replace_once(s,anchor,anchor+'\n<script src="assets/gensrpg/capture/screen-return-v1.js?v=1"></script>',"index script order")
old='''/* Le Shell garde l’unique frontière globale goMenu.
   Capture expose uniquement son retour owner-local via le contrat public. */
window.GensShellScreenReturnV1?.register?.("capture",function(){
  if(!hasActiveSession()||!isCaptureContext138())return false;
  captureEnterWorld139();
  return true;
});'''
new='''/* Le propriétaire Capture enregistre son retour via ses seules dépendances legacy. */
window.GensCaptureScreenReturnV1.install({
  hasActiveSession:()=>hasActiveSession(),
  isCaptureContext:()=>isCaptureContext138(),
  enterWorld:()=>captureEnterWorld139()
});'''
s=replace_once(s,old,new,"Capture139 single return authority seam")
b=s.encode("utf-8")
assert len(b)==NEW_SIZE and blob(b)==NEW_BLOB, "Unexpected runtime result: STOP"
p.write_bytes(b)

contract_path=Path("assets/gensrpg/capture/module-contract-v1.json")
contract=json.loads(contract_path.read_text(encoding="utf-8"))
assert contract["publicEntries"]["moduleScreenReturn"]["status"]=="declared-not-loaded"
assert "Capture screen-return owner public API" not in contract["consumes"]
contract["owns"].append("Capture screen-return primary-view provider")
contract["consumes"].append("Capture screen-return owner public API")
contract["lifecycle"]["screenReturn"]="GensCaptureScreenReturnV1 installed explicitly from Capture139 legacy dependencies, unregisters functional access on dispose"
contract["invariants"].append("Capture139 wires but does not register the unique Capture screen-return provider; GensCaptureScreenReturnV1 owns Shell registration")
contract["publicEntries"]["moduleScreenReturn"]["status"]="loaded-public-provider"
contract_path.write_text(json.dumps(contract,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

manifest_path=Path("docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json")
manifest=json.loads(manifest_path.read_text(encoding="utf-8"))
assert len(manifest["files"])==84
key="assets/gensrpg/capture/screen-return-v1.js"
assert key not in manifest["files"]
manifest["files"][key]={
 "owner":"GenSrpG Capture Screen Return",
 "domain":"capture",
 "role":"active Phase 9 unique Shell screen-return provider for Capture using explicitly injected Capture-owned session/context and Hub rendering bindings"
}
manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

# These four Phase 2 artifacts record the exact index byte identity, not gameplay.
for rel in [
 "docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv",
 "docs/GENSRPG_PHASE2_INLINE_OWNERS.json",
 "docs/GENSRPG_PHASE2_STORAGE_OWNERS.json",
 "docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json"
]:
 patch_file(rel,[(OLD_BLOB,NEW_BLOB)])
patch_file("docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json",[('"externalReachableFiles": 84','"externalReachableFiles": 85')])

# Historical browser and architectural guards must continue to run, with owner
# expectations shifted to the newly proven module rather than silently skipped.
patch_file("tests/gens_phase5_module_screen_return_capture_raccord_v1.test.cjs",[
 ("assert.match(capture,/GensShellScreenReturnV1/,","assert.match(capture,/GensCaptureScreenReturnV1/,"),
])
patch_file("tests/gens_phase5_module_screen_return_dungeon_s2_v1.test.cjs",[
 ("assert.match(capture,/GensShellScreenReturnV1/,","assert.match(capture,/GensCaptureScreenReturnV1/,"),
])
patch_file("tests/gens_phase5_module_screen_return_raccord_preaudit_v1.test.cjs",[
 ("assert.equal(contract.publicEntries?.moduleScreenReturn?.status,'declared-not-loaded',","assert.equal(contract.publicEntries?.moduleScreenReturn?.status,module==='capture'?'loaded-public-provider':'declared-not-loaded',"),
])
patch_file("tests/gens_phase9_capture_top_level_entry_preaudit_v1.test.cjs",[
 ("assert.equal(contract.publicEntries?.moduleScreenReturn?.status,'declared-not-loaded');","assert.equal(contract.publicEntries?.moduleScreenReturn?.status,'loaded-public-provider');"),
])
patch_file("tests/gens_phase9_capture_screen_return_ownership_preaudit_v1.test.cjs",[
 ("assert.equal(captureContract.publicEntries?.moduleScreenReturn?.status,'declared-not-loaded',","assert.equal(captureContract.publicEntries?.moduleScreenReturn?.status,'loaded-public-provider',"),
 ("assert.match(capture,/GensShellScreenReturnV1/);","assert.match(capture,/GensCaptureScreenReturnV1/);"),
 ("assert.match(capture,/register\\?\\.\\(\\s*[\"']capture[\"']/,\n  'the existing LIVE screen-return provider is registered from Capture139');","assert.match(capture,/GensCaptureScreenReturnV1\\.install\\s*\\(/,\n  'the existing LIVE screen-return provider must be installed via the dedicated Capture owner');"),
 ("assert.equal((capture.match(/register\\?\\.\\(\\s*[\"']capture[\"']/g)||[]).length,1,\n  'the historic Capture block must own exactly one return registration');","assert.equal((capture.match(/GensCaptureScreenReturnV1\\.install\\s*\\(/g)||[]).length,1,\n  'the historic Capture block must provide exactly one owner dependency binding');"),
])
patch_file("tests/gens_phase3_target_structure_contracts_v1.test.cjs",[
 ("assert.equal(Object.keys(ownerManifest.files||{}).length,84,","assert.equal(Object.keys(ownerManifest.files||{}).length,85,"),
 ("productionOwnerGraph:84","productionOwnerGraph:85"),
 ("captureAuxiliaryRuntimeOwners:1","captureAuxiliaryRuntimeOwners:2"),
])
# Mechanical historical "current index" fingerprints: keep every test case
# except obsolete physical-owner assertions above, no skipped tests.
changed=[]
for path in sorted(Path("tests").rglob("*.test.cjs")):
 txt=path.read_text(encoding="utf-8")
 fixed=txt.replace(OLD_BLOB,NEW_BLOB).replace(str(OLD_SIZE),str(NEW_SIZE))
 if fixed!=txt:
  path.write_text(fixed,encoding="utf-8",newline="")
  changed.append(str(path))
print("RUNTIME VERIFIED",len(b),NEW_BLOB)
print("REPINNED TEST FILES",len(changed))
print("\n".join(changed[:18]))
