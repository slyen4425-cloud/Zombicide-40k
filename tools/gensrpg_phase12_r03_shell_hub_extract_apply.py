#!/usr/bin/env python3
"""R03: relocate only six classic Shell Hub UI function declarations; byte-exact R02 rollback."""
from pathlib import Path
import argparse,hashlib,re
ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/'index.html'
REL='assets/gensrpg/shell/legacy-hub-family-ui-v1.js'
ASSET=ROOT/REL
SRC_SIZE=2869485
SRC_SHA='062c4cd37634f504cc75ce3329d6e69e19b5f547'
OUT_SIZE=2862906
OUT_SHA='8faf7af7fced0a1e0724985e85718a0e4a9e673b'
JS_SIZE=6651
JS_SHA='e45f3b4e419a10b030c47bc921bded1ec0dc723b'
BEGIN=b'function renderGensRpgUniverseCards(family="adventure")'
END=b'function gensCleanDungeonDemoHeroesFromOtherUniverses()'
TAG=b'<script src="'+REL.encode()+b'"></script>\n'
MONO=b'<script>\n\nconst Z40K_GENERIC_SHEET_BG = GensRpgLegacyVisualDataR02.sheetBackground;'
RE=re.compile(rb'<script>(.*?)</script>',re.S|re.I)
NAMES=('renderGensRpgUniverseCards','renderGensSurvivalUniverseCards','renderGensFamilyGamesIfVisible','openGensFamily','gensFamilyForProfileId','renderGensGameHomeLight')
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def pin(b,n,h):assert len(b)==n and blob(b)==h,(len(b),blob(b),n,h)
def transform(source):
    pin(source,SRC_SIZE,SRC_SHA)
    assert source.count(TAG)==0 and source.count(MONO)==1
    matches=[m for m in RE.finditer(source) if BEGIN in m.group(1)]
    assert len(matches)==1
    m=matches[0];body=m.group(1)
    assert body.count(BEGIN)==body.count(END)==1
    a=body.index(BEGIN);b=body.index(END)
    js=body[a:b]
    names=tuple(n.decode() for n in re.findall(rb'(?m)^function (\w+)\(',js))
    assert names==NAMES,names
    newbody=body[:a]+body[b:]
    out=source[:m.start(1)]+newbody+source[m.end(1):]
    out=out.replace(MONO,TAG+MONO,1)
    pin(out,OUT_SIZE,OUT_SHA);pin(js,JS_SIZE,JS_SHA)
    return out,js
def reverse(index,js):
    pin(index,OUT_SIZE,OUT_SHA);pin(js,JS_SIZE,JS_SHA)
    assert index.count(TAG)==1 and index.count(MONO)==1
    s=index.replace(TAG,b'',1)
    matches=[m for m in RE.finditer(s) if END in m.group(1)]
    assert len(matches)==1
    m=matches[0];body=m.group(1)
    assert body.count(END)==1 and body.count(BEGIN)==0
    body=body.replace(END,js+END,1)
    ret=s[:m.start(1)]+body+s[m.end(1):]
    pin(ret,SRC_SIZE,SRC_SHA)
    return ret
def verify():
    idx=INDEX.read_bytes();js=ASSET.read_bytes()
    assert transform(reverse(idx,js))==(idx,js)
    print('R03 VERIF: six Hub functions, no duplicate, bit-identical R02 restore')
def apply():
    assert not ASSET.exists()
    idx,js=transform(INDEX.read_bytes())
    ASSET.parent.mkdir(parents=True,exist_ok=True)
    ASSET.write_bytes(js);INDEX.write_bytes(idx)
    verify()
if __name__=='__main__':
    p=argparse.ArgumentParser();group=p.add_mutually_exclusive_group(required=True)
    group.add_argument('--check-source',action='store_true')
    group.add_argument('--apply',action='store_true')
    group.add_argument('--verify',action='store_true')
    a=p.parse_args()
    if a.check_source:
        idx,js=transform(INDEX.read_bytes());assert reverse(idx,js)==INDEX.read_bytes()
        print('R03 SRC PIN',OUT_SHA,JS_SHA)
    elif a.apply:apply()
    else:verify()
