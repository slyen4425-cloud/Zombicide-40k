#!/usr/bin/env python3
"""Phase 12 D4: byte-locked physical extraction of active Dungeon Core200.

Source: user ZIP a4.zip, exactly the tested GitHub D3 index.
No full index transported through GitHub API. This runs only in the D4 Actions checkout.
"""
from pathlib import Path
import argparse
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OUT=ROOT/"assets/gensrpg/dungeon/core200-rebuild-v1.js"
SRC_LEN=7836124
SRC_SHA="972f0e0be12fac14427853fbcd7abe5233eb5a8c"
DST_LEN=7780333
DST_SHA="ca15dd7b483963d7bd0767b7b5baca915d17ec43"
BODY_LEN=55842
BODY_SHA="5649ae0af69064dde72e6ea28b8dbefd105cb527"
OPEN=b'<script id="dungeonCore200Rebuild">'
CLOSE=b'</script>'
TAG=b'<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>'

def blob(v):
    return hashlib.sha1(b"blob "+str(len(v)).encode()+b"\0"+v).hexdigest()

def pinned(v,n,digest,where):
    assert len(v)==n and blob(v)==digest, f"{where}: {len(v)} {blob(v)} expected {n} {digest}"

def derive(source):
    pinned(source,SRC_LEN,SRC_SHA,"certified D3 source")
    assert source.count(OPEN)==1 and TAG not in source,"one inline Core200 at entry"
    a=source.index(OPEN)
    end=source.index(CLOSE,a+len(OPEN))
    body=source[a+len(OPEN):end]
    pinned(body,BODY_LEN,BODY_SHA,"byte-identical Core200 body")
    target=source[:a]+TAG+source[end+len(CLOSE):]
    pinned(target,DST_LEN,DST_SHA,"D4 physical index")
    assert target.count(TAG)==1 and OPEN not in target
    return target,body

def change_once(patches,path,before,after):
    old=patches.get(path)
    if old is None: old=(ROOT/path).read_text(encoding="utf-8")
    assert old.count(before)==1, f"{path}: need unique preimage count 1, got {old.count(before)} {before[:85]!r}"
    patches[path]=old.replace(before,after,1)

