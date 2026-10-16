#!/usr/bin/env python3
"""Phase 12 D6: byte-certified relocation of active Dungeon Core213.
User ZIP b3.zip exactly matches the triple-GREEN D5 checkout. GitHub Actions
is the only writer of the large index; this script has no runtime fallback.
"""
from pathlib import Path
from gensrpg_phase12_r01_d9_source_view import read_d9_index_view
import argparse
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OUT=ROOT/"assets/gensrpg/dungeon/core213-stability-v1.js"
SRC_LEN=7762879
SRC_SHA="2ad1961efb9733037b7753ffd4a308baa1b00b64"
DST_LEN=7745413
DST_SHA="b5271e44dc4c14834a7725a869fb3c12386f2437"
BODY_LEN=17519
BODY_SHA="af4bf724315180becd80833af251504130751ad3"
OPEN=b'<script id="dungeonCore213Stability">'
CLOSE=b'</script>'
TAG=b'<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>'

def gitblob(v):
    return hashlib.sha1(b"blob "+str(len(v)).encode()+b"\0"+v).hexdigest()
def pin(v,n,sha,label):
    assert len(v)==n and gitblob(v)==sha, f"{label}: {len(v)} {gitblob(v)} expected {n} {sha}"
def derive(v):
    pin(v,SRC_LEN,SRC_SHA,"§26 source")
    assert v.count(OPEN)==1 and v.count(TAG)==0,"one active inline Dungeon Core213"
    a=v.index(OPEN)
    z=v.index(CLOSE,a+len(OPEN))
    js=v[a+len(OPEN):z]
    pin(js,BODY_LEN,BODY_SHA,"original Core213 script")
    out=v[:a]+TAG+v[z+len(CLOSE):]
    pin(out,DST_LEN,DST_SHA,"D6 index")
    return out,js
def one(p,path,before,after):
    original=p.get(path)
    if original is None: original=(ROOT/path).read_text(encoding="utf-8")
    assert original.count(before)==1,f"{path}: expected one exact anchor got {original.count(before)} {before[:85]!r}"
    p[path]=original.replace(before,after,1)
