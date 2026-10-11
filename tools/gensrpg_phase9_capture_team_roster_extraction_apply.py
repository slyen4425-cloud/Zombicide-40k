#!/usr/bin/env python3
"""Byte-pinned, subtractive relocation of the existing Capture team/reserve owner.

The legacy bodies are copied without semantic changes to one synchronous classic
script. --verify proves byte-for-byte source restoration from the new two files.
No storage format or gameplay default is rewritten.
"""
from pathlib import Path
import argparse
import hashlib
import subprocess

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'index.html'
MODULE = ROOT / 'assets/gensrpg/capture/team-roster-v1.js'
BRANCH = 'work/gensrpg-phase9-capture-team-roster-extraction-2026-10-11'
BASE_BYTES = 7959089
BASE_BLOB = 'e777d484ab10049650440fee04f47cf2dfdc3043'
ANCHOR = b'<script src="assets/gensrpg/capture/world-exploration-v1.js?v=1"></script>\n'
LOAD_TAG = b'<script src="assets/gensrpg/capture/team-roster-v1.js?v=1"></script>\n'
SEAMS = [
    (b'function captureActiveHeroId(){', b'function captureXpForDefeat('),
    (b'function captureFindOwnedCreature(uid){', b'function captureCreatureDerivedStats('),
    (b'function ensureHeroCreatureState(st){', b'function gensPureCaptureSheetMode(){'),
    (b'function captureCreatureCardHtml(inst,where,index){', b'function renderCaptureHeroInventory(){'),
    (b'function creatureCanEvolveInstance(inst){', b'function openCreatureCapture(){'),
]
HEADER = (b'// GenSrpG Phase 9 Capture Team / Reserve V1: physically moved legacy owner.\n'
          b'// Classic synchronous script: original global API, persisted keys, and rules unchanged.\n')

def blob(raw):
    return hashlib.sha1(f'blob {len(raw)}\0'.encode() + raw).hexdigest()

def require(ok, reason):
    if not ok:
        raise RuntimeError(reason)

def once(raw, needle, label):
    n = raw.count(needle)
    require(n == 1, f'{label} must occur exactly once, found {n}')

def extract(raw):
    parts = []
    cleaned = raw
    for i, (start, end) in enumerate(SEAMS, 1):
        once(cleaned, start, f'seam {i} start')
        once(cleaned, end, f'seam {i} end')
        a = cleaned.index(start)
        b = cleaned.index(end, a + len(start))
        require(b > a, f'seam {i} order')
        parts.append(cleaned[a:b])
        cleaned = cleaned[:a] + cleaned[b:]
    return cleaned, parts

def module_bytes(parts):
    return HEADER + b''.join(
        b'// BEGIN_CAPTURE_TEAM_SECTION_' + str(i).encode() + b'\n'
        + part + b'// END_CAPTURE_TEAM_SECTION_' + str(i).encode() + b'\n'
        for i, part in enumerate(parts, 1)
    )

def parse_module(raw):
    require(raw.startswith(HEADER), 'module header mismatch')
    remainder = raw[len(HEADER):]
    sections = []
    for i in range(1, len(SEAMS)+1):
        start = b'// BEGIN_CAPTURE_TEAM_SECTION_' + str(i).encode() + b'\n'
        end = b'// END_CAPTURE_TEAM_SECTION_' + str(i).encode() + b'\n'
        require(remainder.startswith(start), f'module section {i} start mismatch')
        remainder = remainder[len(start):]
        require(end in remainder, f'module section {i} end missing')
        part, remainder = remainder.split(end, 1)
        sections.append(part)
    require(not remainder, 'module unexpected trailing content')
    return sections

def restore(index, module):
    once(index, LOAD_TAG, 'team script')
    without = index.replace(LOAD_TAG, b'', 1)
    sections = parse_module(module)
    for i in reversed(range(len(SEAMS))):
        start, end = SEAMS[i]
        once(without, end, f'rollback seam {i+1}')
        require(start not in without, f'old owner seam {i+1} still inline')
        at = without.index(end)
        without = without[:at] + sections[i] + without[at:]
    require(len(without) == BASE_BYTES, 'source size mismatch after rollback')
    require(blob(without) == BASE_BLOB, 'source blob mismatch after rollback')
    return without

def apply_bytes(raw):
    require(len(raw) == BASE_BYTES and blob(raw) == BASE_BLOB, 'wrong exact source index / Rule 26')
    once(raw, ANCHOR, 'world owner loader')
    no_team, parts = extract(raw)
    ext = module_bytes(parts)
    patched = no_team.replace(ANCHOR, ANCHOR + LOAD_TAG, 1)
    require(restore(patched, ext) == raw, 'rollback byte-exact proof failed')
    return patched, ext

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--verify', action='store_true')
    args = ap.parse_args()
    require(args.apply != args.verify, 'exactly one of --apply / --verify required')
    if args.apply:
        require(subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip() == BRANCH, 'wrong branch')
        require(not MODULE.exists(), 'team owner already extracted')
        patched, ext = apply_bytes(INDEX.read_bytes())
        MODULE.parent.mkdir(parents=True, exist_ok=True)
        MODULE.write_bytes(ext)
        INDEX.write_bytes(patched)
    else:
        require(MODULE.exists(), 'team owner missing')
        restore(INDEX.read_bytes(), MODULE.read_bytes())
    print({'mode':'apply' if args.apply else 'verify', 'sourceBlob': BASE_BLOB,
           'activeIndexBytes':INDEX.stat().st_size, 'activeIndexBlob':blob(INDEX.read_bytes()),
           'moduleBytes':MODULE.stat().st_size, 'moduleBlob':blob(MODULE.read_bytes()),
           'parts':len(SEAMS), 'rollbackByteExact':True})

if __name__ == '__main__':
    main()
