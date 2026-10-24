#!/usr/bin/env python3
"""Guarded one-shot historical-test migration for R05. NEVER rewrite gameplay/runtime source.
Requires exact R05 code/asset hashes; retains byte-exact old fixtures.
"""
import hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
R04="554bf6100aeb0f40bfc098dc90863af7d2d5e439"
R05="485de2e6a08ffd89e4f1fb9410e40c938774d62f"
REL="assets/gensrpg/core/legacy-cloud-sync-backup-v1.js"
def hash(b):return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
assert hash((ROOT/"index.html").read_bytes())==R05
assert hash((ROOT/REL).read_bytes())=="8d7f8179676b096a53816cd1ca2530c120e3cf18"
def change(path,*pairs):
 p=ROOT/path;s=p.read_text()
 for old,new in pairs:
  assert s.count(old)==1,(path,repr(old[:110]),s.count(old))
  s=s.replace(old,new,1)
 assert s!=p.read_text(),path
 p.write_text(s)
 print("R05 guarded test update:",path)
def replace_lines(path,func):
 p=ROOT/path;s=p.read_text();changed=func(s)
 assert changed!=s,p
 p.write_text(changed)
 print("R05 guarded test update:",path)

change("tests/helpers/gens_phase12_r04_r03_source_view_v1.cjs",
 (' if(gitblob(index)===R03){assert.equal(index.length,2862906);return index;}',
  ' if(gitblob(index)===R03){assert.equal(index.length,2862906);return index;}\n if(gitblob(index)==="'+R05+'")index=require("./gens_phase12_r05_r04_source_view_v1.cjs")(index,root);'))
change("tests/helpers/gens_phase12_r03_r02_source_view_v1.cjs",
 ('if(hash(index)==="'+R04+'")index=require("./gens_phase12_r04_r03_source_view_v1.cjs")(index,root);',
  'if(["'+R04+'","'+R05+'"].includes(hash(index)))index=require("./gens_phase12_r04_r03_source_view_v1.cjs")(index,root);'))
change("tests/helpers/gens_phase12_r02_r01_source_view_v1.cjs",
 ('"'+R04+'"].includes(hash(index))','"'+R04+'","'+R05+'"].includes(hash(index))'))
change("tests/helpers/gens_capture_team_roster_snapshot_v1.cjs",
 (" if(hash(index)==='"+R04+"')index=require('./gens_phase12_r04_r03_source_view_v1.cjs')(index,root);",
  " if(hash(index)==='"+R05+"')index=require('./gens_phase12_r05_r04_source_view_v1.cjs')(index,root);\n if(hash(index)==='"+R04+"')index=require('./gens_phase12_r04_r03_source_view_v1.cjs')(index,root);"))
change("tests/helpers/gens_phase12_core200_source_view_v1.cjs",
 ('"'+R04+'"].includes(sha(actual))','"'+R04+'","'+R05+'"].includes(sha(actual))'))
change("tools/gensrpg_phase12_r01_d9_source_view.py",
 ('    if _blob(data)=="'+R04+'":',
  '    if _blob(data)=="'+R05+'":\n        from gensrpg_phase12_r05_core_cloud_sync_extract_apply import reverse as r05_reverse\n        module=(Path(root)/"'+REL+'").read_bytes()\n        data=r05_reverse(data,module) # strict R05 -> R04 historical-only\n    if _blob(data)=="'+R04+'":'))
