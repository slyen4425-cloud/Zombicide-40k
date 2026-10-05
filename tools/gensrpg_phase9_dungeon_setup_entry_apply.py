from pathlib import Path
import json,hashlib,re,subprocess

OLD_BLOB="37056722bb0a27f96e26b3ef3b05e9543dc5a223"
OLD_SIZE=8166377
NEW_BLOB="1e3398755beb751786d825047bc60fe1a7179d79"
NEW_SIZE=8165906
def blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
def write(path,text):
    Path(path).write_bytes(text.encode("utf-8"))
data=Path("index.html").read_bytes()
assert len(data)==OLD_SIZE and blob(data)==OLD_BLOB,"Rule 26 base drifted"
fixture=json.loads(Path("tests/fixtures/phase9_dungeon_setup_entry_before_transfer_v1.json").read_bytes())
source=data.decode("utf-8")
guard='try{const p=getActiveGameProfile?.();if(window.GensCaptureV1?.isProfile?.(p)||p?.gameStyle!=="dungeon")return;}catch(e){return;}'
native=fixture["native"]
new_native=native.replace("function openSessionDungeonSetup(){","function openSessionDungeonSetup(){"+guard)
for old in [native,fixture["removed137"],fixture["removed151"]]:
    assert source.count(old)==1,"ambiguous runtime seam"
updated=source.replace(native,new_native).replace(fixture["removed137"],"").replace(fixture["removed151"],"")
updated_bytes=updated.encode("utf-8")
assert len(updated_bytes)==NEW_SIZE and blob(updated_bytes)==NEW_BLOB,"deterministic result drifted"
Path("index.html").write_bytes(updated_bytes)