def make_patches():
    p={}
    newpath="assets/gensrpg/dungeon/core200-rebuild-v1.js"
    graph="tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
    composition="tests/gens_runtime_composition_guard_v11411.test.cjs"
    manifesttest="tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs"
    inventory="tests/gens_phase2_runtime_side_effect_inventory_v11411.test.cjs"
    unreachable="tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs"
    old="  'assets/gensrpg/dungeon/core051-exploration-polish-v1.js',\n  'assets/dungeon/dungeon-core-316.js',\n"
    new=old.replace("  'assets/dungeon/dungeon-core-316.js',",f"  '{newpath}',\n  'assets/dungeon/dungeon-core-316.js',")
    change_once(p,graph,old,new)
    change_once(p,composition,old,new)
    for before,after in [
      ("productionDirect).size,52,","productionDirect).size,53,"),
      ("allJs.length,110,","allJs.length,111,"),
      ("phase2Js.length,74,","phase2Js.length,75,"),
      ("reachable.size,96,","reachable.size,97,")
    ]:change_once(p,graph,before,after)
    for path in (manifesttest,inventory,unreachable):
        change_once(p,path,"reachable.size,96,","reachable.size,97,")
    change_once(p,manifesttest,"mapped.size,96,","mapped.size,97,")
    for path,var in (
        ("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","CURRENT_BLOB"),
        ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","CURRENT_INDEX_BLOB")
    ):
        change_once(p,path,var+"='"+SRC_SHA+"'",var+"='"+DST_SHA+"'")

    ownpath="docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    obj=json.loads((ROOT/ownpath).read_text(encoding="utf-8"))
    assert len(obj["files"])==96 and newpath not in obj["files"]
    obj["files"][newpath]={
      "owner":"Dungeon Core200 Rebuild Runtime",
      "domain":"dungeon",
      "role":"byte-identical 55842-byte former dungeonCore200Rebuild active IIFE; synchronous Dungeon rebuild, interaction and start ownership in original parser order"
    }
    obj["files"]=dict(sorted(obj["files"].items()))
    assert len(obj["files"])==97
    p[ownpath]=json.dumps(obj,ensure_ascii=False,indent=2)+"\n"

    # For each historical live D3/D2/D1 test, rebuild D3 exactly in-memory
    # first. Never rewrite their immutable historical baselines.
    d4prefix='''const actualD4=read("index.html");
const core200Tag=Buffer.from('<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>');
const core200Open=Buffer.from('<script id="dungeonCore200Rebuild">');
const core200Body=read("assets/gensrpg/dungeon/core200-rebuild-v1.js");
const core200At=actualD4.indexOf(core200Tag);
assert.ok(core200At>0 && actualD4.indexOf(core200Tag,core200At+core200Tag.length)<0,"D4 owner appears exactly once");
const indexBeforeD4=Buffer.concat([
  actualD4.subarray(0,core200At),core200Open,core200Body,Buffer.from("</script>"),
  actualD4.subarray(core200At+core200Tag.length)
]);
assert.equal(indexBeforeD4.length,7836124);
assert.equal(sha(indexBeforeD4),"972f0e0be12fac14427853fbcd7abe5233eb5a8c");
'''
    change_once(p,"tests/gens_phase12_dungeon_mj72_extraction_v1.test.cjs",
        'const index=read("index.html");',
        d4prefix+'const index=indexBeforeD4;')
    for path in (
        "tests/gens_phase12_dungeon_core051_extraction_v1.test.cjs",
        "tests/gens_phase12_dungeon_core01_extraction_v1.test.cjs",
    ):
        change_once(p,path,'const currentIndex=read("index.html");',d4prefix+'const currentIndex=indexBeforeD4;')

    # Existing D3/D2/D1 verifiers are still independently enforced: each
    # reconstructs only the newer physical D4 code before its own logic.
    pyrollback='''    d4tag=b'<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>'
    if d4tag in target:
        assert target.count(d4tag)==1, "D4 owner loaded once"
        d4=(ROOT/"assets/gensrpg/dungeon/core200-rebuild-v1.js").read_bytes()
        assert len(target)==7780333 and blob(target)=="ca15dd7b483963d7bd0767b7b5baca915d17ec43", "D4 index drifted"
        assert len(d4)==55842 and blob(d4)=="5649ae0af69064dde72e6ea28b8dbefd105cb527", "D4 code drifted"
        target=target.replace(d4tag,b'<script id="dungeonCore200Rebuild">'+d4+b'</script>',1)
'''
    d3tool="tools/gensrpg_phase12_dungeon_mj72_extract_apply.py"
    change_once(p,d3tool,'    target=INDEX.read_bytes()\n    body=OUTPUT.read_bytes()', '    target=INDEX.read_bytes()\n'+pyrollback.replace('blob(target)','sha(target)').replace('blob(d4)','sha(d4)')+'    body=OUTPUT.read_bytes()')
    d2tool="tools/gensrpg_phase12_dungeon_core051_extract_apply.py"
    pyrollback2=pyrollback.replace('blob(target)','sha(target)').replace('blob(d4)','sha(d4)').replace('    d4tag','    d4tag')
    change_once(p,d2tool,'    new=INDEX.read_bytes()\n    d3tag=', '    target=INDEX.read_bytes()\n'+pyrollback2+'    new=target\n    d3tag=')
    d1tool="tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
    change_once(p,d1tool,'    target=INDEX.read_bytes()\n    d3_external=', '    target=INDEX.read_bytes()\n'+pyrollback+'    d3_external=')
    # D1 graph sentinels must still reflect real third and now fourth external
    # owners. No removed assertion or loosened count.
    old='''                    if d3_external in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,51,","size,52,"),
                            ("allJs.length,109,","allJs.length,110,"),
                            ("phase2Js.length,73,","phase2Js.length,74,"),
                            ("reachable.size,95,","reachable.size,96,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    new=old+'''
                    if d4tag in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,52,","size,53,"),
                            ("allJs.length,110,","allJs.length,111,"),
                            ("phase2Js.length,74,","phase2Js.length,75,"),
                            ("reachable.size,96,","reachable.size,97,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    change_once(p,d1tool,old,new)
    change_once(p,d1tool,
        '''expected_after=("972f0e0be12fac14427853fbcd7abe5233eb5a8c"
                                    if d3_external in INDEX.read_bytes()
                                    else "e5f8895495f969597a6c209fcc29afd66b7a0636")''',
        '''expected_after=("ca15dd7b483963d7bd0767b7b5baca915d17ec43" if d4tag in INDEX.read_bytes()
                                    else "972f0e0be12fac14427853fbcd7abe5233eb5a8c"
                                    if d3_external in INDEX.read_bytes()
                                    else "e5f8895495f969597a6c209fcc29afd66b7a0636")''')

    # Read-only historical Capture snapshot: prepend D4 rollback in-memory.
    snapshot="tests/helpers/gens_capture_team_roster_snapshot_v1.cjs"
    old="function restoreHistoricalHubSnapshot(index,root){\n"
    new='''function restoreHistoricalHubSnapshot(index,root){
 // Phase12 D4: exact test-only reconstruction, no runtime fallback.
 if(hash(index)==='ca15dd7b483963d7bd0767b7b5baca915d17ec43'){
  assert.equal(index.length,7780333,'D4 extracted index length');
  const tag=Buffer.from('<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>');
  const at=index.indexOf(tag);
  assert.ok(at>0 && index.indexOf(tag,at+tag.length)<0,'single D4 Core200 owner');
  const code=fs.readFileSync(path.join(root,'assets/gensrpg/dungeon/core200-rebuild-v1.js'));
  assert.equal(code.length,55842);
  assert.equal(hash(code),'5649ae0af69064dde72e6ea28b8dbefd105cb527');
  index=Buffer.concat([index.subarray(0,at),Buffer.from('<script id="dungeonCore200Rebuild">'),code,Buffer.from('</script>'),index.subarray(at+tag.length)]);
  assert.equal(index.length,7836124);
  assert.equal(hash(index),'972f0e0be12fac14427853fbcd7abe5233eb5a8c','exact D3 index snapshot');
 }
'''
    change_once(p,snapshot,old,new)
    return p

def verify():
    new=INDEX.read_bytes()
    runtime=OUT.read_bytes()
    pinned(new,DST_LEN,DST_SHA,"physical index D4")
    pinned(runtime,BODY_LEN,BODY_SHA,"moved Core200")
    assert new.count(TAG)==1 and new.count(OPEN)==0,"one external owner, inline removed"
    original=new.replace(TAG,OPEN+runtime+CLOSE,1)
    pinned(original,SRC_LEN,SRC_SHA,"exact D3 reconstructed index")
    assert derive(original)==(new,runtime),"byte-for-byte reversible"
    print("D4 verified: 55842-byte Core200 moved byte-exact; exact D3 reconstruction")

def apply():
    current=INDEX.read_bytes()
    new,body=derive(current)
    assert not OUT.exists(),"D4 target exists, cannot apply twice"
    changes=make_patches()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(body)
    INDEX.write_bytes(new)
    for path,content in changes.items():(ROOT/path).write_text(content,encoding="utf-8")
    verify()
    print("D4 updated tests/docs: "+", ".join(sorted(changes)))

if __name__=="__main__":
    cli=argparse.ArgumentParser()
    sub=cli.add_mutually_exclusive_group(required=True)
    sub.add_argument("--apply",action="store_true")
    sub.add_argument("--verify",action="store_true")
    args=cli.parse_args()
    if args.apply:apply()
    else:verify()
