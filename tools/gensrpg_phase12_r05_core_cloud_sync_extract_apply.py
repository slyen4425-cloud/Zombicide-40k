#!/usr/bin/env python3
"""R05: source-pinned reversible relocation of the ONE Core online-sync/local-backup script.
Keep all original initialization side effects and listeners, unchanged and parser-synchronous.
"""
import argparse,hashlib,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
REL="assets/gensrpg/core/legacy-cloud-sync-backup-v1.js"
ASSET=ROOT/REL
R04_LEN=2835125
R04_SHA="554bf6100aeb0f40bfc098dc90863af7d2d5e439"
R05_LEN=2781436
R05_SHA="485de2e6a08ffd89e4f1fb9410e40c938774d62f"
JS_LEN=53746
JS_SHA="8d7f8179676b096a53816cd1ca2530c120e3cf18"
TAG=b'<script src="'+REL.encode()+b'"></script>'
REGEX=re.compile(rb"<script\b([^>]*)>([\s\S]*?)</script>",re.I)
FIRST=b"\nconst Z40K_SUPABASE_URL = "
def sha(b):return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
def pin(b,n,h):assert len(b)==n and sha(b)==h,(len(b),sha(b),n,h)
def transform(source):
 pin(source,R04_LEN,R04_SHA)
 hits=[m for m in REGEX.finditer(source) if m.group(2).startswith(FIRST)]
 assert len(hits)==1,"exactly one active Core cloud-sync-and-backup script"
 m=hits[0]
 assert not m.group(1).strip(),"original script has classic synchronous semantics"
 body=m.group(2);pin(body,JS_LEN,JS_SHA)
 assert body.count(b"gensrpgRecoverThenCompactBackups();")==1,"one startup backup-recovery call"
 assert body.count(b"window.addEventListener('DOMContentLoaded', async()=>")==1,"one original online rejoin listener"
 assert source.count(TAG)==0
 output=source[:m.start()]+TAG+source[m.end():]
 pin(output,R05_LEN,R05_SHA)
 return output,body
def reverse(index,js):
 pin(index,R05_LEN,R05_SHA);pin(js,JS_LEN,JS_SHA)
 assert index.count(TAG)==1
 recovered=index.replace(TAG,b"<script>"+js+b"</script>",1)
 pin(recovered,R04_LEN,R04_SHA)
 return recovered
def verify():
 from gensrpg_phase12_generated_wall_history import historical_r05_view
 index=historical_r05_view(INDEX.read_bytes());js=ASSET.read_bytes()
 before=reverse(index,js)
 assert transform(before)==(index,js)
 assert index.index(b"const Z40K_GENERIC_SHEET_BG")<index.index(TAG)<index.index(b'const Z40K_APP_VERSION')
 print("R05 verified: byte-identical cloud sync/local backup, parser order, R04 rollback")
def apply():
 assert not ASSET.exists(),"refuse overwriting an existing Core owner"
 index,js=transform(INDEX.read_bytes())
 ASSET.parent.mkdir(parents=True,exist_ok=True)
 ASSET.write_bytes(js);INDEX.write_bytes(index)
 verify()
if __name__=="__main__":
 p=argparse.ArgumentParser();g=p.add_mutually_exclusive_group(required=True)
 g.add_argument("--check-source",action="store_true");g.add_argument("--apply",action="store_true");g.add_argument("--verify",action="store_true")
 a=p.parse_args()
 if a.check_source:
  src=INDEX.read_bytes();out,js=transform(src)
  assert reverse(out,js)==src
  print("R05 source pinned and reversible",sha(out),sha(js))
 elif a.apply:apply()
 else:verify()
