#!/usr/bin/env python3
"""R02: externalize only five immutable data URL literals; prove strict rollback.
No game function is moved or changed; the original anonymous script stays inline.
"""
import argparse
import hashlib
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
REL="assets/gensrpg/core/legacy-visual-data-v1.js"
ASSET=ROOT/REL
SRC_LEN=6969593
SRC_SHA="caf31c121d926b7b76b9bb05688fab8f2839814e"
BODY_LEN=5364441
BODY_SHA="181ec13091f7dfeb5dde173af99dbe1aeecb07c2"
OUT_LEN=2869485
OUT_SHA="062c4cd37634f504cc75ce3329d6e69e19b5f547"
JS_LEN=4100559
JS_SHA="f7adfca9b04b23c489aae71ae9284c9b849f1d0b"
MONO_LEN=1264265
MONO_SHA="c7e4d2e7175814fcbe0a3d09e57b438286986ff3"
TAG=b'<script src="assets/gensrpg/core/legacy-visual-data-v1.js"></script>'
RE_SCRIPT=re.compile(rb"<script\b[^>]*>(.*?)</script>",re.S|re.I)
RE_IMG=re.compile(rb"'data:image/(?:png|webp);base64,[A-Za-z0-9+/=]+'")
FIELDS=[b"sheetBackground",b"equipmentCardBackground",b"enemySkins.creature",b"enemySkins.boss",b"enemySkins.invocation"]
LENGTHS=[3587804,136681,125169,142397,108353]

def blob(b):
    return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()

def pin(b,size,sha,title):
    assert len(b)==size and blob(b)==sha,(title,len(b),blob(b),size,sha)

def gather(source):
    found=[m for m in RE_SCRIPT.finditer(source) if len(m.group(1))==BODY_LEN and blob(m.group(1))==BODY_SHA]
    assert len(found)==1,"one and only one original 5.36MB script"
    m=found[0]
    assert source[m.start():m.start(1)]==b"<script>","must preserve anonymous classic script"
    body=m.group(1)
    urls=list(RE_IMG.finditer(body))
    assert len(urls)==5 and [len(u.group()) for u in urls]==LENGTHS,"five exact original data URLs"
    assert b"GensRpgLegacyVisualDataR02" not in source,"no prior new owner"
    return m,urls

def make_js(urls):
    v=[u.group() for u in urls]
    return (b"const GensRpgLegacyVisualDataR02 = {\n"
            +b"  sheetBackground: "+v[0]+b",\n"
            +b"  equipmentCardBackground: "+v[1]+b",\n"
            +b"  enemySkins: {\n"
            +b"    creature: "+v[2]+b",\n"
            +b"    boss: "+v[3]+b",\n"
            +b"    invocation: "+v[4]+b"\n"
            +b"  }\n};\n")

def compute(source):
    pin(source,SRC_LEN,SRC_SHA,"R01 GREEN source")
    m,urls=gather(source)
    body=m.group(1)
    newbody=body
    for key,u in reversed(list(zip(FIELDS,urls))):
        newbody=newbody[:u.start()]+b"GensRpgLegacyVisualDataR02."+key+newbody[u.end():]
    pin(newbody,MONO_LEN,MONO_SHA,"identical code except five data expressions")
    new_index=source[:m.start()]+TAG+source[m.start():m.start(1)]+newbody+source[m.end(1):]
    js=make_js(urls)
    pin(new_index,OUT_LEN,OUT_SHA,"R02 projected index")
    pin(js,JS_LEN,JS_SHA,"R02 projected data owner")
    assert new_index.count(TAG)==1 and new_index.index(TAG)<new_index.index(b"GensRpgLegacyVisualDataR02.sheetBackground")
    return new_index,js

def reverse(index,js):
    pin(index,OUT_LEN,OUT_SHA,"published R02 index")
    pin(js,JS_LEN,JS_SHA,"published R02 asset")
    urls=RE_IMG.findall(js)
    assert len(urls)==5 and [len(x) for x in urls]==LENGTHS
    index_without_tag=index.replace(TAG,b"",1)
    assert index_without_tag.count(TAG)==0
    found=[m for m in RE_SCRIPT.finditer(index_without_tag) if b"GensRpgLegacyVisualDataR02.sheetBackground" in m.group(1)]
    assert len(found)==1,"original monolith is kept as a single script"
    m=found[0]
    body=m.group(1)
    for field,url in zip(FIELDS,urls):
        token=b"GensRpgLegacyVisualDataR02."+field
        assert body.count(token)==1,(field,body.count(token))
        body=body.replace(token,url,1)
    restored=index_without_tag[:m.start(1)]+body+index_without_tag[m.end(1):]
    pin(restored,SRC_LEN,SRC_SHA,"R02 to R01 byte-exact rollback")
    return restored

def verify():
    idx=INDEX.read_bytes()
    js=ASSET.read_bytes()
    assert compute(reverse(idx,js))==(idx,js),"R02 forward-backward identity"
    print("R02 VERIFIED: five images exact, original source reconstructed, JS only data values")

def apply():
    source=INDEX.read_bytes()
    index,js=compute(source)
    assert not ASSET.exists(),"must not overwrite an existing owner"
    ASSET.parent.mkdir(parents=True,exist_ok=True)
    ASSET.write_bytes(js)
    INDEX.write_bytes(index)
    verify()

if __name__=="__main__":
    p=argparse.ArgumentParser()
    modes=p.add_mutually_exclusive_group(required=True)
    modes.add_argument("--apply",action="store_true")
    modes.add_argument("--verify",action="store_true")
    modes.add_argument("--check-source",action="store_true")
    a=p.parse_args()
    if a.apply:apply()
    elif a.verify:verify()
    else:
        index,js=compute(INDEX.read_bytes())
        print("R02 SOURCE CERTIFIED:",SRC_SHA,"new index",OUT_SHA,"asset",JS_SHA)
