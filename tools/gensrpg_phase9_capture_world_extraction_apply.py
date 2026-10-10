#!/usr/bin/env python3
"""Phase 9: reversible, byte-pinned relocation of existing Capture world code.

No gameplay values, expressions, or storage keys are rewritten. This script may be
applied only to the exact verified work-branch index. --verify reconstructs the
pre-extraction index byte-for-byte from the extracted module.
"""
import argparse
import hashlib
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1] if pathlib.Path(__file__).parent.name == 'tools' else pathlib.Path(__file__).parent
INDEX = ROOT / 'index.html'
MODULE = ROOT / 'assets/gensrpg/capture/world-exploration-v1.js'
BRANCH = 'work/gensrpg-phase9-capture-world-exploration-extraction-2026-10-10'
SOURCE_LEN = 7975990
SOURCE_BLOB = '2f2edfa5a1e229e4630889e7f0d5442199e221eb'
INSERT_ANCHOR = b'<script src="assets/gensrpg/capture/hub-entry-v1.js?v=1"></script>\n'
LOAD_TAG = b'<script src="assets/gensrpg/capture/world-exploration-v1.js?v=1"></script>\n'
SEAMS = [
    (b'const GENS_CAPTURE_WORLD_KEY="gensrpg_capture_world_v1";', b'function captureCloseModal(id)'),
    (b'function captureDefaultLocations(){', b'function captureParticipantIds(){'),
    (b'function captureParticipantIds(){', b'function captureXpForDefeat('),
    (b'function renderCaptureWorldHub(){', b'const GENS_CAPTURE_NEXT_BATTLE_RULES_KEY='),
]
HEADER=b'// GenSrpG Capture World / Exploration V1 - byte-identical source relocation.\n// Classic script intentionally retains historical global API / function scope.\n'

def blob(data):
    return hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()

def check(condition, message):
    if not condition:
        raise RuntimeError(message)

def count_once(src, item, message):
    check(src.count(item) == 1, f'{message}: expected exactly one occurrence, found {src.count(item)}')

def split_source(data):
    chunks=[]
    tmp=data
    for i,(start,end) in enumerate(SEAMS,1):
        count_once(tmp,start,f'seam {i} start')
        count_once(tmp,end,f'seam {i} end')
        a=tmp.index(start); b=tmp.index(end,a)
        check(b>a,f'seam {i} boundaries out of order')
        chunk=tmp[a:b]
        chunks.append(chunk)
        tmp=tmp[:a]+tmp[b:]
    return tmp,chunks

def assemble_module(chunks):
    return HEADER+b''.join(b'// BEGIN_CAPTURE_WORLD_SECTION_'+str(i).encode()+b'\n'+part+b'// END_CAPTURE_WORLD_SECTION_'+str(i).encode()+b'\n' for i,part in enumerate(chunks,1))

def parse_module(data):
    check(data.startswith(HEADER),'external module header mismatch')
    chunks=[]
    rest=data[len(HEADER):]
    for i in range(1,len(SEAMS)+1):
        opening=b'// BEGIN_CAPTURE_WORLD_SECTION_'+str(i).encode()+b'\n'
        closing=b'// END_CAPTURE_WORLD_SECTION_'+str(i).encode()+b'\n'
        check(rest.startswith(opening),f'module section {i} start missing')
        rest=rest[len(opening):]
        check(closing in rest,f'module section {i} end missing')
        p,rest=rest.split(closing,1)
        chunks.append(p)
    check(not rest,'external module trailing content')
    return chunks

def restore(index, module):
    count_once(index,LOAD_TAG,'external load tag')
    without_load=index.replace(LOAD_TAG,b'',1)
    chunks=parse_module(module)
    for i in reversed(range(len(SEAMS))):
        start,end=SEAMS[i]
        count_once(without_load,end,f'rollback seam {i+1}')
        check(start not in without_load,f'legacy owner {i+1} still active in index')
        at=without_load.index(end)
        without_load=without_load[:at]+chunks[i]+without_load[at:]
    check(len(without_load)==SOURCE_LEN,'rollback size mismatch')
    check(blob(without_load)==SOURCE_BLOB,'rollback Git blob mismatch')
    return without_load

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--apply',action='store_true')
    ap.add_argument('--verify',action='store_true')
    args=ap.parse_args()
    check(args.apply != args.verify,'choose exactly --apply or --verify')
    data=INDEX.read_bytes()
    if args.apply:
        check(subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()==BRANCH,'wrong work branch')
        check(not MODULE.exists(),'world module already exists')
        check(len(data)==SOURCE_LEN and blob(data)==SOURCE_BLOB,'wrong source index, Rule 26 guard')
        count_once(data,INSERT_ANCHOR,'Capture Hub owner loader')
        clean,chunks=split_source(data)
        ext=assemble_module(chunks)
        clean=clean.replace(INSERT_ANCHOR,INSERT_ANCHOR+LOAD_TAG,1)
        check(restore(clean,ext)==data,'byte-exact rollback failed')
        MODULE.parent.mkdir(parents=True,exist_ok=True)
        MODULE.write_bytes(ext)
        INDEX.write_bytes(clean)
    else:
        check(MODULE.exists(),'missing world module')
        ext=MODULE.read_bytes()
        restore(data,ext)
    print({'mode':'apply' if args.apply else 'verify','source_blob':SOURCE_BLOB,'active_index_blob':blob(INDEX.read_bytes()),'active_index_bytes':INDEX.stat().st_size,'world_module_blob':blob(MODULE.read_bytes()),'world_module_bytes':MODULE.stat().st_size,'sections':len(SEAMS),'rollback_byte_exact':True})

if __name__=='__main__':main()
