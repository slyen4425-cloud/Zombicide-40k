#!/usr/bin/env python3
"""Phase 9: byte-exact, reversible Capture/Dungeon editor UI isolation.

Only three legacy index statements are changed. Never touches game rules, data,
the Dungeon builder implementation, Capture world or storage. Rule 26 source
provided by the user, and validated against the Git blob of the base commit.
"""
from pathlib import Path
import argparse
import hashlib
import os
import subprocess

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
BRANCH="work/gensrpg-phase9-capture-dungeon-editor-boundary-2026-10-11"
OLD_BYTES=7958968
OLD_BLOB="42583858f0df0f1b3bcd65ca6a282c8ba27b1c07"
NEW_BYTES=7959154
NEW_BLOB="d19fb899e646ee97ec21d055b5271ac2cbba91a2"
EDITS=[
 (
  b'  const dae=document.getElementById("dungeonAdvancedEditorBtn");if(dae)dae.style.display=dungeon?"":"none";',
  b'  const dae=document.getElementById("dungeonAdvancedEditorBtn");if(dae)dae.style.display=dungeon&&!window.GensCaptureV1?.isProfile?.(activeProfile)?"":"none";'
 ),
 (
  b'  if(dungeonBtn)dungeonBtn.style.display=isRpg?"":"none";',
  b'  if(dungeonBtn)dungeonBtn.style.display=isRpg&&!window.GensCaptureV1?.isProfile?.(getActiveGameProfile?.())?"":"none";'
 ),
 (
  b'function openDungeonAdvancedEditor(){\n  if(hasActiveSession())',
  b'function openDungeonAdvancedEditor(){\n  if(window.GensCaptureV1?.isProfile?.(getActiveGameProfile?.()))return;\n  if(hasActiveSession())'
 )
]

def git_blob(data):
    return hashlib.sha1(f"blob {len(data)}\0".encode()+data).hexdigest()

def require(condition,message):
    if not condition: raise RuntimeError(message)

def apply_bytes(data):
    require(len(data)==OLD_BYTES and git_blob(data)==OLD_BLOB,"unexpected source index; charte §26")
    patched=data
    for old,new in EDITS:
        require(patched.count(old)==1,"source UI seam not unique")
        patched=patched.replace(old,new,1)
    require(len(patched)==NEW_BYTES and git_blob(patched)==NEW_BLOB,"unexpected patched index")
    require(restore_bytes(patched)==data,"index rollback not byte exact")
    return patched

def restore_bytes(data):
    require(len(data)==NEW_BYTES and git_blob(data)==NEW_BLOB,"unexpected edited index")
    original=data
    for old,new in reversed(EDITS):
        require(original.count(new)==1,"edited UI seam not unique")
        original=original.replace(new,old,1)
    require(len(original)==OLD_BYTES and git_blob(original)==OLD_BLOB,"index rollback differs from approved source")
    return original

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--apply",action="store_true")
    ap.add_argument("--verify",action="store_true")
    a=ap.parse_args()
    require(a.apply != a.verify,"must select --apply or --verify")
    if a.apply:
        require(os.environ.get("GENSRPG_CAPTURE_EDITOR_APPROVED")=="1","explicit approval missing")
        actual=subprocess.check_output(["git","branch","--show-current"],cwd=ROOT,text=True).strip()
        require(actual==BRANCH,"wrong work branch")
        new=apply_bytes(INDEX.read_bytes())
        INDEX.write_bytes(new)
    else:
        restore_bytes(INDEX.read_bytes())
    print({"scenario":"Capture/Dungeon editor boundary","mode":"apply" if a.apply else "verify","index_blob":git_blob(INDEX.read_bytes()),"index_bytes":INDEX.stat().st_size,"rollback_byte_exact":True,"changes":3})

if __name__=="__main__":
    main()
