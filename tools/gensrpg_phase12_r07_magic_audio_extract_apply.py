#!/usr/bin/env python3
"""R07: relocate one immutable 425KB magic-sound data declaration (not gameplay)."""
import argparse, hashlib, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE_SIZE=2643155
SOURCE_BLOB="12fc91df4ee4c7989a172baa96f9790da6dc57f7"
OUT_SIZE=2217805
OUT_BLOB="aca31c540d61c81e1504d3b915b034b372103b5b"
ASSET_LEN=425484
ASSET_BLOB="a09e21c0da7439ccda5a6aaa246096950e1b261b"
REGION_BLOB="40e86dfc303584a1574108ab57cc11315c0ac49b"
REL="assets/gensrpg/core/legacy-magic-sounds-v1.js"
TAG=b'<script src="assets/gensrpg/core/legacy-magic-sounds-v1.js"></script>'
FROM=b"const GENSRPG_MAGIC_SOUNDS = "
ALIAS=b"const GENSRPG_MAGIC_SOUNDS = GensRpgLegacyMagicSoundsR07;"
JS_PREFIX=b"const GensRpgLegacyMagicSoundsR07 = "
START=b"const GENSRPG_MAGIC_SOUNDS = {"
FOLLOW=b"\n};\n\nconst GENSRPG_SOUND_LIBRARY"
OLD_CACHE="gensrpg-cache-16.78.114.11-phase4-stats-s11-core-snapshot-1-r05-core-cloud-sync-r06-capture-inline-exit"
NEW_CACHE=OLD_CACHE+"-r07-magic-sound-data"

def blob(b):
    return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()

def guard(data, n, sha, label):
    if len(data)!=n or blob(data)!=sha:
        raise ValueError("%s wrong source: size=%d blob=%s expected=%d %s"%(label,len(data),blob(data),n,sha))

def project(source):
    guard(source,SOURCE_SIZE,SOURCE_BLOB,"R06 GREEN/d3.zip")
    if source.count(START)!=1 or source.count(FOLLOW)!=1 or TAG in source or ALIAS in source:
        raise ValueError("R07 exact single declaration boundary missing/ambiguous")
    a=source.index(START); b=source.index(FOLLOW,a)+len(b"\n};")
    region=source[a:b]
    guard(region,425476,REGION_BLOB,"immutable magic audio declaration")
    script_at=source.rfind(b"<script>",0,a)
    assert script_at>=0 and source.find(b"</script>",script_at)>a,"magic audio declaration must be inside the classic anonymous script"
    assert source[script_at:script_at+8]==b"<script>","not a classic parser-synchronous block"
    asset=JS_PREFIX+region[len(FROM):]+b"\n"
    guard(asset,ASSET_LEN,ASSET_BLOB,"projected owner data")
    new=source[:script_at]+TAG+source[script_at:a]+ALIAS+source[b:]
    guard(new,OUT_SIZE,OUT_BLOB,"projected HTML")
    assert reverse(new,asset)==source,"R07 to R06 byte-exact rollback failed"
    return new,asset

def reverse(out,asset):
    guard(out,OUT_SIZE,OUT_BLOB,"R07 current HTML")
    guard(asset,ASSET_LEN,ASSET_BLOB,"R07 current audio data")
    assert out.count(TAG)==1 and out.count(ALIAS)==1,"one tag and one binding"
    assert asset.startswith(JS_PREFIX) and asset.endswith(b"\n")
    original=FROM+asset[len(JS_PREFIX):-1]
    guard(original,425476,REGION_BLOB,"restored declaration")
    restore=out.replace(TAG,b"",1).replace(ALIAS,original,1)
    guard(restore,SOURCE_SIZE,SOURCE_BLOB,"R06 restored source")
    return restore

def replace_one(p,old,new):
    t=p.read_text("utf-8")
    if t.count(old)!=1:
        raise ValueError("exact test/manifest pin absent: "+str(p)+" "+old[:90])
    p.write_text(t.replace(old,new,1),"utf-8")

