#!/usr/bin/env python3
"""R08 single-owner extraction: shared ability/skill libraries and editors.
The historical Escape keydown handler remains in-place, never relocated.
Only exact d6.zip (R07 GREEN) input and projected output are accepted.
"""
import argparse, hashlib, json, re, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OLD_N,OLD_SHA=2217805,"aca31c540d61c81e1504d3b915b034b372103b5b"
NEW_N,NEW_SHA=2131805,"6eeed45a0a12085c1b107ee6c24b49040277ca54"
REGION_N,REGION_SHA=86271,"9b0d61d7aa0dc833a005f9abf2902c6715224313"
JS_N,JS_SHA=86082,"f3f650679799d1e6c8e6b6bcd76a6a0963a02f66"
REL="assets/gensrpg/builders/legacy-ability-skill-catalog-v1.js"
TAG=b'<script src="assets/gensrpg/builders/legacy-ability-skill-catalog-v1.js"></script>'
OPEN=b'<script>\nconst Z40K_APP_VERSION = "16.168-DUNGEON-HERO-ITEM-ASSETS";'
START=b'const GENSRPG_ABILITY_LIBRARY_KEY="gensrpg_ability_library_v1";'
END=b'function z40kEscHtml(s){'
NEXT=b'function renderSkillEditorType(){'
LISTENER=b'document.addEventListener("keydown",e=>{\n  if(e.key==="Escape"){\n    const p=document.getElementById("skillEditorPanel");\n    if(p && p.style.display==="block")closeSkillEditor();\n  }\n});\n\n'
CACHE_OLD="gensrpg-cache-16.78.114.11-phase4-stats-s11-core-snapshot-1-r05-core-cloud-sync-r06-capture-inline-exit-r07-magic-sound-data"
CACHE_NEW=CACHE_OLD+"-r08-shared-ability-skill-catalog"

def gitblob(s):
    return hashlib.sha1(b"blob "+str(len(s)).encode()+b"\0"+s).hexdigest()
def pin(s,n,blob,title):
    if len(s)!=n or gitblob(s)!=blob:
        raise ValueError(f"{title} source mismatch: {len(s)} / {gitblob(s)}")
def once(s,pattern,label):
    if s.count(pattern)!=1:
        raise ValueError(f"{label} must occur exactly once, got {s.count(pattern)}")
def extract(old):
    pin(old,OLD_N,OLD_SHA,"user d6.zip / R07 GREEN")
    for term,title in [(START,"start"),(END,"end"),(OPEN,"main script"),(LISTENER,"Escape handler")]:
        once(old,term,title)
    start=old.index(START);end=old.index(END,start)
    region=old[start:end]
    pin(region,REGION_N,REGION_SHA,"exact shared catalog")
    once(region,LISTENER,"listener inside catalog")
    once(region,NEXT,"listener reinsertion anchor")
    if not old.index(OPEN)<start<end<old.find(b"</script>",old.index(OPEN)):
        raise ValueError("R08 must remain within original classic second script")
    asset=region.replace(LISTENER,b"",1)
    pin(asset,JS_N,JS_SHA,"pure R08 shared catalog module")
    if len(re.findall(rb"(?m)^function\s+[\w$]+\s*\(",asset))!=57:
        raise ValueError("57 stable declarations required")
    new=old.replace(region,LISTENER,1).replace(OPEN,TAG+OPEN,1)
    pin(new,NEW_N,NEW_SHA,"R08 projected index")
    if restore(new,asset)!=old:
        raise ValueError("bit-exact rollback impossible")
    return new,asset
def restore(new,asset):
    pin(new,NEW_N,NEW_SHA,"R08 index")
    pin(asset,JS_N,JS_SHA,"R08 module")
    for value,what in [(TAG,"module tag"),(LISTENER,"original keydown"),(NEXT,"editor function")]:
        once(new if value!=NEXT else asset,value,what)
    if LISTENER in asset:
        raise ValueError("keydown listener must not move")
    region=asset.replace(NEXT,LISTENER+NEXT,1)
    pin(region,REGION_N,REGION_SHA,"original catalog")
    old=new.replace(TAG,b"",1).replace(LISTENER,region,1)
    pin(old,OLD_N,OLD_SHA,"R07 reconstructed source")
    return old

def repl(filename,old,new):
    file=ROOT/filename;text=file.read_text("utf8")
    if text.count(old)!=1:
        raise ValueError(f"missing exact metadata anchor {filename}: {old[:90]}")
    file.write_text(text.replace(old,new,1),"utf8")

def apply():
    old=(ROOT/"index.html").read_bytes()
    new,asset=extract(old)
    path=ROOT/REL
    if path.exists():raise ValueError("Refuse overwriting previous R08 asset")
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(asset)
    (ROOT/"index.html").write_bytes(new)
    repl("service-worker.js",'const CACHE_NAME = "'+CACHE_OLD+'";','const CACHE_NAME = "'+CACHE_NEW+'";')
    anchor='"./assets/gensrpg/core/legacy-magic-sounds-v1.js",'
    repl("service-worker.js",anchor,anchor+'"./'+REL+'",')
    owners=ROOT/"docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json"
    data=json.loads(owners.read_text("utf8"))
    if REL in data["files"]:raise ValueError("duplicate owners")
    data["files"][REL]={
      "owner":"GenSrpG Builders / Shared Ability and Skill Catalog R08",
      "domain":"builders",
      "role":"57 original library/editor functions moved bit-identical, Escape listener unchanged at original parser position, no combat engine duplicated"
    }
    owners.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n","utf8")
    verify()

def verify():
    out=(ROOT/"index.html").read_bytes()
    # R10 first restores exact R09, then R09 restores exact R08.
    # Strictly whitelist both known Git blobs; never loosen the source gate.
    if (len(out)==2093066 and gitblob(out)=="4dbe3314d5048f2def404ed674498c0670c04fc1") or (len(out)==2031649 and gitblob(out)=="b8ef8dcb497cad94c91094ed008136a5d9800155"):
        out=subprocess.check_output(["node",str(ROOT/"tools/gensrpg_phase12_r09_wave_extract_apply.cjs"),"--restore-r08"],cwd=ROOT)
    asset=(ROOT/REL).read_bytes()
    old=restore(out,asset)
    if extract(old)!=(out,asset):raise ValueError("R08 forward-backward drift")
    sw=(ROOT/"service-worker.js").read_text("utf8")
    if sw.count('"./'+REL+'"')!=1 or CACHE_NEW not in sw:raise ValueError("PWA missing R08")
    owners=json.loads((ROOT/"docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json").read_text("utf8"))
    if owners["files"].get(REL,{}).get("domain")!="builders":raise ValueError("R08 owner absent")
    print(json.dumps({"verified":True,"source":"R07 GREEN d6.zip","index_blob":gitblob(out),"asset_blob":gitblob(asset),"declarations":57,"rollback_exact":True,"listener_unchanged":True}))

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check-source",action="store_true")
    group.add_argument("--apply",action="store_true")
    group.add_argument("--verify",action="store_true")
    args=parser.parse_args()
    if args.apply:apply()
    elif args.verify:verify()
    else:
        out,asset=extract((ROOT/"index.html").read_bytes())
        print(json.dumps({"source_verified":True,"output_size":len(out),"output_blob":gitblob(out),"module_bytes":len(asset),"module_blob":gitblob(asset),"rollback_exact":True}))
