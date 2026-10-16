#!/usr/bin/env python3
"""R02 byte-exact multi-domain LEGACY transport, not a domain-owner refactor."""
import argparse, hashlib, re, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
REL="assets/gensrpg/legacy/phase12-historical-multidomain-bridge-v1.js"
OUT=ROOT/REL
SRC_LEN=6969593
SRC_SHA="caf31c121d926b7b76b9bb05688fab8f2839814e"
BODY_LEN=5364441
BODY_SHA="181ec13091f7dfeb5dde173af99dbe1aeecb07c2"
DST_LEN=1605224
DST_SHA="f6d3eb2a1cc87046d88e678c3bf67f6877baa887"
OPEN=b"<script>"
CLOSE=b"</script>"
TAG=b'<script src="assets/gensrpg/legacy/phase12-historical-multidomain-bridge-v1.js"></script>'
PATTERN=re.compile(rb"<script\b[^>]*>(.*?)</script>",re.S|re.I)
def blob(b):return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
def pin(b,size,sha,label):
    assert len(b)==size and blob(b)==sha,f"{label}: got {len(b)} {blob(b)}; want {size} {sha}"
def extract(original):
    pin(original,SRC_LEN,SRC_SHA,"certified R01 source")
    found=[m for m in PATTERN.finditer(original) if len(m.group(1))==BODY_LEN and blob(m.group(1))==BODY_SHA]
    assert len(found)==1,"one exact historical multi-domain transport expected"
    m=found[0]
    assert original[m.start():m.start()+len(OPEN)]==OPEN,"classic anonymous script required"
    js=m.group(1)
    assert js.startswith(b"\n\nconst Z40K_GENERIC_SHEET_BG") and js.rstrip().endswith(b"},{once:true});")
    assert b"GENSRPG_EQUIPMENT_CARD_BG" in js and b"GENSRPG_ENEMY_SKINS" in js and b"DOMContentLoaded" in js
    assert TAG not in original,"duplicate legacy transport"
    target=original[:m.start()]+TAG+original[m.end():]
    pin(target,DST_LEN,DST_SHA,"R02 proposed exact output")
    return target,js
def certify_archive(archive):
    with zipfile.ZipFile(archive) as z:
        entries=[(f.filename,z.read(f)) for f in z.infolist() if not f.is_dir() and f.file_size==SRC_LEN]
    entries=[(name,b) for name,b in entries if blob(b)==SRC_SHA]
    assert len(entries)==1,"§26 requires a unique exact R01 index in archive"
    target,js=extract(entries[0][1])
    print("R02 SOURCE CERTIFIED",entries[0][0],SRC_SHA,"proposed index",blob(target),"body",blob(js))
def verify():
    index=INDEX.read_bytes();js=OUT.read_bytes()
    pin(index,DST_LEN,DST_SHA,"R02 published index")
    pin(js,BODY_LEN,BODY_SHA,"R02 published body")
    assert index.count(TAG)==1,"one external PWA owner"
    at=index.index(TAG)
    restored=index[:at]+OPEN+js+CLOSE+index[at+len(TAG):]
    pin(restored,SRC_LEN,SRC_SHA,"R02 to R01 strict rollback")
    assert extract(restored)==(index,js)
    print("R02 byte-exact IIFE and index rollback PASS")
def apply():
    original=INDEX.read_bytes();index,js=extract(original)
    assert not OUT.exists(),"R02 target must not exist"
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_bytes(js);INDEX.write_bytes(index)
    verify()
if __name__=="__main__":
    p=argparse.ArgumentParser()
    mode=p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--apply",action="store_true")
    mode.add_argument("--verify",action="store_true")
    mode.add_argument("--certify-archive",type=Path)
    args=p.parse_args()
    if args.apply:apply()
    elif args.verify:verify()
    else:certify_archive(args.certify_archive)
