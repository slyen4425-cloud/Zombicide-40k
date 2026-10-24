#!/usr/bin/env python3
"""Phase12 D9: byte-identical Dungeon Core202 extraction. Single branch / §25-26."""
import argparse, hashlib, json
from pathlib import Path
from gensrpg_phase12_r01_d9_source_view import read_d9_index_view
ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
REL="assets/gensrpg/dungeon/core202-content-density-v1.js"
OUT=ROOT/REL
SRC_LEN=7715741
SRC_SHA="f56dc5bbb368b176509ab16477bd4b24dd000497"
BODY_LEN=11821
BODY_SHA="364673f3dd35bfa8be7f378152f775656c9243e2"
DST_LEN=7703979
DST_SHA="fce949665fea47a2aa2a535ede7289b06936f986"
OPEN=b'<script id="dungeonCore202ContentDensity">'
TAG=b'<script id="dungeonCore202ContentDensity" src="assets/gensrpg/dungeon/core202-content-density-v1.js"></script>'
CLOSE=b'</script>'

def blob(b):return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
def pin(b,n,digest,label):
    assert len(b)==n and blob(b)==digest, f"{label} differs: {len(b)} {blob(b)}, want {n} {digest}"
def derive(data):
    pin(data,SRC_LEN,SRC_SHA,"certified D8 source c2.zip")
    assert data.count(OPEN)==1 and TAG not in data, "one active inline Core202, no duplicate external owner"
    a=data.index(OPEN);z=data.index(CLOSE,a+len(OPEN))
    code=data[a+len(OPEN):z]
    pin(code,BODY_LEN,BODY_SHA,"exact original Dungeon Core202 body")
    out=data[:a]+TAG+data[z+len(CLOSE):]
    pin(out,DST_LEN,DST_SHA,"derived D9 index")
    return out,code

def change(p,path,old,new):
    current=p.get(path)
    if current is None:current=(ROOT/path).read_text("utf8")
    assert current.count(old)==1, f"{path}: unsafe anchor {old[:140]!r}, count={current.count(old)}"
    p[path]=current.replace(old,new,1)

