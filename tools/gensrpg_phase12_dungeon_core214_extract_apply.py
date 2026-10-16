#!/usr/bin/env python3
"""Phase 12 D7: byte-exact controlled Dungeon Core214 physical extraction.
§26 user ZIP b5.zip verified against D6 Git blob; GitHub Actions is the only writer.
No gameplay, install order, or legacy script internals are changed.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OUT=ROOT/"assets/gensrpg/dungeon/core214-single-authority-v1.js"
SRC_LEN=7745413
SRC_SHA="b5271e44dc4c14834a7725a869fb3c12386f2437"
DST_LEN=7729678
DST_SHA="6e1cb9b82126409b633306b0e77a7e45badb0f79"
BODY_LEN=15795
BODY_SHA="72481ac3ee62bc67f6c0646eb724baf4a87a2f88"
OPEN=b'<script id="dungeonCore214SingleAuthority">'
CLOSE=b'</script>'
TAG=b'<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>'
REL="assets/gensrpg/dungeon/core214-single-authority-v1.js"

def sha(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
def pin(data,n,digest,name):
    assert len(data)==n and sha(data)==digest, f"{name}: got {len(data)} {sha(data)}, expected {n} {digest}"
def derive(source):
    pin(source,SRC_LEN,SRC_SHA,"D6 §26 source")
    assert source.count(OPEN)==1 and source.count(TAG)==0,"single Core214 inline owner"
    pos=source.index(OPEN)
    end=source.index(CLOSE,pos+len(OPEN))
    body=source[pos+len(OPEN):end]
    pin(body,BODY_LEN,BODY_SHA,"Core214 original body")
    new=source[:pos]+TAG+source[end+len(CLOSE):]
    pin(new,DST_LEN,DST_SHA,"D7 derived index")
    return new,body
def old_source(new,body):
    assert new.count(TAG)==1 and OPEN not in new
    return new.replace(TAG,OPEN+body+CLOSE,1)
def restore_to_d6(data):
    if TAG in data:
        pin(data,DST_LEN,DST_SHA,"D7 rollback input")
        assert data.count(TAG)==1
        code=OUT.read_bytes()
        pin(code,BODY_LEN,BODY_SHA,"D7 rollback code")
        data=old_source(data,code)
        pin(data,SRC_LEN,SRC_SHA,"restored D6 index")
    return data

def patch_once(p,path,before,after):
    original=p.get(path)
    if original is None: original=(ROOT/path).read_text(encoding="utf-8")
    count=original.count(before)
    assert count==1, f"{path}: expected one anchor, got {count}: {before[:130]!r}"
    p[path]=original.replace(before,after,1)

def patches():
    p={}
    anchor="  'assets/gensrpg/dungeon/core213-stability-v1.js',\n  'assets/dungeon/dungeon-core-316.js',\n"
    new=anchor.replace("  'assets/dungeon/dungeon-core-316.js',",f"  '{REL}',\n  'assets/dungeon/dungeon-core-316.js',")
    for path in ("tests/gens_phase2_runtime_load_graph_v11411.test.cjs",
                 "tests/gens_runtime_composition_guard_v11411.test.cjs"):
        patch_once(p,path,anchor,new)
    graph="tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
    for before,after in (("productionDirect).size,55,","productionDirect).size,56,"),
                         ("allJs.length,113,","allJs.length,114,"),
                         ("phase2Js.length,77,","phase2Js.length,78,"),
                         ("reachable.size,99,","reachable.size,100,")):
        patch_once(p,graph,before,after)
    for path in ("tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs",
                 "tests/gens_phase2_runtime_side_effect_inventory_v11411.test.cjs",
                 "tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs"):
        patch_once(p,path,"reachable.size,99,","reachable.size,100,")
    patch_once(p,"tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs","mapped.size,99,","mapped.size,100,")
    for path,key in (("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","CURRENT_BLOB"),
                     ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","CURRENT_INDEX_BLOB")):
        patch_once(p,path,key+"='"+SRC_SHA+"'",key+"='"+DST_SHA+"'")
    owner="docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    manifest=json.loads((ROOT/owner).read_text(encoding="utf8"))
    assert len(manifest["files"])==99 and REL not in manifest["files"]
    manifest["files"][REL]={
        "owner":"Dungeon Core214 Single Authority",
        "domain":"dungeon",
        "role":"byte-identical 15795-byte active dungeonCore214SingleAuthority IIFE; native Dungeon scene, combat and token single-authority render kept at original parser position"
    }
    manifest["files"]=dict(sorted(manifest["files"].items()))
    assert len(manifest["files"])==100
    p[owner]=json.dumps(manifest,ensure_ascii=False,indent=2)+"\n"

    # Restore D6 bit-for-bit only in memory before historical D6-D1 proofs.
    prefix='''const d7Index=read("index.html");
const core214Tag=Buffer.from('<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>');
const core214Open=Buffer.from('<script id="dungeonCore214SingleAuthority">');
const core214Body=read("assets/gensrpg/dungeon/core214-single-authority-v1.js");
assert.equal(d7Index.length,7729678,"D7 length");
assert.equal(sha(d7Index),"6e1cb9b82126409b633306b0e77a7e45badb0f79","D7 exact blob");
assert.equal(core214Body.length,15795,"D7 body length");
assert.equal(sha(core214Body),"72481ac3ee62bc67f6c0646eb724baf4a87a2f88","D7 exact body");
const core214At=d7Index.indexOf(core214Tag);
assert.ok(core214At>0 && d7Index.indexOf(core214Tag,core214At+core214Tag.length)<0,"D7 exactly one owner");
const indexBeforeD7=Buffer.concat([
  d7Index.subarray(0,core214At),core214Open,core214Body,Buffer.from("</script>"),
  d7Index.subarray(core214At+core214Tag.length)
]);
assert.equal(indexBeforeD7.length,7745413);
assert.equal(sha(indexBeforeD7),"b5271e44dc4c14834a7725a869fb3c12386f2437","D6 historic index");
'''
    d6test="tests/gens_phase12_dungeon_core213_extraction_v1.test.cjs"
    patch_once(p,d6test,
        'const index=read("index.html"),js=read("assets/gensrpg/dungeon/core213-stability-v1.js");',
        prefix+'const index=indexBeforeD7,js=read("assets/gensrpg/dungeon/core213-stability-v1.js");')
    for name in ("core211","core200","mj72","core051","core01"):
        test=("tests/gens_phase12_dungeon_mj72_extraction_v1.test.cjs" if name=="mj72"
              else f"tests/gens_phase12_dungeon_{name}_extraction_v1.test.cjs")
        patch_once(p,test,'const d6Index=read("index.html");',prefix+'const d6Index=indexBeforeD7;')

    # Each old Python verifier gets exactly the D6 byte image, without changing its
    # immutable source hashes, historic logic or the live index on disk.
    rollback='''    d7tag=b'<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>'
    if d7tag in target:
        assert target.count(d7tag)==1, "D7 owner once"
        assert len(target)==7729678 and sha214(target)=="6e1cb9b82126409b633306b0e77a7e45badb0f79", "D7 index drift"
        d7=(ROOT/"assets/gensrpg/dungeon/core214-single-authority-v1.js").read_bytes()
        assert len(d7)==15795 and sha214(d7)=="72481ac3ee62bc67f6c0646eb724baf4a87a2f88", "D7 body drift"
        target=target.replace(d7tag,b'<script id="dungeonCore214SingleAuthority">'+d7+b'</script>',1)
        assert len(target)==7745413 and sha214(target)=="b5271e44dc4c14834a7725a869fb3c12386f2437", "restored D6 drift"
'''
    for name,hash_fn in (("core211","blob"),("core200","blob"),("mj72","sha"),("core051","sha"),("core01","blob")):
        script=f"tools/gensrpg_phase12_dungeon_{name}_extract_apply.py"
        original=(ROOT/script).read_text(encoding="utf8")
        section=original[original.index("def verify():"):]
        assert section.count("    target=INDEX.read_bytes()")>=1
        # Alias historical hash only in the inserted restore block.
        vpos=original.index(chr(10)+"def verify():"+chr(10))
        target_anchor="    target=INDEX.read_bytes()"+chr(10)
        target_pos=original.index(target_anchor,vpos)
        p[script]=(original[:target_pos+len(target_anchor)]
                   +rollback.replace("sha214(",hash_fn+"(")
                   +original[target_pos+len(target_anchor):])
    d6tool="tools/gensrpg_phase12_dungeon_core213_extract_apply.py"
    rollback6=rollback.replace("    d7tag=", "    target=live\n    d7tag=")
    patch_once(p,d6tool,"def verify():\n    live=INDEX.read_bytes()",
        "def verify():\n    live=INDEX.read_bytes()\n"+rollback6.replace("sha214(","gitblob(")+"    live=target")
    # D1 historical graph-equivalence verifier also checks the current,
    # physical index snapshot and the exact new inventory counts.
    d1="tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
    patch_once(p,d1,
        '''expected_after=("b5271e44dc4c14834a7725a869fb3c12386f2437" if d6tag in INDEX.read_bytes()''',
        '''expected_after=("6e1cb9b82126409b633306b0e77a7e45badb0f79" if d7tag in INDEX.read_bytes()
                                    else "b5271e44dc4c14834a7725a869fb3c12386f2437" if d6tag in INDEX.read_bytes()''')
    last='''                            ("reachable.size,98,","reachable.size,99,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    after=last+'''
                    if d7tag in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,55,","size,56,"),
                            ("allJs.length,113,","allJs.length,114,"),
                            ("phase2Js.length,77,","phase2Js.length,78,"),
                            ("reachable.size,99,","reachable.size,100,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    patch_once(p,d1,last,after)
    # Capture historical snapshots are test fixtures. Revert Core214 in memory
    # BEFORE the existing Core213 restoration code, with strict hashes.
    snapshot="tests/helpers/gens_capture_team_roster_snapshot_v1.cjs"
    before="function restoreHistoricalHubSnapshot(index,root){\n"
    addition='''function restoreHistoricalHubSnapshot(index,root){
 if(hash(index)==='6e1cb9b82126409b633306b0e77a7e45badb0f79'){
  assert.equal(index.length,7729678,'D7 exact length');
  const tag=Buffer.from('<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>');
  const at=index.indexOf(tag);
  assert.ok(at>0 && index.indexOf(tag,at+tag.length)<0,'D7 exact owner');
  const body=fs.readFileSync(path.join(root,'assets/gensrpg/dungeon/core214-single-authority-v1.js'));
  assert.equal(body.length,15795);assert.equal(hash(body),'72481ac3ee62bc67f6c0646eb724baf4a87a2f88');
  index=Buffer.concat([index.subarray(0,at),Buffer.from('<script id="dungeonCore214SingleAuthority">'),body,Buffer.from('</script>'),index.subarray(at+tag.length)]);
  assert.equal(index.length,7745413);assert.equal(hash(index),'b5271e44dc4c14834a7725a869fb3c12386f2437','D6 historical index');
 }
'''
    patch_once(p,snapshot,before,addition)
    # New D7 script introduces no pattern forbidden by the global side-effect
    # guard; no exception is created or relaxed.
    return p

def verify():
    live=INDEX.read_bytes()
    d9tag=b'<script id="dungeonCore202ContentDensity" src="assets/gensrpg/dungeon/core202-content-density-v1.js"></script>'
    if d9tag in live:
        assert live.count(d9tag)==1, "D9 owner once"
        assert len(live)==7703979 and sha(live)=="fce949665fea47a2aa2a535ede7289b06936f986", "D9 index drift"
        d9=(ROOT/"assets/gensrpg/dungeon/core202-content-density-v1.js").read_bytes()
        assert len(d9)==11821 and sha(d9)=="364673f3dd35bfa8be7f378152f775656c9243e2", "D9 body drift"
        live=live.replace(d9tag,b'<script id="dungeonCore202ContentDensity">'+d9+b'</script>',1)
        assert len(live)==7715741 and sha(live)=="f56dc5bbb368b176509ab16477bd4b24dd000497", "restored D8 exact"
    target=live
    d8tag=b'<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>'
    if d8tag in target:
        assert target.count(d8tag)==1, "D8 owner once"
        assert len(target)==7715741 and sha(target)=="f56dc5bbb368b176509ab16477bd4b24dd000497", "D8 index drift"
        d8=(ROOT/"assets/gensrpg/dungeon/core201-stability-v1.js").read_bytes()
        assert len(d8)==13990 and sha(d8)=="7edf731fd1aa209ec96490fb8e2cb7af04afd627", "D8 body drift"
        target=target.replace(d8tag,b'<script id="dungeonCore201Stability">'+d8+b'</script>',1)
        assert len(target)==7729678 and sha(target)=="6e1cb9b82126409b633306b0e77a7e45badb0f79", "D7 restored drift"
    live=target
    code=OUT.read_bytes()
    pin(live,DST_LEN,DST_SHA,"D7 live index")
    pin(code,BODY_LEN,BODY_SHA,"D7 external Core214")
    assert live.count(TAG)==1 and OPEN not in live
    old=old_source(live,code)
    pin(old,SRC_LEN,SRC_SHA,"D6 exact restoration")
    assert derive(old)==(live,code)
    print("D7 verified: 15795-byte Core214 moved losslessly; exact D6 rollback")

def apply():
    source=INDEX.read_bytes()
    new,code=derive(source)
    assert not OUT.exists(),"Core214 external file already exists; no double owner"
    modifications=patches()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(code)
    INDEX.write_bytes(new)
    for filename,data in modifications.items():
        (ROOT/filename).write_text(data,encoding="utf-8")
    verify()
    print("D7 updated historical checks:",", ".join(sorted(modifications)))

if __name__=="__main__":
    cli=argparse.ArgumentParser()
    modes=cli.add_mutually_exclusive_group(required=True)
    modes.add_argument("--apply",action="store_true")
    modes.add_argument("--verify",action="store_true")
    args=cli.parse_args()
    apply() if args.apply else verify()
