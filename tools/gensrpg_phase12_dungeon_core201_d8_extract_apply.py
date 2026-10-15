#!/usr/bin/env python3
"""Phase12 D8 Core201: byte-certified relocation, GitHub Actions only writer.
§26 c1.zip validated exact D7 checkpoint; all rollback proofs immutable.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OUT=ROOT/"assets/gensrpg/dungeon/core201-stability-v1.js"
REL="assets/gensrpg/dungeon/core201-stability-v1.js"
SRC_LEN=7729678
SRC_SHA="6e1cb9b82126409b633306b0e77a7e45badb0f79"
BODY_LEN=13990
BODY_SHA="7edf731fd1aa209ec96490fb8e2cb7af04afd627"
DST_LEN=7715741
DST_SHA="f56dc5bbb368b176509ab16477bd4b24dd000497"
OPEN=b'<script id="dungeonCore201Stability">'
TAG=b'<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>'
CLOSE=b'</script>'

def blob(b): return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
def pin(b,n,digest,what):
    assert len(b)==n and blob(b)==digest, f"{what}: got {len(b)} {blob(b)} expected {n} {digest}"
def derive(b):
    pin(b,SRC_LEN,SRC_SHA,"certified D7 source")
    assert b.count(OPEN)==1 and b.count(TAG)==0,"one original active Dungeon Core201"
    a=b.index(OPEN); z=b.index(CLOSE,a+len(OPEN))
    script=b[a+len(OPEN):z]
    pin(script,BODY_LEN,BODY_SHA,"Core201 exact script")
    new=b[:a]+TAG+b[z+len(CLOSE):]
    pin(new,DST_LEN,DST_SHA,"D8 exact index")
    return new,script
def change(p,path,old,new):
    s=p.get(path)
    if s is None:s=(ROOT/path).read_text(encoding="utf8")
    assert s.count(old)==1, f"unsafe patch {path}: anchor appears {s.count(old)} times {old[:120]!r}"
    p[path]=s.replace(old,new,1)

def patches():
    p={}
    anchor="  'assets/gensrpg/dungeon/core200-rebuild-v1.js',\n  'assets/gensrpg/dungeon/core211-consolidation-v1.js',\n"
    assert REL not in anchor
    updated=anchor.replace("  'assets/gensrpg/dungeon/core211-consolidation-v1.js',",f"  '{REL}',\n  'assets/gensrpg/dungeon/core211-consolidation-v1.js',")
    for path in ("tests/gens_phase2_runtime_load_graph_v11411.test.cjs",
                 "tests/gens_runtime_composition_guard_v11411.test.cjs"):
        change(p,path,anchor,updated)
    graph="tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
    for a,b in (("productionDirect).size,56,","productionDirect).size,57,"),
                ("allJs.length,114,","allJs.length,115,"),
                ("phase2Js.length,78,","phase2Js.length,79,"),
                ("reachable.size,100,","reachable.size,101,")):
        change(p,graph,a,b)
    for path in ("tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs",
                 "tests/gens_phase2_runtime_side_effect_inventory_v11411.test.cjs",
                 "tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs"):
        change(p,path,"reachable.size,100,","reachable.size,101,")
    change(p,"tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs","mapped.size,100,","mapped.size,101,")
    for path,key in (("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","CURRENT_BLOB"),
                     ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","CURRENT_INDEX_BLOB")):
        change(p,path,key+"='"+SRC_SHA+"'",key+"='"+DST_SHA+"'")
    owner="docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    m=json.loads((ROOT/owner).read_text(encoding="utf8"))
    assert len(m["files"])==100 and REL not in m["files"]
    m["files"][REL]={
      "owner":"Dungeon Core201 Stability",
      "domain":"dungeon",
      "role":"byte-identical 13990-byte native dungeonCore201Stability IIFE, keeping existing encounter UI, scene persistence, combat Bridge and original synchronous parser order"
    }
    m["files"]=dict(sorted(m["files"].items()))
    p[owner]=json.dumps(m,ensure_ascii=False,indent=2)+"\n"

    # All seven earlier regression tests take the same exact D7 bytes restored
    # in memory, never changing their historical accepted hashes.
    prefix='''const d8Index=read("index.html");
const core201Tag=Buffer.from('<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>');
const core201Open=Buffer.from('<script id="dungeonCore201Stability">');
const core201Body=read("assets/gensrpg/dungeon/core201-stability-v1.js");
assert.equal(d8Index.length,7715741,"D8 index length");
assert.equal(sha(d8Index),"f56dc5bbb368b176509ab16477bd4b24dd000497","D8 exact blob");
assert.equal(core201Body.length,13990,"D8 Core201 length");
assert.equal(sha(core201Body),"7edf731fd1aa209ec96490fb8e2cb7af04afd627","D8 Core201 exact blob");
const core201At=d8Index.indexOf(core201Tag);
assert.ok(core201At>0 && d8Index.indexOf(core201Tag,core201At+core201Tag.length)<0,"D8 Core201 unique owner");
const indexBeforeD8=Buffer.concat([
 d8Index.subarray(0,core201At),core201Open,core201Body,Buffer.from("</script>"),
 d8Index.subarray(core201At+core201Tag.length)
]);
assert.equal(indexBeforeD8.length,7729678);
assert.equal(sha(indexBeforeD8),"6e1cb9b82126409b633306b0e77a7e45badb0f79","exact D7 historical index");
'''
    for name in ("core213","core211","core200","mj72","core051","core01"):
        path="tests/gens_phase12_dungeon_"+name+"_extraction_v1.test.cjs"
        change(p,path,'const d7Index=read("index.html");',prefix+'const d7Index=indexBeforeD8;')
    d7test="tests/gens_phase12_dungeon_core214_extraction_v1.test.cjs"
    change(p,d7test,'const index=read("index.html");',
           prefix.replace("sha(d8Index)","hash(d8Index)").replace("sha(core201Body)","hash(core201Body)").replace("sha(indexBeforeD8)","hash(indexBeforeD8)")
           +'const index=indexBeforeD8;')

    # The Python verifiers get the exact D7 bytes in memory.
    rollback='''    d8tag=b'<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>'
    if d8tag in target:
        assert target.count(d8tag)==1, "D8 owner once"
        assert len(target)==7715741 and HASH(target)=="f56dc5bbb368b176509ab16477bd4b24dd000497", "D8 index drift"
        d8=(ROOT/"assets/gensrpg/dungeon/core201-stability-v1.js").read_bytes()
        assert len(d8)==13990 and HASH(d8)=="7edf731fd1aa209ec96490fb8e2cb7af04afd627", "D8 body drift"
        target=target.replace(d8tag,b'<script id="dungeonCore201Stability">'+d8+b'</script>',1)
        assert len(target)==7729678 and HASH(target)=="6e1cb9b82126409b633306b0e77a7e45badb0f79", "D7 restored drift"
'''
    hash_names={"core214":"sha","core213":"gitblob","core211":"blob",
                "core200":"blob","mj72":"sha","core051":"sha","core01":"blob"}
    for name,hash_fn in hash_names.items():
        script="tools/gensrpg_phase12_dungeon_"+name+("_extract_apply.py" if name!="core214" else "_extract_apply.py")
        # Actual D7 file is 'core214_extract_apply.py', not 'core214_d7...'.
        if name=="core214":script="tools/gensrpg_phase12_dungeon_core214_extract_apply.py"
        s=(ROOT/script).read_text(encoding="utf8")
        assert "def verify():" in s
        at=s.index("\ndef verify():\n")
        line="    live=INDEX.read_bytes()\n" if name in ("core214","core213") else "    target=INDEX.read_bytes()\n"
        pos=s.index(line,at)+len(line)
        inject=("    target=live\n" if name in ("core214","core213") else "")
        p[script]=s[:pos]+inject+rollback.replace("HASH(",hash_fn+"(")+("    live=target\n" if name in ("core214","core213") else "")+s[pos:]

    # D1 compares physical index and graph tests with exact accepted literals.
    # Keep strict ownership pin; allow only the certified D8 target.
    d1="tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
    change(p,d1,
      '''expected_after=("6e1cb9b82126409b633306b0e77a7e45badb0f79" if d7tag in INDEX.read_bytes()''',
      '''expected_after=("f56dc5bbb368b176509ab16477bd4b24dd000497" if d8tag in INDEX.read_bytes()
                                    else "6e1cb9b82126409b633306b0e77a7e45badb0f79" if d7tag in INDEX.read_bytes()''')
    anchor='''                            ("reachable.size,99,","reachable.size,100,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    change(p,d1,anchor,anchor+'''
                    if d8tag in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,56,","size,57,"),
                            ("allJs.length,114,","allJs.length,115,"),
                            ("phase2Js.length,78,","phase2Js.length,79,"),
                            ("reachable.size,100,","reachable.size,101,")
                        ]: expected_after=expected_after.replace(before_count,after_count)''')
    snap="tests/helpers/gens_capture_team_roster_snapshot_v1.cjs"
    change(p,snap,"function restoreHistoricalHubSnapshot(index,root){\n",
'''function restoreHistoricalHubSnapshot(index,root){
 if(hash(index)==='f56dc5bbb368b176509ab16477bd4b24dd000497'){
  assert.equal(index.length,7715741,'D8 exact length');
  const tag=Buffer.from('<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>');
  const at=index.indexOf(tag);
  assert.ok(at>0 && index.indexOf(tag,at+tag.length)<0,'D8 exact owner');
  const body=fs.readFileSync(path.join(root,'assets/gensrpg/dungeon/core201-stability-v1.js'));
  assert.equal(body.length,13990);assert.equal(hash(body),'7edf731fd1aa209ec96490fb8e2cb7af04afd627');
  index=Buffer.concat([index.subarray(0,at),Buffer.from('<script id="dungeonCore201Stability">'),body,Buffer.from('</script>'),index.subarray(at+tag.length)]);
  assert.equal(index.length,7729678);assert.equal(hash(index),'6e1cb9b82126409b633306b0e77a7e45badb0f79','D7 exact recovery');
 }
''')
    return p

def verify():
    live=INDEX.read_bytes()
    code=OUT.read_bytes()
    pin(live,DST_LEN,DST_SHA,"live D8 index")
    pin(code,BODY_LEN,BODY_SHA,"Core201 script")
    assert live.count(TAG)==1 and OPEN not in live
    old=live.replace(TAG,OPEN+code+CLOSE,1)
    pin(old,SRC_LEN,SRC_SHA,"D7 restored exact")
    assert derive(old)==(live,code)
    print("D8 verified: Core201 byte exact, D7 restored bitwise")

def apply():
    old=INDEX.read_bytes()
    new,code=derive(old)
    assert not OUT.exists(),"no second external owner"
    changes=patches()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(code)
    INDEX.write_bytes(new)
    for filename,s in changes.items():
        (ROOT/filename).write_text(s,encoding="utf8")
    verify()
    print("D8 updated",", ".join(sorted(changes)))

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--apply",action="store_true")
    mode.add_argument("--verify",action="store_true")
    args=parser.parse_args()
    apply() if args.apply else verify()