CUSTOM_EDITS={'tests/gens_phase9_capture_dungeon_setup_entry_ownership_characterization_v1.test.cjs': [['const c137=block(\'captureFix137\');\nconst c151=block(\'gensStability151\');\nconst guard137=exactBetween(c137,\'window.openSessionDungeonSetup=(function(old){\',\'\\n\\n/* ---------- multiplicateurs XP / or\');\nconst mode151=exactBetween(c151,\'window.gensMode151=function(){\',\'\\n\\nwindow.dungeonMjRules151\');\nconst guard151=exactBetween(c151,\'const openD151=window.openSessionDungeonSetup;\',\'\\n\\n/* Premier affichage. */\');\n\nassert.match(native,/if\\(!isDungeonMode\\(\\)\\)return;/);\nassert.doesNotMatch(native,/GensCaptureV1|gensCapturePregameMode|gensMode151/,\n  \'pre-audit must expose the native owner lacking its own canonical Capture exclusion\');\nassert.match(guard137,/gensCapturePregameMode\\(\\)/);\nassert.match(mode151,/GensCaptureV1\\?\\.isProfile\\?\\.\\(p\\)/);\nassert.match(guard151,/gensMode151\\(\\)!=="dungeon"/);\nassert.ok(index.indexOf(\'function openSessionDungeonSetup(){\')<index.indexOf(\'<script id="captureFix137">\'));\nassert.ok(index.indexOf(\'<script id="captureFix137">\')<index.indexOf(\'<script id="gensStability151">\'));\n\n', 'const c137=block(\'captureFix137\');\nconst c151=block(\'gensStability151\');\nassert.match(native,/if\\(!isDungeonMode\\(\\)\\)return;/);\nassert.match(native,/GensCaptureV1\\?\\.isProfile\\?\\.\\(p\\)/,\n  \'native owner must now exclude canonical Capture directly\');\nassert.match(native,/p\\?\\.gameStyle!=="dungeon"/,\n  \'native owner must retain the complete historical V151 Dungeon gate\');\nassert.doesNotMatch(c137,/openSessionDungeonSetup/);\nassert.doesNotMatch(c151,/openD151|openSessionDungeonSetup/);\nassert.doesNotMatch(index,/window\\.openSessionDungeonSetup\\s*=/,\n  \'both former module wrappers must stay retired\');\n\n'], ['function execute(profile,layers){', 'function execute(profile){'], ["dungeonIdentity+'\\n'+captureIdentity+'\\n'+native+'\\n'+mode151", "dungeonIdentity+'\\n'+captureIdentity+'\\n'+native"], ["  if(layers.includes('137'))vm.runInContext(guard137,context,{filename:'captureFix137.setup-guard.js'});\n  if(layers.includes('151'))vm.runInContext(guard151,context,{filename:'gensStability151.setup-guard.js'});\n", ''], ["const evidence=[];\nfor(const item of cases){\n  const nativeResult=execute(item.profile,[]);\n  const capture137=execute(item.profile,['137']);\n  const full=execute(item.profile,['137','151']);\n  const without137=execute(item.profile,['151']);\n  assert.equal(nativeResult.entered,item.native,item.name+' / native owner');\n  assert.equal(capture137.entered,item.capture137,item.name+' / Capture137 guard');\n  assert.equal(full.entered,item.final,item.name+' / full production chain');\n  assert.equal(without137.entered,full.entered,item.name+' / Capture137 is redundant behind V151');\n  assert.deepEqual(without137.effects,full.effects,item.name+' / same native effects without Capture137');\n  if(item.name.includes('Capture')){\n    assert.deepEqual(full.trace,['profile'],\n      'V151 must reject canonical Capture before reaching Capture137, Dungeon identity or native UI');\n  }\n  evidence.push({name:item.name,nativeEntered:nativeResult.entered,capture137Entered:capture137.entered,\n    productionEntered:full.entered,without137Entered:without137.entered,productionTrace:full.trace});\n}\n\nassert.equal(evidence.find(x=>x.name==='historical Capture with Dungeon style').nativeEntered,true,\n  'removing both wrappers without moving the guard into the native owner would regress historical Capture');\n\nconsole.log(JSON.stringify({\n  scenario:'Phase 9 Dungeon setup entry ownership characterization',\n  rule26:{bytes:bytes.length,blob},\n  chain:['native openSessionDungeonSetup','captureFix137','gensStability151'],\n  evidence,\n  decision:'Move the full V151 entry predicate into the native pregame owner, preserve isDungeonMode(), then retire both wrappers in a separate TDD lot',\n  runtimeChanged:false\n},null,2));\n", "const evidence=[];\nfor(const item of cases){\n  const result=execute(item.profile);\n  assert.equal(result.entered,item.final,item.name+' / native production owner preserves the pre-audit final contract');\n  if(item.name.includes('Capture')){\n    assert.deepEqual(result.trace,['profile'],\n      'native owner must reject canonical Capture before Dungeon identity or UI');\n  }\n  evidence.push({name:item.name,productionEntered:result.entered,productionTrace:result.trace});\n}\n\nassert.ok(fs.existsSync(path.join(root,'tests/gens_phase9_capture_dungeon_setup_entry_owner_transfer_v1.test.cjs')),\n  'the immutable old-chain comparison and exact inverse-runtime proof must remain available');\nconsole.log(JSON.stringify({\n  scenario:'Phase 9 Dungeon setup entry production parity after ownership transfer',\n  rule26:{bytes:bytes.length,blob},\n  chain:['native openSessionDungeonSetup'],\n  retiredWrappers:['captureFix137','gensStability151'],\n  evidence,\n  decision:'Native pregame owner preserves the complete historical production predicate; both former wrappers remain retired'\n},null,2));\n"]], 'tests/gens_phase9_capture_dungeon_button_owner_transfer_v1.test.cjs': [["assert.match(c137,/openSessionDungeonSetup/,\n  'Capture137 dedicated guard around Dungeon setup remains protected in this seam');\nassert.match(c151,/const openD151=window\\.openSessionDungeonSetup/,\n  'Stability151 inverse Dungeon/Capture guard remains protected in this seam');", "assert.doesNotMatch(c137,/openSessionDungeonSetup/,\n  'Capture137 entry guard was transferred to the native owner in the dedicated follow-up seam');\nassert.doesNotMatch(c151,/openD151|openSessionDungeonSetup/,\n  'Stability151 entry guard was transferred to the native owner in the dedicated follow-up seam');\nassert.match(fn('openSessionDungeonSetup'),/GensCaptureV1\\?\\.isProfile\\?\\.\\(p\\)/,\n  'native setup owner must retain the canonical Capture guard');"], ["protectedGuards:['captureFix137.openSessionDungeonSetup','gensStability151.openSessionDungeonSetup']", "protectedGuards:['native openSessionDungeonSetup']"]], 'tests/gens_phase9_capture_pregame_ownership_raccord_v1.test.cjs': [["assert.match(c137,/openSessionDungeonSetup/,\n  'Capture137 must retain its dedicated guard around openSessionDungeonSetup in this first ownership seam');", "assert.doesNotMatch(c137,/openSessionDungeonSetup/,\n  'Capture137 setup guard was transferred to the native owner in its dedicated follow-up seam');\nassert.match(fn('openSessionDungeonSetup'),/GensCaptureV1\\?\\.isProfile\\?\\.\\(p\\)/,\n  'native setup owner must retain the canonical Capture exclusion');"], ['capture137DungeonSetupGuardPreserved:true', 'nativeDungeonSetupGuardPreserved:true']], 'tests/gens_phase2_inline_global_last_owner_v11411.test.cjs': [['assert.equal(distinctGlobals,431,', 'assert.equal(distinctGlobals,430,'], ['assert.equal(assignments,746,', 'assert.equal(assignments,744,'], ['assert.equal(multiOwnerGlobals,116,', 'assert.equal(multiOwnerGlobals,115,']], 'tests/gens_phase2_layered_responsibilities_v11411.test.cjs': [['assert.equal(rows.size,431,', 'assert.equal(rows.size,430,']], 'docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv': [['# distinctGlobals=431 assignments=746 multiOwnerGlobals=116', '# distinctGlobals=430 assignments=744 multiOwnerGlobals=115'], ['openSessionDungeonSetup\t2\tgensStability151\n', '']], 'docs/GENSRPG_PHASE2_INLINE_OWNERS.json': [['Capture centralized MJ rules and Capture/Dungeon pregame separation', 'Capture centralized MJ rules, XP multipliers and Capture Hub UI'], ['Cross-mode stability boundary for Capture/Dungeon setup and Dungeon MJ settings', 'Cross-mode UI reconciliation and Dungeon MJ settings; native pregame owns Dungeon setup entry']]}

