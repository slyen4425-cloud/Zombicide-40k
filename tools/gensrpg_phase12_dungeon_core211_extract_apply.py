#!/usr/bin/env python3
"""GenSrpG Phase12 D3. One exact classic-script Dungeon Core211 owner move.

Input bytes were supplied in ar.zip, verified against the D2 GREEN Git blob.
The only index writer is the guarded GitHub Actions workflow on the D3 work branch.
"""
import argparse
import hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OUT=ROOT/"assets/gensrpg/dungeon/core211-consolidation-v1.js"
SRC_LEN=7863589
SRC_SHA="e5f8895495f969597a6c209fcc29afd66b7a0636"
DST_LEN=7846135
DST_SHA="18afb7fa25f86eea9993acc7f961fb7c11901168"
JS_LEN=17511
JS_SHA="bba60d921df20a114b489e17f9222e0c4f310871"
OPEN=b'<script id="dungeonCore211Consolidation">'
CLOSE=b'</script>'
EXTERNAL=b'<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>'
NEW_PATH="assets/gensrpg/dungeon/core211-consolidation-v1.js"

def sha(raw):
    return hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\0"+raw).hexdigest()

def pinned(raw,length,blob,where):
    assert len(raw)==length and sha(raw)==blob, "%s drifted: len=%s blob=%s"%(where,len(raw),sha(raw))

def derive(old):
    pinned(old,SRC_LEN,SRC_SHA,"certified D2 GREEN index")
    assert old.count(OPEN)==1 and EXTERNAL not in old,"Core211 must be one active inline owner"
    p=old.index(OPEN)
    e=old.index(CLOSE,p+len(OPEN))
    body=old[p+len(OPEN):e]
    pinned(body,JS_LEN,JS_SHA,"Core211 exact IIFE")
    new=old[:p]+EXTERNAL+old[e+len(CLOSE):]
    pinned(new,DST_LEN,DST_SHA,"D3 expected index")
    assert new.count(EXTERNAL)==1 and OPEN not in new,"single external Core211 owner"
    return new,body

def replace_once(path,before,after,patches):
    old=patches.get(path)
    if old is None:
        old=(ROOT/path).read_text("utf8")
    assert old.count(before)==1, "%s expected one preimage %r, got %d"%(path,before[:110],old.count(before))
    patches[path]=old.replace(before,after,1)

def d2_index(raw):
    pinned(raw,DST_LEN,DST_SHA,"D3 physical index")
    js=OUT.read_bytes()
    pinned(js,JS_LEN,JS_SHA,"D3 physical Dungeon owner")
    assert raw.count(EXTERNAL)==1
    old=raw.replace(EXTERNAL,OPEN+js+CLOSE,1)
    pinned(old,SRC_LEN,SRC_SHA,"D2 exact rollback")
    return old

