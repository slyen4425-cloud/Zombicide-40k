#!/usr/bin/env python3
"""Phase 12 D5: certified lossless relocation of active Dungeon Core211.

The owner supplied b1.zip, byte-verified against D4 GREEN:
index.html 7780333 bytes, Git blob ca15dd7b483963d7bd0767b7b5baca915d17ec43.
The Action runner is the only writer of the ~7.8 MB source.
"""
from pathlib import Path
import argparse
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OUT=ROOT/"assets/gensrpg/dungeon/core211-consolidation-v1.js"
SRC_LEN=7780333
SRC_SHA="ca15dd7b483963d7bd0767b7b5baca915d17ec43"
DST_LEN=7762879
DST_SHA="2ad1961efb9733037b7753ffd4a308baa1b00b64"
BODY_LEN=17511
BODY_SHA="bba60d921df20a114b489e17f9222e0c4f310871"
OPEN=b'<script id="dungeonCore211Consolidation">'
CLOSE=b'</script>'
TAG=b'<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>'

def blob(v):
    return hashlib.sha1(b"blob "+str(len(v)).encode()+b"\0"+v).hexdigest()

def pin(v,n,h,where):
    assert len(v)==n and blob(v)==h, f"{where}: got {len(v)} {blob(v)} expected {n} {h}"

def derive(old):
    pin(old,SRC_LEN,SRC_SHA,"certified D4 source index")
    assert old.count(OPEN)==1 and TAG not in old,"D5 legacy owner must occur once inline"
    a=old.index(OPEN)
    end=old.index(CLOSE,a+len(OPEN))
    body=old[a+len(OPEN):end]
    pin(body,BODY_LEN,BODY_SHA,"Core211 source code")
    new=old[:a]+TAG+old[end+len(CLOSE):]
    pin(new,DST_LEN,DST_SHA,"expected D5 physical index")
    assert new.count(TAG)==1 and OPEN not in new
    return new,body

def once(changes,path,before,after):
    old=changes.get(path)
    if old is None: old=(ROOT/path).read_text(encoding="utf8")
    assert old.count(before)==1, f"{path}: expected unique anchor {before[:92]!r}, saw {old.count(before)}"
    changes[path]=old.replace(before,after,1)