for name,pairs in CUSTOM_EDITS.items():
    text=Path(name).read_bytes().decode("utf-8")
    for old,new in pairs:
        assert text.count(old)==1,(name,"obsolete expectation drifted",old)
        text=text.replace(old,new)
    write(name,text)

repinned_tests=[]
for path in sorted(Path("tests").rglob("*.test.cjs")):
    text=path.read_bytes().decode("utf-8")
    updated=text.replace(OLD_BLOB,NEW_BLOB).replace(str(OLD_SIZE),str(NEW_SIZE))
    if text!=updated:
        write(path,updated);repinned_tests.append(str(path))
assert len(repinned_tests)==102,("baseline test count drifted",len(repinned_tests))

repinned_docs=[]
for path in sorted(Path("docs").rglob("*")):
    if not path.is_file():continue
    try:text=path.read_bytes().decode("utf-8")
    except UnicodeDecodeError:continue
    updated="".join(line.replace(OLD_BLOB,NEW_BLOB) if "sourceIndexBlob" in line else line for line in text.splitlines(keepends=True))
    if text!=updated:
        write(path,updated);repinned_docs.append(str(path))
assert set(repinned_docs)=={
    "docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv",
    "docs/GENSRPG_PHASE2_INLINE_OWNERS.json",
    "docs/GENSRPG_PHASE2_LAYERED_RESPONSIBILITIES.json",
    "docs/GENSRPG_PHASE2_STORAGE_OWNERS.json",
    "docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json"
},("sourceIndexBlob scope drifted",repinned_docs)
print(json.dumps({"runtime":{"bytes":NEW_SIZE,"blob":NEW_BLOB},"customFiles":list(CUSTOM_EDITS),"repinnedTests":len(repinned_tests),"sourceIndexDocs":repinned_docs},indent=2))