def patches():
    p={}
    anchor="  'assets/gensrpg/dungeon/core201-stability-v1.js',\n  'assets/gensrpg/dungeon/core211-consolidation-v1.js',\n"
    new=anchor.replace("  'assets/gensrpg/dungeon/core211-consolidation-v1.js',", "  '"+REL+"',\n  'assets/gensrpg/dungeon/core211-consolidation-v1.js',")
    for f in ("tests/gens_phase2_runtime_load_graph_v11411.test.cjs","tests/gens_runtime_composition_guard_v11411.test.cjs"):
        change(p,f,anchor,new)
    graph="tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
    for a,b in (("productionDirect).size,57,","productionDirect).size,58,"),
                ("allJs.length,115,","allJs.length,116,"),
                ("phase2Js.length,79,","phase2Js.length,80,"),
                ("reachable.size,101,","reachable.size,102,")):
        change(p,graph,a,b)
    for f in ("tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs",
              "tests/gens_phase2_runtime_side_effect_inventory_v11411.test.cjs",
              "tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs"):
        change(p,f,"reachable.size,101,","reachable.size,102,")
    change(p,"tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs","mapped.size,101,","mapped.size,102,")
    for f,key in (("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","CURRENT_BLOB"),
                  ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","CURRENT_INDEX_BLOB")):
        change(p,f,key+"='"+SRC_SHA+"'",key+"='"+DST_SHA+"'")
    manifest="docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    m=json.loads((ROOT/manifest).read_text("utf8"))
    assert len(m["files"])==101 and REL not in m["files"], "manifest must contain 101 existing owners"
    m["files"][REL]={"owner":"Dungeon Core202 Content Density","domain":"dungeon",
                    "role":"byte-identical active 11821-byte Core202 IIFE: Dungeon encounter/trap/puzzle cadence; authored-world density guard and existing Core01 hooks at original synchronous parser position"}
    m["files"]=dict(sorted(m["files"].items()))
    assert len(m["files"])==102
    p[manifest]=json.dumps(m,indent=2,ensure_ascii=False)+"\n"

    # Each D1-D8 immutable historical regression test reads the D8 snapshot
    # restored from the physically extracted D9 owner before its existing history.
    for suffix in ("core201_d8","core214","core213","core211","core200","mj72","core051","core01"):
        f="tests/gens_phase12_dungeon_"+suffix+"_extraction_v1.test.cjs"
        before='read("index.html")'
        after='require("./helpers/gens_phase12_d9_restore_v1.cjs")(read("index.html"),require("node:path").resolve(__dirname,".."))'
        change(p,f,before,after)

    # Existing Core202 authored-world boundary stays just as strict; only its
    # source moves, and the legacy script must no longer exist inline.
    f="tests/gens_authored_core202_boundary_v11411.test.cjs"
    before="""const start=src.indexOf('<script id="dungeonCore202ContentDensity">');
const end=src.indexOf('</script>',start);
assert.ok(start>=0&&end>start,'Core 2.02 inline block must exist');
const block=src.slice(start,end);"""
    after="""const tag='<script id="dungeonCore202ContentDensity" src="assets/gensrpg/dungeon/core202-content-density-v1.js"></script>';
assert.equal(src.split(tag).length,2,'one exact synchronous Core202 owner');
assert.ok(!src.includes('<script id="dungeonCore202ContentDensity">'),'no duplicate inline Core202');
const block=fs.readFileSync('assets/gensrpg/dungeon/core202-content-density-v1.js','utf8');"""
    change(p,f,before,after)

    # Earlier Python verifiers see the restored byte-exact D8 snapshot.
    rollback='''    d9tag=b'<script id="dungeonCore202ContentDensity" src="assets/gensrpg/dungeon/core202-content-density-v1.js"></script>'
    if d9tag in TARGET:
        assert TARGET.count(d9tag)==1, "D9 owner once"
        assert len(TARGET)==7703979 and HASH(TARGET)=="fce949665fea47a2aa2a535ede7289b06936f986", "D9 index drift"
        d9=(ROOT/"assets/gensrpg/dungeon/core202-content-density-v1.js").read_bytes()
        assert len(d9)==11821 and HASH(d9)=="364673f3dd35bfa8be7f378152f775656c9243e2", "D9 body drift"
        TARGET=TARGET.replace(d9tag,b'<script id="dungeonCore202ContentDensity">'+d9+b'</script>',1)
        assert len(TARGET)==7715741 and HASH(TARGET)=="f56dc5bbb368b176509ab16477bd4b24dd000497", "restored D8 exact"
'''
    hashes={"core201_d8":"blob","core214":"sha","core213":"gitblob","core211":"blob",
            "core200":"blob","mj72":"sha","core051":"sha","core01":"blob"}
    for suffix,h in hashes.items():
        f="tools/gensrpg_phase12_dungeon_"+suffix+"_extract_apply.py"
        code=(ROOT/f).read_text("utf8")
        at=code.index("\ndef verify():\n")
        mode="    live=INDEX.read_bytes()\n" if suffix in ("core201_d8","core214","core213") else "    target=INDEX.read_bytes()\n"
        i=code.index(mode,at)+len(mode)
        target="live" if mode.startswith("    live") else "target"
        p[f]=code[:i]+rollback.replace("TARGET",target).replace("HASH(",h+"(")+code[i:]

    # D1 additionally compares the current physical graph & hash values.
    f="tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
    change(p,f,
        '''expected_after=("f56dc5bbb368b176509ab16477bd4b24dd000497" if d8tag in INDEX.read_bytes()''',
        '''expected_after=("fce949665fea47a2aa2a535ede7289b06936f986" if d9tag in INDEX.read_bytes()
                                    else "f56dc5bbb368b176509ab16477bd4b24dd000497" if d8tag in INDEX.read_bytes()''')
    guard='''                            ("reachable.size,100,","reachable.size,101,")
                        ]: expected_after=expected_after.replace(before_count,after_count)'''
    change(p,f,guard,guard+'''
                    if d9tag in INDEX.read_bytes():
                        for before_count,after_count in [
                            ("size,57,","size,58,"),
                            ("allJs.length,115,","allJs.length,116,"),
                            ("phase2Js.length,79,","phase2Js.length,80,"),
                            ("reachable.size,101,","reachable.size,102,")
                        ]: expected_after=expected_after.replace(before_count,after_count)''')

    # Legacy Capture fixtures stay byte-exact and reconstruct the older D8
    # index in memory; no historical blob pin is relaxed.
    f="tests/helpers/gens_capture_team_roster_snapshot_v1.cjs"
    before="function restoreHistoricalHubSnapshot(index,root){\n"
    after="""function restoreHistoricalHubSnapshot(index,root){
 if(hash(index)==='fce949665fea47a2aa2a535ede7289b06936f986'){
  assert.equal(index.length,7703979,'D9 exact length');
  const tag=Buffer.from('<script id="dungeonCore202ContentDensity" src="assets/gensrpg/dungeon/core202-content-density-v1.js"></script>');
  const at=index.indexOf(tag);
  assert.ok(at>0&&index.indexOf(tag,at+tag.length)<0,'D9 one owner');
  const js=fs.readFileSync(path.join(root,'assets/gensrpg/dungeon/core202-content-density-v1.js'));
  assert.equal(js.length,11821);assert.equal(hash(js),'364673f3dd35bfa8be7f378152f775656c9243e2');
  index=Buffer.concat([index.subarray(0,at),Buffer.from('<script id="dungeonCore202ContentDensity">'),js,Buffer.from('</script>'),index.subarray(at+tag.length)]);
  assert.equal(index.length,7715741);assert.equal(hash(index),'f56dc5bbb368b176509ab16477bd4b24dd000497','D8 exact restore');
 }
"""
    change(p,f,before,after)
    return p

def verify():
    live=read_d9_index_view(INDEX,ROOT)
    js=OUT.read_bytes()
    pin(live,DST_LEN,DST_SHA,"D9 live index")
    pin(js,BODY_LEN,BODY_SHA,"D9 script")
    assert live.count(TAG)==1 and OPEN not in live
    restored=live.replace(TAG,OPEN+js+CLOSE,1)
    pin(restored,SRC_LEN,SRC_SHA,"exact D8 rollback")
    assert derive(restored)==(live,js),"no alteration of Core202"
    print("D9 Core202 verified: 11821 bytes moved bit-for-bit, exact D8 restore")

def apply():
    original=INDEX.read_bytes()
    out,js=derive(original)
    assert not OUT.exists(),"D9 must never write a second owner"
    modifications=patches()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(js)
    INDEX.write_bytes(out)
    for path,value in modifications.items():
        (ROOT/path).write_text(value,encoding="utf8")
    verify()
    print("D9 modified",", ".join(sorted(modifications)))

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--apply",action="store_true")
    mode.add_argument("--verify",action="store_true")
    args=parser.parse_args()
    apply() if args.apply else verify()