def extend_core01(s):
 lines=s.splitlines(keepends=True);n=0
 for i,line in enumerate(lines):
  if 'if blob(INDEX.read_bytes())' not in line or R04 not in line:continue
  if ' in (' in line:
   old='"'+R04+'")';assert old in line
   lines[i]=line.replace(old,'"'+R04+'","'+R05+'")',1)
  else:
   old='=="'+R04+'"';assert old in line
   lines[i]=line.replace(old,' in ("'+R04+'","'+R05+'")',1)
  n+=1
 assert n==4,("existing R01-R04 source guards",n)
 s=''.join(lines)
 mark='            assert updated.count(expected_after)==1, f"{path}: R01 owner graph expected {expected_after!r}; found {updated.count(expected_after)} copies"'
 assert s.count(mark)==1
 addition=('            # R05 one more Core production owner; old snapshot fingerprints remain strict.\n'
           '            if blob(INDEX.read_bytes())=="'+R05+'":\n'
           '                if path in (PATH_OWNERS,PATH_GLOBALS):\n'
           '                    expected_after="'+R05+'"\n'
           '                elif path==PATH_GRAPH:\n'
           '                    for former,current in [\n'
           '                        ("size,62,","size,63,"),\n'
           '                        ("allJs.length,120,","allJs.length,121,"),\n'
           '                        ("reachable.size,106,","reachable.size,107,")\n'
           '                    ]:\n'
           '                        expected_after=expected_after.replace(former,current)\n')
 return s.replace(mark,addition+mark,1)
replace_lines("tools/gensrpg_phase12_dungeon_core01_extract_apply.py",extend_core01)
change("tests/gens_phase12_r04_builders_equipment_extraction_v1.test.cjs",
 ('i=read("index.html"),rel=', 'i=require("./helpers/gens_phase12_r05_r04_source_view_v1.cjs")(read("index.html"),root),rel='),
 ('cp.execFileSync("python3",["tools/gensrpg_phase12_r04_builders_equipment_extract_apply.py","--verify"],{cwd:root});',
  'const r03=require("./helpers/gens_phase12_r04_r03_source_view_v1.cjs")(i,root);assert.equal(sha(r03),"8faf7af7fced0a1e0724985e85718a0e4a9e673b");'))
change("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs",
 ("const CURRENT_INDEX_BLOB='"+R04+"';","const CURRENT_INDEX_BLOB='"+R05+"';"))
change("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs",
 ("const CURRENT_BLOB='"+R04+"';","const CURRENT_BLOB='"+R05+"';"))
anchor="  'assets/gensrpg/builders/equipment-library-editor-v1.js',\n  'assets/gensrpg/dungeon/mj72-scene-v1.js',"
added="  'assets/gensrpg/builders/equipment-library-editor-v1.js',\n  '"+REL+"',\n  'assets/gensrpg/dungeon/mj72-scene-v1.js',"
change("tests/gens_runtime_composition_guard_v11411.test.cjs",(anchor,added))
change("tests/gens_phase2_runtime_load_graph_v11411.test.cjs",
 (anchor,added),
 ("assert.equal(new Set(productionDirect).size,62","assert.equal(new Set(productionDirect).size,63"),
 ('const phase12ConnectedServices=["assets/gensrpg/builders/equipment-library-editor-v1.js"];',
  'const phase12ConnectedServices=["assets/gensrpg/builders/equipment-library-editor-v1.js","'+REL+'"];'),
 ("assert.equal(allJs.length,120","assert.equal(allJs.length,121"),
 ("assert.equal(reachable.size,106","assert.equal(reachable.size,107"))
change("tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs",
 ("assert.equal(reachable.size,106","assert.equal(reachable.size,107"),
 ("assert.equal(mapped.size,106","assert.equal(mapped.size,107"))
for file in ["tests/gens_phase2_runtime_side_effect_inventory_v11411.test.cjs","tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs"]:
 change(file,("assert.equal(reachable.size,106","assert.equal(reachable.size,107"))
change("tests/gens_phase3_target_structure_contracts_v1.test.cjs",
 ("assert.equal(Object.keys(ownerManifest.files||{}).length,106","assert.equal(Object.keys(ownerManifest.files||{}).length,107"),
 ("assert.equal(ownerManifest.files?.['assets/gensrpg/builders/equipment-library-editor-v1.js']?.domain,'builders',",
  "assert.equal(ownerManifest.files?.['"+REL+"']?.domain,'core',\n  'R05 cloud-sync/local-backup must have a sole Core owner');\nassert.equal(composition.index.split('"+REL+"').length-1,1,\n  'R05 Core cloud-sync owner must load once synchronously');\nassert.equal(ownerManifest.files?.['assets/gensrpg/builders/equipment-library-editor-v1.js']?.domain,'builders',"))
print("R05 historical fixtures updated: full rollback chain and graph counts only")
