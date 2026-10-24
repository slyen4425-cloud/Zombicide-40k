#!/usr/bin/env python3
"""Phase 9: move existing Capture battle core without rewriting expressions.

Only the pinned 2026-10-11 team-roster functional GREEN can be used as source.
The reverse operation must reproduce the source Git blob exactly.
"""
from pathlib import Path
import hashlib
import subprocess
import argparse
ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/'index.html'
MODULE=ROOT/'assets/gensrpg/capture/combat-core-v1.js'
BRANCH='work/gensrpg-phase9-capture-combat-owner-extraction-2026-10-11'
BASE_BYTES=7950873
BASE_BLOB='57415a1071475cc10f0c79e092897190577127e8'
LOAD_ANCHOR=b'<script src="assets/gensrpg/capture/team-roster-v1.js?v=1"></script>\n'
LOAD_TAG=b'<script src="assets/gensrpg/capture/combat-core-v1.js?v=1"></script>\n'
START=b'const GENS_CAPTURE_BATTLE_TARGETS=[\n'
END=b'function gensRollLocationEncounter(locationId){\n'
HEADER=b'// GenSrpG Phase9 Capture battle core - identical legacy source relocation.\n// Classic script to retain original global lexical/function contract.\n// BEGIN_CAPTURE_BATTLE_CORE\n'
FOOTER=b'// END_CAPTURE_BATTLE_CORE\n'

def blob(src):return hashlib.sha1(b'blob '+str(len(src)).encode()+b'\0'+src).hexdigest()
def require(c,s):
    if not c:raise RuntimeError(s)
def once(src,pattern,name):
    n=src.count(pattern)
    require(n==1,f'{name}: expected 1, got {n}')
def apply_bytes(src):
    require(len(src)==BASE_BYTES and blob(src)==BASE_BLOB,'wrong source under charter 26')
    for pat,name in [(START,'core start'),(END,'core end'),(LOAD_ANCHOR,'team loader')]:once(src,pat,name)
    a=src.index(START);b=src.index(END,a)
    require(b>a,'wrong combat core boundaries')
    region=src[a:b]
    require(b'const GENS_CAPTURE_BATTLE_SAVE_KEY=' in region,'battle save owner absent')
    require(b'function gensCaptureBattleEvaluateVictory(' in region,'battle victory owner absent')
    require(b'function gensCaptureBattleTargets(' in region,'battle targets owner absent')
    module=HEADER+region+FOOTER
    index=src[:a]+src[b:]
    index=index.replace(LOAD_ANCHOR,LOAD_ANCHOR+LOAD_TAG,1)
    require(restore_bytes(index,module)==src,'byte-exact rollback failed')
    return index,module

def restore_bytes(index,module):
    once(index,LOAD_TAG,'loader')
    require(module.startswith(HEADER) and module.endswith(FOOTER),'foreign battle owner module')
    piece=module[len(HEADER):-len(FOOTER)]
    require(piece.startswith(START),'start of external core mismatch')
    index=index.replace(LOAD_TAG,b'',1)
    once(index,END,'restore end seam')
    require(START not in index,'duplicate owner remains inline')
    i=index.index(END)
    src=index[:i]+piece+index[i:]
    require(len(src)==BASE_BYTES and blob(src)==BASE_BLOB,'rollback blob mismatch')
    return src

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--verify',action='store_true');arg=parser.parse_args()
    require(arg.apply != arg.verify,'select one mode')
    if arg.apply:
        require(subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()==BRANCH,'wrong work branch')
        require(not MODULE.exists(),'existing battle core module')
        index,module=apply_bytes(INDEX.read_bytes())
        MODULE.parent.mkdir(parents=True,exist_ok=True)
        MODULE.write_bytes(module);INDEX.write_bytes(index)
    else:
        require(MODULE.exists(),'missing combat core module')
        restore_bytes(INDEX.read_bytes(),MODULE.read_bytes())
    print({'mode':'apply' if arg.apply else 'verify','sourceBlob':BASE_BLOB,'activeIndexBytes':INDEX.stat().st_size,'activeIndexBlob':blob(INDEX.read_bytes()),'moduleBytes':MODULE.stat().st_size,'moduleBlob':blob(MODULE.read_bytes()),'rollbackByteExact':True})
if __name__=='__main__':
    main()
