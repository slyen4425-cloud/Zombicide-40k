#!/usr/bin/env python3
"""Phase 12 R04: byte-pinned extraction of the shared equipment Builder owner.
The single original boot-time refresh remains inside the legacy monolith.
No runtime/gameplay source edits, only physical relocation and proof.
"""
import argparse,hashlib,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
REL="assets/gensrpg/builders/equipment-library-editor-v1.js"
ASSET=ROOT/REL
R03_N=2862906
R03="8faf7af7fced0a1e0724985e85718a0e4a9e673b"
R04_N=2835125
R04="554bf6100aeb0f40bfc098dc90863af7d2d5e439"
JS_N=27860
JS_SHA="27cadba87c766b5293ac3a7fe3ddffb8510adc40"
FIRST=b'const CUSTOM_EQUIPMENT_KEY="gensrpg_custom_equipment_v1";'
LAST=b'const GENS_GAME_CONFIG_KEY="gensrpg_game_config_v1";'
CALL=b'refreshCustomEquipmentIntoItems();\n'
CALL_SEAM=b'\n'+CALL+b'\nfunction showEquipmentLibrary'
JS_SEAM=b'\n\nfunction showEquipmentLibrary'
TAG=b'<script src="'+REL.encode()+b'"></script>\n'
MAIN=b'<script>\n\nconst Z40K_GENERIC_SHEET_BG'
RE=re.compile(rb'<script\b([^>]*)>([\s\S]*?)</script>',re.I)
def gitblob(data):
 return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
def pin(data,n,sha):
 assert len(data)==n and gitblob(data)==sha,(len(data),gitblob(data),n,sha)
def split_legacy(index):
 matched=[m for m in RE.finditer(index) if FIRST in m.group(2)]
 assert len(matched)==1,"one legacy equipment owner"
 m=matched[0];b=m.group(2)
 assert b.count(FIRST)==b.count(LAST)==1
 a=b.index(FIRST);end=b.index(LAST)
 assert a>0 and a<end and b[a:end].count(CALL_SEAM)==1
 assert b.count(b"\n"+CALL)==1,"original one top-level initial equipment refresh"
 chunk=b[a:end]
 js=chunk.replace(CALL_SEAM,JS_SEAM,1)
 assert js.count(b'function saveEquipmentEditor()')==1
 after=b[:a]+CALL+b[end:]
 modified=index[:m.start(2)]+after+index[m.end(2):]
 assert modified.count(MAIN)==1 and modified.count(TAG)==0
 modified=modified.replace(MAIN,TAG+MAIN,1)
 pin(modified,R04_N,R04);pin(js,JS_N,JS_SHA)
 return modified,js
def restore(index,js):
 pin(index,R04_N,R04);pin(js,JS_N,JS_SHA)
 assert index.count(TAG)==1 and js.count(JS_SEAM)==1
 before=index.replace(TAG,b"",1)
 # Adjacent boot-time refresh and exactly one untouched next owner boundary.
 needle=CALL+b"\n\n\n\n"+LAST
 assert before.count(needle)==1
 chunk=js.replace(JS_SEAM,CALL_SEAM,1)
 restored=before.replace(needle,chunk+LAST,1)
 pin(restored,R03_N,R03)
 return restored
def apply():
 assert not ASSET.exists(),"refuse overwriting existing asset"
 out,js=split_legacy(INDEX.read_bytes())
 ASSET.parent.mkdir(parents=True,exist_ok=True)
 ASSET.write_bytes(js);INDEX.write_bytes(out)
 verify()
def verify():
 index,js=INDEX.read_bytes(),ASSET.read_bytes()
 original=restore(index,js)
 assert split_legacy(original)==(index,js)
 print("R04 verified: 26 Builder functions, original init call retained, R03 exact rollback")
if __name__=="__main__":
 p=argparse.ArgumentParser()
 g=p.add_mutually_exclusive_group(required=True)
 g.add_argument("--check-source",action="store_true")
 g.add_argument("--apply",action="store_true")
 g.add_argument("--verify",action="store_true")
 a=p.parse_args()
 if a.check_source:
  source=INDEX.read_bytes();pin(source,R03_N,R03)
  out,js=split_legacy(source)
  assert restore(out,js)==source
  print("R04 source verified",gitblob(out),gitblob(js))
 elif a.apply: apply()
 else: verify()
