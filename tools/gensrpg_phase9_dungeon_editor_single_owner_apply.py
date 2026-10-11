#!/usr/bin/env python3
"""Charte §§3, 17-21: replace UI masks with one Dungeon-editor Shell owner.

Four byte-pinned subtractions/substitutions: one existing authoritative mode,
one visibility writer and a matching guard on the actual editor entry. No new
identity API, DOM observer, wrapper, timer, game rule or persisted state.
The approved previous index was reconstructed byte-exactly from the user ZIP
and the Git patch, and verified against this branch's starting index blob.
"""
from pathlib import Path
import argparse
import hashlib
import os
import subprocess

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
BRANCH="work/gensrpg-phase9-dungeon-editor-single-owner-2026-10-11"
OLD_BYTES=7959154
OLD_BLOB="d19fb899e646ee97ec21d055b5271ac2cbba91a2"
NEW_BYTES=7958895
NEW_BLOB="91cdf82df453453a69e04900193517836c3969e6"
EDITS=[
(
 b'  const dae=document.getElementById("dungeonAdvancedEditorBtn");if(dae)dae.style.display=dungeon&&!window.GensCaptureV1?.isProfile?.(activeProfile)?"":"none";',
 b'  const dae=document.getElementById("dungeonAdvancedEditorBtn");if(dae)dae.style.display=gensMode151()==="dungeon"?"":"none";'
),
(
 b'  const dungeonBtn=document.getElementById("dungeonAdvancedEditorBtn");\n',
 b''
),
(
 b'  if(dungeonBtn)dungeonBtn.style.display=isRpg&&!window.GensCaptureV1?.isProfile?.(getActiveGameProfile?.())?"":"none";\n',
 b''
),
(
 b'function openDungeonAdvancedEditor(){\n  if(window.GensCaptureV1?.isProfile?.(getActiveGameProfile?.()))return;\n',
 b'function openDungeonAdvancedEditor(){\n  if(gensMode151()!=="dungeon")return;\n'
)
]
def blob(data):
    return hashlib.sha1(f"blob {len(data)}\0".encode()+data).hexdigest()
def require(v,msg):
    if not v:raise RuntimeError(msg)
def apply_bytes(source):
    require(len(source)==OLD_BYTES and blob(source)==OLD_BLOB,"incorrect exact source index")
    result=source
    for original,new in EDITS:
        require(result.count(original)==1,"owner seam not unique: "+repr(original[:80]))
        result=result.replace(original,new,1)
    require(len(result)==NEW_BYTES and blob(result)==NEW_BLOB,"new index fingerprint diverged")
    require(revert_bytes(result)==source,"full rollback not exact")
    return result
def revert_bytes(result):
    require(len(result)==NEW_BYTES and blob(result)==NEW_BLOB,"new active index unexpected")
    data=result
    for original,new in reversed(EDITS):
        if new:
            require(data.count(new)==1,"owner replacement not unique")
            data=data.replace(new,original,1)
        else:
            if original.startswith(b'  const dungeonBtn'):
                anchor=b'  if(survivalBtn)survivalBtn.style.display=isRpg?"none":"";\n'
                require(data.count(anchor)==1,"removed lookup restoration anchor not unique")
                data=data.replace(anchor,original+anchor,1)
            else:
                anchor=b'  if(rpgBtn)rpgBtn.style.display=isRpg?"":"none";\n'
                require(data.count(anchor)==1,"removed writer restoration anchor not unique")
                data=data.replace(anchor,anchor+original,1)
    require(len(data)==OLD_BYTES and blob(data)==OLD_BLOB,"rollback mismatched original current index")
    return data

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--apply",action="store_true")
    parser.add_argument("--verify",action="store_true")
    args=parser.parse_args()
    require(args.apply!=args.verify,"use exactly one action")
    if args.apply:
        require(os.environ.get("GENSRPG_SINGLE_OWNER_APPROVED")=="1","approval required")
        require(subprocess.check_output(["git","branch","--show-current"],cwd=ROOT,text=True).strip()==BRANCH,"work branch mismatch")
        INDEX.write_bytes(apply_bytes(INDEX.read_bytes()))
    else:
        revert_bytes(INDEX.read_bytes())
    print({"singleOwner":True,"indexBytes":INDEX.stat().st_size,"indexBlob":blob(INDEX.read_bytes()),"rollback":True})
if __name__=="__main__":
    main()