def patches_for_apply():
    p={}
    new_line="  '"+NEW_PATH+"',\n"
    for path in ("tests/gens_phase2_runtime_load_graph_v11411.test.cjs",
                 "tests/gens_runtime_composition_guard_v11411.test.cjs"):
        before="  'assets/gensrpg/dungeon/core051-exploration-polish-v1.js',\n  'assets/dungeon/dungeon-core-316.js',\n"
        after="  'assets/gensrpg/dungeon/core051-exploration-polish-v1.js',\n"+new_line+"  'assets/dungeon/dungeon-core-316.js',\n"
        replace_once(path,before,after,p)
    graph="tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
    for old,new in [
        ("productionDirect).size,51,","productionDirect).size,52,"),
        ("allJs.length,109,","allJs.length,110,"),
        ("phase2Js.length,73,","phase2Js.length,74,"),
        ("reachable.size,95,","reachable.size,96,"),
    ]:
        replace_once(graph,old,new,p)
    for path in (
        "tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs",
        "tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs",
    ):
        replace_once(path,"reachable.size,95,","reachable.size,96,",p)
    replace_once("tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs",
                 "mapped.size,95,","mapped.size,96,",p)
    replace_once("tests/gens_phase3_target_structure_contracts_v1.test.cjs",
                 "Object.keys(ownerManifest.files||{}).length,95,",
                 "Object.keys(ownerManifest.files||{}).length,96,",p)
    for path,key in [
        ("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","CURRENT_BLOB"),
        ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","CURRENT_INDEX_BLOB"),
    ]:
        replace_once(path,key+"='"+SRC_SHA+"'",key+"='"+DST_SHA+"'",p)

    manifest="docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    anchor='''    "assets/gensrpg/dungeon/core051-exploration-polish-v1.js": {
      "owner": "Dungeon Core051 Exploration Polish",
      "domain": "dungeon",
      "role": "byte-identical 47962-byte former dungeonCore051ExplorationPolish inline IIFE; synchronous Dungeon exploration and authored challenge UI at its original parser position"
    },'''
    extra='''
    "assets/gensrpg/dungeon/core211-consolidation-v1.js": {
      "owner": "Dungeon Core211 Consolidation",
      "domain": "dungeon",
      "role": "byte-identical 17511-byte former dungeonCore211Consolidation active inline IIFE, loaded as a classic synchronous script at its original parser position"
    },'''
    replace_once(manifest,anchor,anchor+extra,p)
    # These are read-only historical regression fixtures, not production.
    helper="tests/helpers/gens_capture_team_roster_snapshot_v1.cjs"
    replace_once(helper,
                 "function restoreHistoricalHubSnapshot(index,root){",
                 '''function restoreHistoricalHubSnapshot(index,root){
 // D3 is an exact later Dungeon-only extraction. Reverse it before D2,
 // D1 and Capture historical snapshot byte assertions.
 if(hash(index)==='18afb7fa25f86eea9993acc7f961fb7c11901168'){
  index=require('./gens_phase12_d3_rollback_v1.cjs').d2IndexBytes(root,index);
 }''',p)
    global_owner="tests/gens_phase2_global_owner_inventory_v11411.test.cjs"
    replace_once(global_owner,
                 "    if(m[1]!=='gensDungeonCore01Js')return {id:m[1],body:m[2],offset:m.index};",
                 '''    if(m[1]==='dungeonCore211Consolidation'){
      assert.match(m[0],/src="assets\\/gensrpg\\/dungeon\\/core211-consolidation-v1\\.js"/);
      return {id:m[1],body:fs.readFileSync(path.join(root,'assets/gensrpg/dungeon/core211-consolidation-v1.js'),'utf8'),offset:m.index};
    }
    if(m[1]!=='gensDungeonCore01Js')return {id:m[1],body:m[2],offset:m.index};''',p)
    d1test="tests/gens_phase12_dungeon_core01_extraction_v1.test.cjs"
    replace_once(d1test, 'const liveIndex=read("index.html");',
                 'const liveIndex=require("./helpers/gens_phase12_d3_rollback_v1.cjs").d2IndexBytes(root);',p)
    d2test="tests/gens_phase12_dungeon_core051_extraction_v1.test.cjs"
    replace_once(d2test,'const index=read("index.html");',
                 'const index=require("./helpers/gens_phase12_d3_rollback_v1.cjs").d2IndexBytes(root);',p)

    d1tool="tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
    before='''    target=INDEX.read_bytes()
    d2_external=b'<script id="dungeonCore051ExplorationPolish"'''
    after='''    target=INDEX.read_bytes()
    d3_external=b'<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>'
    if d3_external in target:
        assert len(target)==7846135 and blob(target)=="18afb7fa25f86eea9993acc7f961fb7c11901168", "D3 physical index drift"
        d3=(ROOT/"assets/gensrpg/dungeon/core211-consolidation-v1.js").read_bytes()
        assert len(d3)==17511 and blob(d3)=="bba60d921df20a114b489e17f9222e0c4f310871", "D3 script drift"
        assert target.count(d3_external)==1
        target=target.replace(d3_external,b'<script id="dungeonCore211Consolidation">'+d3+b'</script>',1)
        assert len(target)==7863589 and blob(target)=="e5f8895495f969597a6c209fcc0ea6f7a0636" if False else True
        assert len(target)==7863589 and blob(target)=="e5f8895495f969597a6c209fcc29afd66b7a0636", "D2 rollback drift"
    d2_external=b'<script id="dungeonCore051ExplorationPolish"'''
    # no weakened assertions: the exact D2 index fingerprint is mandatory
    replace_once(d1tool,before,after,p)
    # Graph expectation after D2 now includes the one additional D3 file.
    before='''            assert updated.count(expected_after)==1, f"{path}: expected owner graph exactly once after D1/D2"'''
    after='''            if d3_external in INDEX.read_bytes():
                if path in (PATH_OWNERS,PATH_GLOBALS):
                    expected_after="18afb7fa25f86eea9993acc7f961fb7c11901168"
                elif path==PATH_GRAPH:
                    for b,a in [
                        ("size,51,","size,52,"),
                        ("allJs.length,109,","allJs.length,110,"),
                        ("phase2Js.length,73,","phase2Js.length,74,"),
                        ("reachable.size,95,","reachable.size,96,"),
                    ]: expected_after=expected_after.replace(b,a)
            assert updated.count(expected_after)==1, f"{path}: expected owner graph exactly once after D1/D2/D3"'''
    replace_once(d1tool,before,after,p)
    # The D2 tool similarly reconstructs its own immutable index before checking
    # the original D1 restored bytes.
    d2tool="tools/gensrpg_phase12_dungeon_core051_extract_apply.py"
    before='''def verify():
    new=INDEX.read_bytes()
    runtime=OUT.read_bytes()'''
    after='''def verify():
    new=INDEX.read_bytes()
    d3_external=b'<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>'
    if d3_external in new:
        assert new.count(d3_external)==1 and len(new)==7846135 and sha(new)=="18afb7fa25f86eea9993acc7f961fb7c11901168","D3 index drift"
        d3=(ROOT/"assets/gensrpg/dungeon/core211-consolidation-v1.js").read_bytes()
        assert len(d3)==17511 and sha(d3)=="bba60d921df20a114b489e17f9222e0c4f310871","D3 code drift"
        new=new.replace(d3_external,b'<script id="dungeonCore211Consolidation">'+d3+b'</script>',1)
    runtime=OUT.read_bytes()'''
    replace_once(d2tool,before,after,p)
    newhelper="tests/helpers/gens_phase12_d3_rollback_v1.cjs"
    assert not (ROOT/newhelper).exists(),"D3 rollback helper already exists"
    p[newhelper]='''"use strict";
// Read-only exact D3->D2 reconstruction for inherited historical sentinels.
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\\\\0")).update(b).digest("hex");
const srcSha="e5f8895495f969597a6c209fcc29afd66b7a0636";
const dstSha="18afb7fa25f86eea9993acc7f961fb7c11901168";
const jsSha="bba60d921df20a114b489e17f9222e0c4f310871";
const tag=Buffer.from('<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>');
const original=Buffer.from('<script id="dungeonCore211Consolidation">');
function d2IndexBytes(root=path.resolve(__dirname,"../.."),bytes=null){
  const assert=require("node:assert/strict");
  if(!bytes)bytes=fs.readFileSync(path.join(root,"index.html"));
  assert.equal(bytes.length,7846135,"D3 index bytes");
  assert.equal(hash(bytes),dstSha,"D3 active index Git blob");
  const at=bytes.indexOf(tag);
  assert.ok(at>0&&bytes.indexOf(tag,at+tag.length)<0,"D3 owner loaded only once");
  const js=fs.readFileSync(path.join(root,"assets/gensrpg/dungeon/core211-consolidation-v1.js"));
  assert.equal(js.length,17511);
  assert.equal(hash(js),jsSha);
  const old=Buffer.concat([bytes.subarray(0,at),original,js,Buffer.from("</script>"),bytes.subarray(at+tag.length)]);
  assert.equal(old.length,7863589);
  assert.equal(hash(old),srcSha,"byte-exact D2 GREEN reconstruction");
  return old;
}
module.exports={d2IndexBytes};
'''
    newtest="tests/gens_phase12_dungeon_core211_extraction_v1.test.cjs"
    assert not (ROOT/newtest).exists(),"D3 sentinel already exists"
    p[newtest]='''"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const vm=require("node:vm");
const {execFileSync}=require("node:child_process");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p));
const blob=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\\\\0")).update(b).digest("hex");
const current=read("index.html");
const modulePath="assets/gensrpg/dungeon/core211-consolidation-v1.js";
const js=read(modulePath);
assert.equal(current.length,7846135);
assert.equal(blob(current),"18afb7fa25f86eea9993acc7f961fb7c11901168");
assert.equal(js.length,17511);
assert.equal(blob(js),"bba60d921df20a114b489e17f9222e0c4f310871");
const open='<script id="dungeonCore211Consolidation">';
const tag='<script id="dungeonCore211Consolidation" src="'+modulePath+'"></script>';
assert.equal(current.toString().split(tag).length-1,1);
assert.equal(current.toString().includes(open),false,"retired inline owner absent");
const old=require("./helpers/gens_phase12_d3_rollback_v1.cjs").d2IndexBytes(root);
assert.equal(old.length,7863589);
assert.equal(blob(old),"e5f8895495f969597a6c209fcc29afd66b7a0636");
assert.match(js.toString(),/window\\\\.dc211TrapTest\\\\s*=/);
assert.match(js.toString(),/window\\\\.dungeonDebug211\\\\s*=/);
new vm.Script(js.toString(),"core211-consolidation-v1.js");
const text=current.toString();
const at=text.indexOf(tag);
const later=text.indexOf('<script id="dungeonCore212RenderVictory">');
assert.ok(at>0 && later>at,"same parser order before Core212");
execFileSync("python3",["tools/gensrpg_phase12_dungeon_core211_extract_apply.py","--verify"],{cwd:root});
execFileSync("python3",["tools/gensrpg_phase12_dungeon_core051_extract_apply.py","--verify"],{cwd:root});
execFileSync("python3",["tools/gensrpg_phase12_dungeon_core01_extract_apply.py","--verify"],{cwd:root});
console.log(JSON.stringify({phase:"12",lot:"D3",owner:"dungeon",movedBytes:17511,netIndexBytesRemoved:17454,rollbackD1D2D3:true}));
'''
    return p

def verify():
    active=INDEX.read_bytes()
    original=d2_index(active)
    assert derive(original)==(active,OUT.read_bytes()),"full D3 derivation parity"
    print("Phase12 D3 verified: exact owner, exact current index, exact D2 rollback.")

def apply():
    source=INDEX.read_bytes()
    new,js=derive(source)
    assert not OUT.exists(),"D3 already applied: refusing second owner"
    patches=patches_for_apply() # validate all anchors before writing
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(js)
    INDEX.write_bytes(new)
    for path,content in patches.items():
        q=ROOT/path
        q.parent.mkdir(parents=True,exist_ok=True)
        q.write_text(content,"utf8")
    verify()
    print("Patched test and owner contracts:",", ".join(sorted(patches)))

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    g=ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply",action="store_true")
    g.add_argument("--verify",action="store_true")
    args=ap.parse_args()
    if args.apply: apply()
    else:verify()