def patches():
    p={}
    rel="assets/gensrpg/dungeon/core211-consolidation-v1.js"
    graph="tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
    composition="tests/gens_runtime_composition_guard_v11411.test.cjs"
    runtime="tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs"
    inventory="tests/gens_phase2_runtime_side_effect_inventory_v11411.test.cjs"
    unreachable="tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs"
    anchor="  'assets/gensrpg/dungeon/core200-rebuild-v1.js',\n  'assets/dungeon/dungeon-core-316.js',\n"
    updated=anchor.replace("  'assets/dungeon/dungeon-core-316.js',",f"  '{rel}',\n  'assets/dungeon/dungeon-core-316.js',")
    once(p,graph,anchor,updated)
    once(p,composition,anchor,updated)
    for a,b in [("productionDirect).size,53,","productionDirect).size,54,"),
                ("allJs.length,111,","allJs.length,112,"),
                ("phase2Js.length,75,","phase2Js.length,76,"),
                ("reachable.size,97,","reachable.size,98,")]:
        once(p,graph,a,b)
    for path in (runtime,inventory,unreachable):
        once(p,path,"reachable.size,97,","reachable.size,98,")
    once(p,runtime,"mapped.size,97,","mapped.size,98,")
    for path,key in [
      ("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","CURRENT_BLOB"),
      ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","CURRENT_INDEX_BLOB")
    ]:
        once(p,path,key+"='"+SRC_SHA+"'",key+"='"+DST_SHA+"'")

    path="docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    obj=json.loads((ROOT/path).read_text(encoding="utf8"))
    assert len(obj["files"])==97 and rel not in obj["files"]
    obj["files"][rel]={
      "owner":"Dungeon Core211 Consolidation",
      "domain":"dungeon",
      "role":"byte-identical 17511-byte former active dungeonCore211Consolidation IIFE; classic synchronous Dungeon traps, hero visibility and combat consolidation"
    }
    obj["files"]=dict(sorted(obj["files"].items()))
    assert len(obj["files"])==98
    p[path]=json.dumps(obj,ensure_ascii=False,indent=2)+"\n"

    # Historical tests must all reconstruct the exact D4 source before
    # their own previous immutable D4 -> D3 -> D2 -> D1 roundtrips.
    prefix='''const d5Index=read("index.html");
const core211Tag=Buffer.from('<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>');
const core211Open=Buffer.from('<script id="dungeonCore211Consolidation">');
const core211Body=read("assets/gensrpg/dungeon/core211-consolidation-v1.js");
const core211At=d5Index.indexOf(core211Tag);
assert.ok(core211At>0 && d5Index.indexOf(core211Tag,core211At+core211Tag.length)<0,"D5 owner single classic load");
const indexBeforeD5=Buffer.concat([
 d5Index.subarray(0,core211At),core211Open,core211Body,Buffer.from("</script>"),
 d5Index.subarray(core211At+core211Tag.length)
]);
assert.equal(indexBeforeD5.length,7780333);
assert.equal(sha(indexBeforeD5),"ca15dd7b483963d7bd0767b7b5baca915d17ec43");
'''
    d4test="tests/gens_phase12_dungeon_core200_extraction_v1.test.cjs"
    once(p,d4test,'const page=read("index.html"),code=read("assets/gensrpg/dungeon/core200-rebuild-v1.js");',
         prefix+'const page=indexBeforeD5,code=read("assets/gensrpg/dungeon/core200-rebuild-v1.js");')
    for path in (
        "tests/gens_phase12_dungeon_mj72_extraction_v1.test.cjs",
        "tests/gens_phase12_dungeon_core051_extraction_v1.test.cjs",
        "tests/gens_phase12_dungeon_core01_extraction_v1.test.cjs",
    ):
        once(p,path,'const actualD4=read("index.html");',prefix+'const actualD4=indexBeforeD5;')

    # Insert strict byte-exact D5 -> D4 rollback into prior verifiers.
    py='''    d5tag=b'<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>'
    if d5tag in target:
        assert target.count(d5tag)==1, "D5 owner once"
        d5=(ROOT/"assets/gensrpg/dungeon/core211-consolidation-v1.js").read_bytes()
        assert len(target)==7762879 and blob(target)=="2ad1961efb9733037b7753ffd4a308baa1b00b64", "D5 index drifted"
        assert len(d5)==17511 and blob(d5)=="bba60d921df20a114b489e17f9222e0c4f310871", "D5 external JS drifted"
        target=target.replace(d5tag,b'<script id="dungeonCore211Consolidation">'+d5+b'</script>',1)
'''
    for path,pre,func in (
        ("tools/gensrpg_phase12_dungeon_core200_extract_apply.py","    new=INDEX.read_bytes()\n    runtime=OUT.read_bytes()","blob"),
        ("tools/gensrpg_phase12_dungeon_mj72_extract_apply.py","    target=INDEX.read_bytes()\n    d4tag=","sha"),
        ("tools/gensrpg_phase12_dungeon_core051_extract_apply.py","    target=INDEX.read_bytes()\n    d4tag=","sha"),
        ("tools/gensrpg_phase12_dungeon_core01_extract_apply.py","    target=INDEX.read_bytes()\n    d4tag=","blob")
    ):
        body=py.replace("blob(target)",f"{func}(target)").replace("blob(d5)",f"{func}(d5)")
        if path.endswith("core200_extract_apply.py"):
            new="    target=INDEX.read_bytes()\n"+body+"    new=target\n    runtime=OUT.read_bytes()"
        else:
            new="    target=INDEX.read_bytes()\n"+body+"    d4tag="
        once(p,path,pre,new)

    # Keep the original D1 owner-graph preimage test, now accounting for D5
    # rather than reducing or skipping historical assertions.
    d1tool="tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
    once(p,d1tool,
         '''expected_after=("ca15dd7b483963d7bd0767b7b5baca915d17ec43" if d4tag in INDEX.read_bytes()''',
         '''expected_after=("2ad1961efb9733037b7753ffd4a308baa1b00b64" if d5tag in INDEX.read_bytes()
                                    else "ca15dd7b483963d7bd0767b7b5baca915d17ec43" if d4tag in INDEX.read_bytes()''')
    anchor='''                    if d4tag in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,52,","size,53,"),
                            ("allJs.length,110,","allJs.length,111,"),
                            ("phase2Js.length,74,","phase2Js.length,75,"),
                            ("reachable.size,96,","reachable.size,97,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    extension=anchor+'''
                    if d5tag in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,53,","size,54,"),
                            ("allJs.length,111,","allJs.length,112,"),
                            ("phase2Js.length,75,","phase2Js.length,76,"),
                            ("reachable.size,97,","reachable.size,98,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    once(p,d1tool,anchor,extension)

    # Read-only historical Capture restoration, never a second runtime owner.
    snapshot="tests/helpers/gens_capture_team_roster_snapshot_v1.cjs"
    old="function restoreHistoricalHubSnapshot(index,root){\n"
    new='''function restoreHistoricalHubSnapshot(index,root){
 // D5: undo byte-identical Core211 only to reconstruct an immutable old fixture.
 if(hash(index)==='2ad1961efb9733037b7753ffd4a308baa1b00b64'){
  assert.equal(index.length,7762879,'D5 physical index length');
  const tag=Buffer.from('<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>');
  const at=index.indexOf(tag);
  assert.ok(at>0 && index.indexOf(tag,at+tag.length)<0,'D5 exact single owner');
  const code=fs.readFileSync(path.join(root,'assets/gensrpg/dungeon/core211-consolidation-v1.js'));
  assert.equal(code.length,17511);
  assert.equal(hash(code),'bba60d921df20a114b489e17f9222e0c4f310871');
  index=Buffer.concat([index.subarray(0,at),Buffer.from('<script id="dungeonCore211Consolidation">'),code,Buffer.from('</script>'),index.subarray(at+tag.length)]);
  assert.equal(index.length,7780333);
  assert.equal(hash(index),'ca15dd7b483963d7bd0767b7b5baca915d17ec43','exact D4 restored index');
 }
'''
    once(p,snapshot,old,new)
    return p

def verify():
    target=INDEX.read_bytes()
    d7tag=b'<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>'
    if d7tag in target:
        assert target.count(d7tag)==1, "D7 owner once"
        assert len(target)==7729678 and blob(target)=="6e1cb9b82126409b633306b0e77a7e45badb0f79", "D7 index drift"
        d7=(ROOT/"assets/gensrpg/dungeon/core214-single-authority-v1.js").read_bytes()
        assert len(d7)==15795 and blob(d7)=="72481ac3ee62bc67f6c0646eb724baf4a87a2f88", "D7 body drift"
        target=target.replace(d7tag,b'<script id="dungeonCore214SingleAuthority">'+d7+b'</script>',1)
        assert len(target)==7745413 and blob(target)=="b5271e44dc4c14834a7725a869fb3c12386f2437", "restored D6 drift"
    d6tag=b'<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>'
    if d6tag in target:
        assert target.count(d6tag)==1, "D6 owner only once"
        d6=(ROOT/"assets/gensrpg/dungeon/core213-stability-v1.js").read_bytes()
        assert len(target)==7745413 and blob(target)=="b5271e44dc4c14834a7725a869fb3c12386f2437", "D6 index drifted"
        assert len(d6)==17519 and blob(d6)=="af4bf724315180becd80833af251504130751ad3", "D6 code drifted"
        target=target.replace(d6tag,b'<script id="dungeonCore213Stability">'+d6+b'</script>',1)
    index=target
    js=OUT.read_bytes()
    pin(index,DST_LEN,DST_SHA,"D5 live index")
    pin(js,BODY_LEN,BODY_SHA,"D5 external Dungeon Core211")
    assert index.count(TAG)==1 and OPEN not in index,"single external Dungeon owner"
    previous=index.replace(TAG,OPEN+js+CLOSE,1)
    pin(previous,SRC_LEN,SRC_SHA,"reconstructed D4 source")
    assert derive(previous)==(index,js),"D5 full byte-exact rollback"
    print("D5 VERIFIED: exact 17511-byte Dungeon owner, D4 source reconstructed")

def apply():
    old=INDEX.read_bytes()
    new,code=derive(old)
    assert not OUT.exists(),"D5 target already present, refusing double extraction"
    changes=patches()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(code)
    INDEX.write_bytes(new)
    for path,content in changes.items():
        (ROOT/path).write_text(content,encoding="utf8")
    verify()
    print("D5 updated test proofs: "+", ".join(sorted(changes)))

if __name__=="__main__":
    cli=argparse.ArgumentParser()
    mode=cli.add_mutually_exclusive_group(required=True)
    mode.add_argument("--apply",action="store_true")
    mode.add_argument("--verify",action="store_true")
    args=cli.parse_args()
    if args.apply:apply()
    else:verify()
