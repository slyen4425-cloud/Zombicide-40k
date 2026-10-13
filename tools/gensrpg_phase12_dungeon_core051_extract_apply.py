#!/usr/bin/env python3
"""Phase 12 / D2: byte-exact physical extraction of Dungeon Core051.

§26: the owner supplied a ZIP byte-verified against HEAD index.html:
7,911,489 bytes, Git blob 2921ebadacf6f660e815d9ff7712e44cd765fbdd.
The GitHub workflow is the only writer of the large index on the D2 branch.
"""
from pathlib import Path
import argparse
import hashlib

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OUT=ROOT/"assets/gensrpg/dungeon/core051-exploration-polish-v1.js"
SRC_LEN=7911489
SRC_SHA="2921ebadacf6f660e815d9ff7712e44cd765fbdd"
DST_LEN=7863589
DST_SHA="e5f8895495f969597a6c209fcc29afd66b7a0636"
JS_LEN=47962
JS_SHA="d7ec321ffa05b8749de5d7bf9e8264e55b24f919"
OPEN=b'<script id="dungeonCore051ExplorationPolish">'
CLOSE=b'</script>'
EXTERNAL=b'<script id="dungeonCore051ExplorationPolish" src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"></script>'

def sha(b):
    return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()

def pinned(b,n,s,where):
    assert len(b)==n and sha(b)==s, f"{where} drifted: {len(b)}, {sha(b)}; expected {n}, {s}"

def derive(old):
    pinned(old,SRC_LEN,SRC_SHA,"certified source index")
    assert old.count(OPEN)==1 and old.count(EXTERNAL)==0,"Core051 must be a single inline owner at entry"
    start=old.index(OPEN)
    end=old.find(CLOSE,start+len(OPEN))
    assert end>start,"Core051 end tag absent"
    body=old[start+len(OPEN):end]
    pinned(body,JS_LEN,JS_SHA,"exact Core051 body")
    new=old[:start]+EXTERNAL+old[end+len(CLOSE):]
    pinned(new,DST_LEN,DST_SHA,"new index")
    assert new.count(EXTERNAL)==1 and new.count(OPEN)==0
    return new,body

def single(path,before,after,patches):
    original=patches.get(path)
    if original is None: original=(ROOT/path).read_text(encoding="utf8")
    assert original.count(before)==1, f"{path}: expected exactly one preimage {repr(before[:90])}, got {original.count(before)}"
    patches[path]=original.replace(before,after,1)