def metadata_changes():
    sw=ROOT/"service-worker.js"
    replace_one(sw,'const CACHE_NAME = "'+OLD_CACHE+'";','const CACHE_NAME = "'+NEW_CACHE+'";')
    replace_one(sw,'"./assets/gensrpg/core/legacy-visual-data-v1.js",','"./assets/gensrpg/core/legacy-visual-data-v1.js","./'+REL+'",')
    manifest=ROOT/"docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    obj=json.loads(manifest.read_text("utf-8"))
    assert REL not in obj["files"]
    obj["files"][REL]={"owner":"GenSrpG Core / shared immutable magic audio library R07","domain":"core","role":"single byte-exact set of three embedded MP3 data URLs; synchronous pure data owner, no gameplay logic or new sound engine"}
    manifest.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n","utf-8")

    tests=[
      ("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","const CURRENT_BLOB='"+SOURCE_BLOB+"'","const CURRENT_BLOB='"+OUT_BLOB+"'"),
      ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","const CURRENT_INDEX_BLOB='"+SOURCE_BLOB+"'","const CURRENT_INDEX_BLOB='"+OUT_BLOB+"'"),
      ("tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs","reachable.size,125,","reachable.size,126,"),
      ("tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs","mapped.size,125,","mapped.size,126,"),
      ("tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs","reachable.size,107+captureR06Files.length,","reachable.size,108+captureR06Files.length,"),
      ("tests/gens_phase3_target_structure_contracts_v1.test.cjs","107+captureR06OwnerPaths.length,","108+captureR06OwnerPaths.length,"),
      ("tests/helpers/gens_phase12_r06_capture_source_view_v1.cjs","module.exports=function originalR06View(index,root=path.resolve(__dirname,'../..')){\n","module.exports=function originalR06View(index,root=path.resolve(__dirname,'../..')){\n index=require('./gens_phase12_r07_magic_audio_source_view_v1.cjs')(index,root);\n"),
      ("tests/gens_phase12_exit_inventory_v1.test.py",'report = summarize(source.read_bytes())','from gensrpg_phase12_r07_magic_audio_extract_apply import reverse, ROOT, REL\n        report = summarize(reverse(source.read_bytes(), (ROOT / REL).read_bytes()))'),
    ]
    for rel,old,new in tests:replace_one(ROOT/rel,old,new)

def apply():
    current=(ROOT/"index.html").read_bytes()
    output,asset=project(current)
    target=ROOT/REL
    assert not target.exists(),"R07 must not overwrite existing asset"
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(asset)
    (ROOT/"index.html").write_bytes(output)
    metadata_changes()
    verify()

def verify():
    out=(ROOT/"index.html").read_bytes()
    asset=(ROOT/REL).read_bytes()
    old=reverse(out,asset)
    assert project(old)==(out,asset)
    sw=(ROOT/"service-worker.js").read_text("utf-8")
    assert ('const CACHE_NAME = "'+NEW_CACHE+'";') in sw
    assert sw.count('"./'+REL+'"')==1
    obj=json.loads((ROOT/"docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json").read_text("utf-8"))
    assert obj["files"][REL]["domain"]=="core"
    print(json.dumps({"mode":"verify","source_blob":SOURCE_BLOB,"output_blob":OUT_BLOB,"output_bytes":OUT_SIZE,"asset_bytes":len(asset),"asset_blob":blob(asset),"restored_R06_exact":True}))

if __name__=="__main__":
    cli=argparse.ArgumentParser()
    group=cli.add_mutually_exclusive_group(required=True)
    group.add_argument("--apply",action="store_true")
    group.add_argument("--verify",action="store_true")
    group.add_argument("--check-source",action="store_true")
    a=cli.parse_args()
    if a.apply:apply()
    elif a.verify:verify()
    else:
        idx=(ROOT/"index.html").read_bytes()
        new,asset=project(idx)
        print(json.dumps({"source_verified":True,"new_html_size":len(new),"new_html_blob":blob(new),"new_audio_size":len(asset),"new_audio_blob":blob(asset),"rollback":True}))