def patches():
    p={}
    rel="assets/gensrpg/dungeon/core213-stability-v1.js"
    graph="tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
    composition="tests/gens_runtime_composition_guard_v11411.test.cjs"
    runtime="tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs"
    other=("tests/gens_phase2_runtime_side_effect_inventory_v11411.test.cjs","tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs")
    anchor="  'assets/gensrpg/dungeon/core211-consolidation-v1.js',\n  'assets/dungeon/dungeon-core-316.js',\n"
    replace=anchor.replace("  'assets/dungeon/dungeon-core-316.js',",f"  '{rel}',\n  'assets/dungeon/dungeon-core-316.js',")
    one(p,graph,anchor,replace)
    one(p,composition,anchor,replace)
    for a,b in (("productionDirect).size,54,","productionDirect).size,55,"),
                ("allJs.length,112,","allJs.length,113,"),
                ("phase2Js.length,76,","phase2Js.length,77,"),
                ("reachable.size,98,","reachable.size,99,")):
        one(p,graph,a,b)
    for path in (runtime,)+other:one(p,path,"reachable.size,98,","reachable.size,99,")
    one(p,runtime,"mapped.size,98,","mapped.size,99,")
    for path,key in (
      ("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","CURRENT_BLOB"),
      ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","CURRENT_INDEX_BLOB")
    ):one(p,path,key+"='"+SRC_SHA+"'",key+"='"+DST_SHA+"'")
    owner="docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    m=json.loads((ROOT/owner).read_text(encoding="utf-8"))
    assert len(m["files"])==98 and rel not in m["files"]
    m["files"][rel]={
      "owner":"Dungeon Core213 Stability",
      "domain":"dungeon",
      "role":"byte-identical 17519-byte former active dungeonCore213Stability IIFE; synchronous Dungeon combat, chests, pieces and puzzles stability at original parser position"
    }
    m["files"]=dict(sorted(m["files"].items()))
    assert len(m["files"])==99
    p[owner]=json.dumps(m,ensure_ascii=False,indent=2)+"\n"

    # Earlier tests get the exact D5 original in-memory; never weaken immutable
    # byte checks for D5→D4→D3→D2→D1.
    prefix='''const d6Index=read("index.html");
const core213Tag=Buffer.from('<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>');
const core213Open=Buffer.from('<script id="dungeonCore213Stability">');
const core213Body=read("assets/gensrpg/dungeon/core213-stability-v1.js");
const core213At=d6Index.indexOf(core213Tag);
assert.ok(core213At>0 && d6Index.indexOf(core213Tag,core213At+core213Tag.length)<0,"D6 owner once");
const indexBeforeD6=Buffer.concat([
  d6Index.subarray(0,core213At),core213Open,core213Body,Buffer.from("</script>"),
  d6Index.subarray(core213At+core213Tag.length)
]);
assert.equal(indexBeforeD6.length,7762879);
assert.equal(sha(indexBeforeD6),"2ad1961efb9733037b7753ffd4a308baa1b00b64");
'''
    d5test="tests/gens_phase12_dungeon_core211_extraction_v1.test.cjs"
    one(p,d5test,'const page=read("index.html"),js=read("assets/gensrpg/dungeon/core211-consolidation-v1.js");',
        prefix+'const page=indexBeforeD6,js=read("assets/gensrpg/dungeon/core211-consolidation-v1.js");')
    for path in (
        "tests/gens_phase12_dungeon_core200_extraction_v1.test.cjs",
        "tests/gens_phase12_dungeon_mj72_extraction_v1.test.cjs",
        "tests/gens_phase12_dungeon_core051_extraction_v1.test.cjs",
        "tests/gens_phase12_dungeon_core01_extraction_v1.test.cjs"
    ):one(p,path,'const d5Index=read("index.html");',prefix+'const d5Index=indexBeforeD6;')

    pyrollback='''    d6tag=b'<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>'
    if d6tag in target:
        assert target.count(d6tag)==1, "D6 owner only once"
        d6=(ROOT/"assets/gensrpg/dungeon/core213-stability-v1.js").read_bytes()
        assert len(target)==7745413 and HASH(target)=="b5271e44dc4c14834a7725a869fb3c12386f2437", "D6 index drifted"
        assert len(d6)==17519 and HASH(d6)=="af4bf724315180becd80833af251504130751ad3", "D6 code drifted"
        target=target.replace(d6tag,b'<script id="dungeonCore213Stability">'+d6+b'</script>',1)
'''
    tool_patches=[
      ("tools/gensrpg_phase12_dungeon_core211_extract_apply.py","    index=INDEX.read_bytes()\n    js=OUT.read_bytes()","    target=INDEX.read_bytes()\n"+pyrollback.replace("HASH","blob")+"    index=target\n    js=OUT.read_bytes()","blob"),
      ("tools/gensrpg_phase12_dungeon_core200_extract_apply.py","    target=INDEX.read_bytes()\n    d5tag=","    target=INDEX.read_bytes()\n"+pyrollback.replace("HASH","blob")+"    d5tag=","blob"),
      ("tools/gensrpg_phase12_dungeon_mj72_extract_apply.py","    target=INDEX.read_bytes()\n    d5tag=","    target=INDEX.read_bytes()\n"+pyrollback.replace("HASH","sha")+"    d5tag=","sha"),
      ("tools/gensrpg_phase12_dungeon_core051_extract_apply.py","    target=INDEX.read_bytes()\n    d5tag=","    target=INDEX.read_bytes()\n"+pyrollback.replace("HASH","sha")+"    d5tag=","sha"),
      ("tools/gensrpg_phase12_dungeon_core01_extract_apply.py","    target=INDEX.read_bytes()\n    d5tag=","    target=INDEX.read_bytes()\n"+pyrollback.replace("HASH","blob")+"    d5tag=","blob"),
    ]
    for path,before,after,_ in tool_patches:one(p,path,before,after)
    # D1 original index and strict inventory regression retain exact proofs,
    # adjusted to the physically active sixth Dungeon script.
    d1="tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
    one(p,d1,
      '''expected_after=("2ad1961efb9733037b7753ffd4a308baa1b00b64" if d5tag in INDEX.read_bytes()''',
      '''expected_after=("b5271e44dc4c14834a7725a869fb3c12386f2437" if d6tag in INDEX.read_bytes()
                                    else "2ad1961efb9733037b7753ffd4a308baa1b00b64" if d5tag in INDEX.read_bytes()''')
    old='''                    if d5tag in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,53,","size,54,"),
                            ("allJs.length,111,","allJs.length,112,"),
                            ("phase2Js.length,75,","phase2Js.length,76,"),
                            ("reachable.size,97,","reachable.size,98,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    plus=old+'''
                    if d6tag in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,54,","size,55,"),
                            ("allJs.length,112,","allJs.length,113,"),
                            ("phase2Js.length,76,","phase2Js.length,77,"),
                            ("reachable.size,98,","reachable.size,99,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    one(p,d1,old,plus)
    # Immutable historical Capture fixture reconstruction is read-only.
    snapshot="tests/helpers/gens_capture_team_roster_snapshot_v1.cjs"
    before="function restoreHistoricalHubSnapshot(index,root){\n"
    after='''function restoreHistoricalHubSnapshot(index,root){
 // D6: restore ONLY the unchanged Core213 IIFE in a test-only old fixture.
 if(hash(index)==='b5271e44dc4c14834a7725a869fb3c12386f2437'){
  assert.equal(index.length,7745413,'D6 index length');
  const tag=Buffer.from('<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>');
  const at=index.indexOf(tag);
  assert.ok(at>0 && index.indexOf(tag,at+tag.length)<0,'D6 exactly one owner');
  const code=fs.readFileSync(path.join(root,'assets/gensrpg/dungeon/core213-stability-v1.js'));
  assert.equal(code.length,17519);
  assert.equal(hash(code),'af4bf724315180becd80833af251504130751ad3');
  index=Buffer.concat([index.subarray(0,at),Buffer.from('<script id="dungeonCore213Stability">'),code,Buffer.from('</script>'),index.subarray(at+tag.length)]);
  assert.equal(index.length,7762879);
  assert.equal(hash(index),'2ad1961efb9733037b7753ffd4a308baa1b00b64','D5 historical index unchanged');
 }
'''
    one(p,snapshot,before,after)

    # The architecture scan already explicitly protects all new external files.
    # Core213's SINGLE original stopImmediatePropagation is protected by its
    # exact Git blob: no open-ended file or domain exception.
    guard="tests/gens_architecture_global_side_effect_guard.test.cjs"
    old="const DUNGEON_CORE200='assets/gensrpg/dungeon/core200-rebuild-v1.js';"
    replacement=old+'''
const DUNGEON_CORE213='assets/gensrpg/dungeon/core213-stability-v1.js';
const core213=fs.readFileSync(path.join(__dirname,'..',DUNGEON_CORE213));
const core213Blob=crypto.createHash('sha1').update(Buffer.from('blob '+core213.length+'\\0')).update(core213).digest('hex');
assert.equal(core213.length,17519,'D6 moved Core213 exact byte length');
assert.equal(core213Blob,'af4bf724315180becd80833af251504130751ad3','D6 Core213 must remain exactly original inline bytes');
assert.equal((core213.toString().match(/\\.stopImmediatePropagation\\s*\\(/g)||[]).length,1,'D6 historic Core213 had one propagation hard-stop');
'''
    one(p,guard,old,replacement)
    one(p,guard,
      "  [DUNGEON_CORE200,new Set(['event propagation hard-stop','protected Dungeon combat global replacement'])]",
      "  [DUNGEON_CORE200,new Set(['event propagation hard-stop','protected Dungeon combat global replacement'])],\n  [DUNGEON_CORE213,new Set(['event propagation hard-stop'])]")
    one(p,guard,
      "assert.deepEqual([...explicitRuleExceptions.keys()],[RUNTIME_BOOTSTRAP,TACTICAL_ENTRY,DUNGEON_CORE200],",
      "assert.deepEqual([...explicitRuleExceptions.keys()],[RUNTIME_BOOTSTRAP,TACTICAL_ENTRY,DUNGEON_CORE200,DUNGEON_CORE213],")
    return p

def verify():
    live=read_d9_index_view(INDEX,ROOT)
    d9tag=b'<script id="dungeonCore202ContentDensity" src="assets/gensrpg/dungeon/core202-content-density-v1.js"></script>'
    if d9tag in live:
        assert live.count(d9tag)==1, "D9 owner once"
        assert len(live)==7703979 and gitblob(live)=="fce949665fea47a2aa2a535ede7289b06936f986", "D9 index drift"
        d9=(ROOT/"assets/gensrpg/dungeon/core202-content-density-v1.js").read_bytes()
        assert len(d9)==11821 and gitblob(d9)=="364673f3dd35bfa8be7f378152f775656c9243e2", "D9 body drift"
        live=live.replace(d9tag,b'<script id="dungeonCore202ContentDensity">'+d9+b'</script>',1)
        assert len(live)==7715741 and gitblob(live)=="f56dc5bbb368b176509ab16477bd4b24dd000497", "restored D8 exact"
    target=live
    d8tag=b'<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>'
    if d8tag in target:
        assert target.count(d8tag)==1, "D8 owner once"
        assert len(target)==7715741 and gitblob(target)=="f56dc5bbb368b176509ab16477bd4b24dd000497", "D8 index drift"
        d8=(ROOT/"assets/gensrpg/dungeon/core201-stability-v1.js").read_bytes()
        assert len(d8)==13990 and gitblob(d8)=="7edf731fd1aa209ec96490fb8e2cb7af04afd627", "D8 body drift"
        target=target.replace(d8tag,b'<script id="dungeonCore201Stability">'+d8+b'</script>',1)
        assert len(target)==7729678 and gitblob(target)=="6e1cb9b82126409b633306b0e77a7e45badb0f79", "D7 restored drift"
    live=target
    target=live
    d7tag=b'<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>'
    if d7tag in target:
        assert target.count(d7tag)==1, "D7 owner once"
        assert len(target)==7729678 and gitblob(target)=="6e1cb9b82126409b633306b0e77a7e45badb0f79", "D7 index drift"
        d7=(ROOT/"assets/gensrpg/dungeon/core214-single-authority-v1.js").read_bytes()
        assert len(d7)==15795 and gitblob(d7)=="72481ac3ee62bc67f6c0646eb724baf4a87a2f88", "D7 body drift"
        target=target.replace(d7tag,b'<script id="dungeonCore214SingleAuthority">'+d7+b'</script>',1)
        assert len(target)==7745413 and gitblob(target)=="b5271e44dc4c14834a7725a869fb3c12386f2437", "restored D6 drift"
    live=target
    code=OUT.read_bytes()
    pin(live,DST_LEN,DST_SHA,"D6 current index")
    pin(code,BODY_LEN,BODY_SHA,"D6 Core213 external JS")
    assert live.count(TAG)==1 and OPEN not in live,"only one classic external Core213 owner"
    restored=live.replace(TAG,OPEN+code+CLOSE,1)
    pin(restored,SRC_LEN,SRC_SHA,"D5 exact rollback")
    assert derive(restored)==(live,code)
    print("D6 verified: exact 17519-byte Dungeon Core213, D5 restored bitwise")

def apply():
    old=INDEX.read_bytes()
    new,code=derive(old)
    assert not OUT.exists(),"No duplicate owner files"
    updates=patches()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(code)
    INDEX.write_bytes(new)
    for path,txt in updates.items():
        (ROOT/path).write_text(txt,encoding="utf8")
    verify()
    print("D6 changed tests: "+", ".join(sorted(updates)))

if __name__=="__main__":
    cli=argparse.ArgumentParser()
    mode=cli.add_mutually_exclusive_group(required=True)
    mode.add_argument("--apply",action="store_true")
    mode.add_argument("--verify",action="store_true")
    args=cli.parse_args()
    apply() if args.apply else verify()