def make_patches():
    patches={}
    newpath="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"
    graph="tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
    composition="tests/gens_runtime_composition_guard_v11411.test.cjs"
    anchor_graph="  'assets/gensrpg/dungeon/core01-session-ui-v1.js',\n  'assets/gensrpg/core/progression-v1.js',\n"
    anchor_composition="  'assets/gensrpg/dungeon/core01-session-ui-v1.js',\n  'assets/gensrpg/core/progression-v1.js?v=1',\n"
    single(graph,anchor_graph,anchor_graph+f"  '{newpath}',\n",patches)
    single(composition,anchor_composition,anchor_composition+f"  '{newpath}',\n",patches)
    for old,new in [
      ("productionDirect).size,50,","productionDirect).size,51,"),
      ("allJs.length,108,","allJs.length,109,"),
      ("phase2Js.length,72,","phase2Js.length,73,"),
      ("reachable.size,94,","reachable.size,95,")
    ]: single(graph,old,new,patches)
    single("tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs",
      "reachable.size,94,", "reachable.size,95,",patches)
    for path,key in [
      ("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","CURRENT_BLOB"),
      ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","CURRENT_INDEX_BLOB")
    ]:
      single(path,key+"='"+SRC_SHA+"'",key+"='"+DST_SHA+"'",patches)

    # Protect prior D1 proof: recreate its exact physical index from the D2 owner
    # before asserting original D1 bytes and its original pre-D1 reversible rollback.
    d1test="tests/gens_phase12_dungeon_core01_extraction_v1.test.cjs"
    before='const index=read("index.html");'
    after='''const liveIndex=read("index.html");
const core051External=Buffer.from('<script id="dungeonCore051ExplorationPolish" src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"></script>');
const core051Open=Buffer.from('<script id="dungeonCore051ExplorationPolish">');
const core051Body=read("assets/gensrpg/dungeon/core051-exploration-polish-v1.js");
const core051Position=liveIndex.indexOf(core051External);
assert.ok(core051Position>0,"D2 external Core051 script must stay at its original parser position");
const index=Buffer.concat([
  liveIndex.subarray(0,core051Position),core051Open,core051Body,Buffer.from("</script>"),
  liveIndex.subarray(core051Position+core051External.length)
]);'''
    single(d1test,before,after,patches)

    d1tool="tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
    before='''def verify():
    target=INDEX.read_bytes()
    runtime=OUTPUT.read_bytes()'''
    after='''def verify():
    # D2 is an independent downstream physical extraction. Undo only its
    # verified external tag in memory to inspect the immutable D1 state.
    target=INDEX.read_bytes()
    d2_external=b'<script id="dungeonCore051ExplorationPolish" src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"></script>'
    if d2_external in target:
        assert target.count(d2_external)==1, "D2 owner must load once"
        d2=(ROOT/"assets/gensrpg/dungeon/core051-exploration-polish-v1.js").read_bytes()
        assert len(d2)==47962 and blob(d2)=="d7ec321ffa05b8749de5d7bf9e8264e55b24f919", "D2 external owner drifted"
        assert len(target)==7863589 and blob(target)=="e5f8895495f969597a6c209fcc29afd66b7a0636", "D2 physical index drifted"
        target=target.replace(d2_external,b'<script id="dungeonCore051ExplorationPolish">'+d2+b'</script>',1)
    runtime=OUTPUT.read_bytes()'''
    single(d1tool,before,after,patches)
    # D1's immutable byte-exact rollback is still required. Its graph and
    # current-index pins naturally advance by one additional physical D2 owner.
    d1_expect='''            assert updated.count(after)==1, f"{path}: expected new owner graph exactly once"'''
    d2_expect='''            expected_after=after
            if d2_external in INDEX.read_bytes():
                if path in (PATH_OWNERS,PATH_GLOBALS):
                    expected_after="e5f8895495f969597a6c209fcc29afd66b7a0636"
                elif path==PATH_GRAPH:
                    for before_count,after_count in [
                        ("size,50,","size,51,"),
                        ("allJs.length,108,","allJs.length,109,"),
                        ("phase2Js.length,72,","phase2Js.length,73,"),
                        ("reachable.size,94,","reachable.size,95,")
                    ]:
                        expected_after=expected_after.replace(before_count,after_count)
            assert updated.count(expected_after)==1, f"{path}: expected owner graph exactly once after D1/D2"'''
    single(d1tool,d1_expect,d2_expect,patches)
    return patches

def verify():
    new=INDEX.read_bytes()
    d3tag=b'<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>'
    if d3tag in new:
        assert new.count(d3tag)==1, "D3 source only once"
        assert len(new)==7836124 and sha(new)=="972f0e0be12fac14427853fbcd7abe5233eb5a8c", "D3 index fingerprint"
        body=(ROOT/"assets/gensrpg/dungeon/mj72-scene-v1.js").read_bytes()
        assert len(body)==27511 and sha(body)=="8304087b15bbbf5f71c22b7f8c916e0a78b1b905", "D3 code fingerprint"
        new=new.replace(d3tag,b'<script id="dungeonMj72_2Script">'+body+b'</script>',1)
    runtime=OUT.read_bytes()
    pinned(new,DST_LEN,DST_SHA,"current physical index")
    pinned(runtime,JS_LEN,JS_SHA,"external Core051")
    assert new.count(EXTERNAL)==1 and new.count(OPEN)==0,"single external Dungeon owner"
    reconstructed=new.replace(EXTERNAL,OPEN+runtime+CLOSE,1)
    pinned(reconstructed,SRC_LEN,SRC_SHA,"reconstructed D1 index")
    assert derive(reconstructed)==(new,runtime),"D2 round-trip must be exact"
    # The older D1 proof remains callable and reconstructs D1 from D2.
    print("D2 verified: exact lossless 47962-byte external Dungeon owner, D1 preserved")

def apply():
    old=INDEX.read_bytes()
    new,runtime=derive(old)
    assert not OUT.exists(),"D2 target already exists; cannot apply twice"
    patches=make_patches()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(runtime)
    INDEX.write_bytes(new)
    for path,content in patches.items():
        (ROOT/path).write_text(content,encoding="utf8")
    verify()
    print("D2 apply: "+", ".join(sorted(patches)))

if __name__=="__main__":
    p=argparse.ArgumentParser()
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument("--apply",action="store_true")
    group.add_argument("--verify",action="store_true")
    args=p.parse_args()
    if args.apply:apply()
    else:verify()
