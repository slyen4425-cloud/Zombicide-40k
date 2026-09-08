#!/usr/bin/env python3
"""GenSrpG V16.78.99 — install the shared statistic service in the final page.

This no longer rewrites or duplicates Dungeon statistic renderers. The original Dungeon
functions stay intact in index.html and are adapted at runtime by the shared service.
Dungeon classic and authored/Builder runtimes remain separate.
"""
from __future__ import annotations
import sys
from pathlib import Path

VERSION="16.78.99"
TAG='<script src="assets/gensrpg/gens-stat-service-167899.js?v=167899"></script>'
MARKER='gens-stat-service-167899.js?v=167899'


def patch_text(html:str)->str:
    if MARKER in html:
        return html
    if '</body>' not in html:
        raise RuntimeError('V16.78.99: closing </body> missing')
    return html.replace('</body>',TAG+'\n</body>',1)


def main()->int:
    if len(sys.argv)!=2:
        print('usage: patch_generic_stat_grid_v167890.py <index.html>',file=sys.stderr)
        return 2
    path=Path(sys.argv[1])
    path.write_text(patch_text(path.read_text(encoding='utf-8')),encoding='utf-8')
    print(f'GenSrpG V{VERSION}: shared statistic service installed')
    return 0

if __name__=='__main__':
    raise SystemExit(main())
