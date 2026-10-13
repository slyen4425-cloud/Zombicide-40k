#!/usr/bin/env python3
"""Phase 12 / D3: byte-exact externalization of the active Dungeon MJ72 classic script.

Only operate on the already-certified user ZIP match:
D2 physical index 7863589 bytes, Git blob e5f8895495f969597a6c209fcc29afd66b7a0636.
No runtime rewrite and no touch of production main or isolated labs.
"""
from pathlib import Path
import hashlib
import argparse
import json

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OUTPUT=ROOT/"assets/gensrpg/dungeon/mj72-scene-v1.js"
SOURCE_BYTES=7863589
SOURCE_BLOB="e5f8895495f969597a6c209fcc29afd66b7a0636"
TARGET_BYTES=7836124
TARGET_BLOB="972f0e0be12fac14427853fbcd7abe5233eb5a8c"
BODY_BYTES=27511
BODY_BLOB="8304087b15bbbf5f71c22b7f8c916e0a78b1b905"
OPEN=b'<script id="dungeonMj72_2Script">'
CLOSE=b'</script>'
TAG=b'<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>'

def sha(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

def pin(data,n,digest,where):
    assert len(data)==n and sha(data)==digest, f"{where}: got {len(data)} {sha(data)}; expected {n} {digest}"

def derive(source):
    pin(source,SOURCE_BYTES,SOURCE_BLOB,"D2 ZIP-verified starting index")
    assert source.count(OPEN)==1 and source.count(TAG)==0, "Exactly one pre-D3 MJ72 inline script"
    start=source.index(OPEN)
    end=source.index(CLOSE,start+len(OPEN))
    body=source[start+len(OPEN):end]
    pin(body,BODY_BYTES,BODY_BLOB,"original Dungeon MJ72 code")
    target=source[:start]+TAG+source[end+len(CLOSE):]
    pin(target,TARGET_BYTES,TARGET_BLOB,"expected physical D3 index")
    assert target.count(TAG)==1 and target.count(OPEN)==0
    return target,body

def replace_one(patches,name,before,after):
    current=patches.get(name)
    if current is None: current=(ROOT/name).read_text(encoding="utf-8")
    assert current.count(before)==1, f"{name}: expected exactly one match, found {current.count(before)} for {before[:100]!r}"
    patches[name]=current.replace(before,after,1)

def patches():
    p={}
    newpath="assets/gensrpg/dungeon/mj72-scene-v1.js"
    graph="tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
    composition="tests/gens_runtime_composition_guard_v11411.test.cjs"
    runtime="tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs"
    inventory="tests/gens_phase2_runtime_side_effect_inventory_v11411.test.cjs"
    unreachable="tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs"
    anchor_graph="  'assets/gensrpg/capture/builtin-seed-v1.js',\n  'assets/gensrpg/dungeon/core01-session-ui-v1.js',\n"
    anchor_comp="  'assets/gensrpg/capture/builtin-seed-v1.js?v=1',\n  'assets/gensrpg/dungeon/core01-session-ui-v1.js',\n"
    replace_one(p,graph,anchor_graph,anchor_graph.replace("  'assets/gensrpg/dungeon/core01",f"  '{newpath}',\n  'assets/gensrpg/dungeon/core01"))
    replace_one(p,composition,anchor_comp,anchor_comp.replace("  'assets/gensrpg/dungeon/core01",f"  '{newpath}',\n  'assets/gensrpg/dungeon/core01"))
    for before,after in [
      ("productionDirect).size,51,","productionDirect).size,52,"),
      ("allJs.length,109,","allJs.length,110,"),
      ("phase2Js.length,73,","phase2Js.length,74,"),
      ("reachable.size,95,","reachable.size,96,")
    ]: replace_one(p,graph,before,after)
    for name in (runtime,inventory,unreachable):
        replace_one(p,name,"reachable.size,95,","reachable.size,96,")
    replace_one(p,runtime,"mapped.size,95,","mapped.size,96,")
    for name,key in [
      ("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","CURRENT_BLOB"),
      ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","CURRENT_INDEX_BLOB")
    ]:
        replace_one(p,name,key+"='"+SOURCE_BLOB+"'",key+"='"+TARGET_BLOB+"'")

    # Add only the new active, reachable Dungeon owner; preserve all other manifest records.
    owner="docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    manifest=json.loads((ROOT/owner).read_text(encoding="utf-8"))
    assert len(manifest["files"])==95 and newpath not in manifest["files"]
    manifest["files"][newpath]={
      "owner":"Dungeon MJ72 Scene / Content",
      "domain":"dungeon",
      "role":"byte-identical former dungeonMj72_2Script (27511 bytes); classic synchronous parser-time scene state, rarity and persistence primitives"
    }
    manifest["files"]=dict(sorted(manifest["files"].items()))
    assert len(manifest["files"])==96
    p[owner]=json.dumps(manifest,ensure_ascii=False,indent=2)+"\n"

    # Roll back only D3 inside all existing read-only historical test helpers.
    d2test="tests/gens_phase12_dungeon_core051_extraction_v1.test.cjs"
    before='const index=read("index.html");'
    after='''const currentIndex=read("index.html");
const mj72Tag=Buffer.from('<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>');
const mj72Open=Buffer.from('<script id="dungeonMj72_2Script">');
const mj72Body=read("assets/gensrpg/dungeon/mj72-scene-v1.js");
const mj72At=currentIndex.indexOf(mj72Tag);
assert.ok(mj72At>0,"D3 MJ72 script must load at parser time");
const index=Buffer.concat([
  currentIndex.subarray(0,mj72At),mj72Open,mj72Body,Buffer.from("</script>"),
  currentIndex.subarray(mj72At+mj72Tag.length)
]);'''
    replace_one(p,d2test,before,after)
    d1test="tests/gens_phase12_dungeon_core01_extraction_v1.test.cjs"
    before='const liveIndex=read("index.html");'
    after='''const currentIndex=read("index.html");
const mj72Tag=Buffer.from('<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>');
const mj72Open=Buffer.from('<script id="dungeonMj72_2Script">');
const mj72Body=read("assets/gensrpg/dungeon/mj72-scene-v1.js");
const mj72At=currentIndex.indexOf(mj72Tag);
assert.ok(mj72At>0,"D3 owner must stay at parser-time");
const liveIndex=Buffer.concat([
  currentIndex.subarray(0,mj72At),mj72Open,mj72Body,Buffer.from("</script>"),
  currentIndex.subarray(mj72At+mj72Tag.length)
]);'''
    replace_one(p,d1test,before,after)

    # D2 verifier requires the exact D2 source; undo D3 in memory first.
    d2tool="tools/gensrpg_phase12_dungeon_core051_extract_apply.py"
    before='''def verify():
    new=INDEX.read_bytes()
    runtime=OUT.read_bytes()'''
    after='''def verify():
    new=INDEX.read_bytes()
    d3tag=b'<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>'
    if d3tag in new:
        assert new.count(d3tag)==1, "D3 source only once"
        assert len(new)==7836124 and sha(new)=="972f0e0be12fac14427853fbcd7abe5233eb5a8c", "D3 index fingerprint"
        body=(ROOT/"assets/gensrpg/dungeon/mj72-scene-v1.js").read_bytes()
        assert len(body)==27511 and sha(body)=="8304087b15bbbf5f71c22b7f8c916e0a78b1b905", "D3 code fingerprint"
        new=new.replace(d3tag,b'<script id="dungeonMj72_2Script">'+body+b'</script>',1)
    runtime=OUT.read_bytes()'''
    replace_one(p,d2tool,before,after)

    # D1 verifier already rolls back D2. Restore D3 before invoking it.
    d1tool="tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
    before='''    target=INDEX.read_bytes()
    d2_external=b'<script id="dungeonCore051ExplorationPolish" src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"></script>' '''
    after='''    target=INDEX.read_bytes()
    d3_external=b'<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>'
    if d3_external in target:
        assert target.count(d3_external)==1, "D3 owner must load once"
        d3=(ROOT/"assets/gensrpg/dungeon/mj72-scene-v1.js").read_bytes()
        assert len(target)==7836124 and blob(target)=="972f0e0be12fac14427853fbcd7abe5233eb5a8c", "D3 index drifted"
        assert len(d3)==27511 and blob(d3)=="8304087b15bbbf5f71c22b7f8c916e0a78b1b905", "D3 code drifted"
        target=target.replace(d3_external,b'<script id="dungeonMj72_2Script">'+d3+b'</script>',1)
    d2_external=b'<script id="dungeonCore051ExplorationPolish" src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"></script>' '''
    # Avoid trailing-whitespace fragility by patching just the target assignment.
    replace_one(p,d1tool,"    target=INDEX.read_bytes()\n",after.split("    d2_external=")[0],)
    # D1 compares its old test preimages; expected graph and blob now reflect D3.
    before='''                if path in (PATH_OWNERS,PATH_GLOBALS):
                    expected_after="e5f8895495f969597a6c209fcc29afd66b7a0636"
                elif path==PATH_GRAPH:'''
    after='''                if path in (PATH_OWNERS,PATH_GLOBALS):
                    expected_after=("972f0e0be12fac14427853fbcd7abe5233eb5a8c"
                                    if d3_external in INDEX.read_bytes()
                                    else "e5f8895495f969597a6c209fcc29afd66b7a0636")
                elif path==PATH_GRAPH:'''
    replace_one(p,d1tool,before,after)
    before='''                        expected_after=expected_after.replace(before_count,after_count)
            assert updated.count(expected_after)==1'''
    after='''                        expected_after=expected_after.replace(before_count,after_count)
                    if d3_external in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,51,","size,52,"),
                            ("allJs.length,109,","allJs.length,110,"),
                            ("phase2Js.length,73,","phase2Js.length,74,"),
                            ("reachable.size,95,","reachable.size,96,")
                        ]: expected_after=expected_after.replace(before_count,after_count)
            assert updated.count(expected_after)==1'''
    replace_one(p,d1tool,before,after)

    # Historical Capture snapshots likewise need D3 -> D2 -> D1 before Phase 9.
    snapshot="tests/helpers/gens_capture_team_roster_snapshot_v1.cjs"
    before="function restoreHistoricalHubSnapshot(index,root){\n"
    after='''function restoreHistoricalHubSnapshot(index,root){
 // Phase12 D3: reconstruction is test-only; no runtime fallback or new owner.
 if(hash(index)==='972f0e0be12fac14427853fbcd7abe5233eb5a8c'){
  assert.equal(index.length,7836124,'D3 extracted index length');
  const tag=Buffer.from('<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>');
  const at=index.indexOf(tag);
  assert.ok(at>0 && index.indexOf(tag,at+tag.length)<0,'single D3 MJ72 owner');
  const body=fs.readFileSync(path.join(root,'assets/gensrpg/dungeon/mj72-scene-v1.js'));
  assert.equal(body.length,27511);
  assert.equal(hash(body),'8304087b15bbbf5f71c22b7f8c916e0a78b1b905');
  index=Buffer.concat([index.subarray(0,at),Buffer.from('<script id="dungeonMj72_2Script">'),body,Buffer.from('</script>'),index.subarray(at+tag.length)]);
  assert.equal(index.length,7863589);
  assert.equal(hash(index),'e5f8895495f969597a6c209fcc29afd66b7a0636','exact D2 historical index');
 }
'''
    replace_one(p,snapshot,before,after)
    return p

def verify():
    target=INDEX.read_bytes()
    body=OUTPUT.read_bytes()
    pin(target,TARGET_BYTES,TARGET_BLOB,"active D3 index")
    pin(body,BODY_BYTES,BODY_BLOB,"external MJ72")
    assert target.count(TAG)==1 and target.count(OPEN)==0,"single MJ72 owner"
    previous=target.replace(TAG,OPEN+body+CLOSE,1)
    pin(previous,SOURCE_BYTES,SOURCE_BLOB,"reconstructed exact D2 index")
    assert derive(previous)==(target,body),"D3 byte round-trip"
    print("D3 verified: source, output, exact D2 rollback, 27511-byte identical MJ72")

def apply():
    source=INDEX.read_bytes()
    new,body=derive(source)
    assert not OUTPUT.exists(),"Target already exists: refusing overwrite/re-run"
    changes=patches()
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_bytes(body)
    INDEX.write_bytes(new)
    for name,content in changes.items():
        (ROOT/name).write_text(content,encoding="utf-8")
    verify()
    print("D3 patches: "+", ".join(sorted(changes)))

if __name__=="__main__":
    cli=argparse.ArgumentParser()
    mode=cli.add_mutually_exclusive_group(required=True)
    mode.add_argument("--apply",action="store_true")
    mode.add_argument("--verify",action="store_true")
    args=cli.parse_args()
    if args.apply: apply()
    else:verify()
