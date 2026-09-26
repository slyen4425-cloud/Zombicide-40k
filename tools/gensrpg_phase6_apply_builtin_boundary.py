from pathlib import Path
import hashlib

p=Path("index.html")
before=p.read_bytes()

def git_blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

assert len(before)==8170402, (len(before), git_blob(before))
assert git_blob(before)=="2a7dae75115d83b4edc368c42453a7cb58d0bd73"

text=before.decode("utf-8")

def replace_one(old,new,label):
    global text
    count=text.count(old)
    assert count==1, (label,count)
    text=text.replace(old,new,1)

replace_one(
'''function applyBuiltinEnemyOverrides(){
 const overrides=loadBuiltinEnemyOverrides();
 const bases=[...BASE_ZOMBIE_TYPES,...((typeof dungeonEnemies==="function")?dungeonEnemies():[])];''',
'''function applyBuiltinEnemyOverrides(bases=BASE_ZOMBIE_TYPES){
 const overrides=loadBuiltinEnemyOverrides();''',
"generic applyBuiltinEnemyOverrides boundary")

replace_one(
'''    applyBuiltinEnemyOverrides();

    const cfg=loadZombieConfig();''',
'''    applyBuiltinEnemyOverrides([builtinEnemyBase(baseId)].filter(Boolean));

    const cfg=loadZombieConfig();''',
"builtin editor save exact base")

replace_one(
'''  applyBuiltinEnemyOverrides();
  renderEnemyLibrary();''',
'''  applyBuiltinEnemyOverrides([base]);
  renderEnemyLibrary();''',
"builtin editor reset exact base")

replace_one(
'''function ensureDungeonEnemies(){
  dungeonEnemies().forEach(e=>{if(!ZOMBIE_TYPES.some(x=>x.id===e.id))ZOMBIE_TYPES.push(e)});
}''',
'''function ensureDungeonEnemies(){
  const bases=dungeonEnemies();
  bases.forEach(e=>{if(!ZOMBIE_TYPES.some(x=>x.id===e.id))ZOMBIE_TYPES.push(e)});
  applyBuiltinEnemyOverrides(bases);
}''',
"Dungeon explicit builtin bases")

replace_one(
'''if(typeof window.applyBuiltinEnemyOverrides==="function"){
  const oldApplyOverrides164=window.applyBuiltinEnemyOverrides;
  window.applyBuiltinEnemyOverrides=function(){
    const r=oldApplyOverrides164.apply(this,arguments);
    dungeonApplyGithubArts164();
    return r;
  };
}

''',
''' ''',
"retire V164 shared apply wrapper")
text=text.replace(
'''/* Lorsqu'un visuel est modifié/réinitialisé dans l'éditeur, on réapplique
   immédiatement la priorité personnalisée > GitHub. */
 ''',
'''/* Lorsqu'un visuel est modifié/réinitialisé dans l'éditeur, on réapplique
   immédiatement la priorité personnalisée > GitHub. */
''',1)

after=text.encode("utf-8")
assert len(after)==8170150, (len(after), git_blob(after))
assert git_blob(after)=="ca5cb0b92f4e6ff8779ebe2339bb2be32a89f8f9"

# Postconditions matching Phase 6 boundary characterization.
assert text.count("function refreshCustomEnemiesIntoZombieTypes(){")==1
rs=text.index("function refreshCustomEnemiesIntoZombieTypes(){")
re=text.index("function isDungeonEnemyRecord(",rs)
refresh=text[rs:re]
assert "applyBuiltinEnemyOverrides()" in refresh
assert "ensureDungeonEnemies" not in refresh

as_=text.index("function applyBuiltinEnemyOverrides")
ae=text.index("function resetBuiltinEnemyCustomization(",as_)
apply=text[as_:ae]
assert "function applyBuiltinEnemyOverrides(bases=BASE_ZOMBIE_TYPES)" in apply
assert "dungeonEnemies" not in apply
assert "bases.forEach" in apply

es=text.index("function ensureDungeonEnemies(){")
ee=text.index("function dungeonContentIds(",es)
ensure=text[es:ee]
assert "const bases=dungeonEnemies()" in ensure
assert "applyBuiltinEnemyOverrides(bases)" in ensure

vs=text.index('<script id="dungeonGithubArts164">')
ve=text.index("</script>",vs)
v164=text[vs:ve]
assert "window.dungeonEnemies=function()" in v164
assert "window.dungeonApplyGithubArts164=function()" in v164
assert "window.applyBuiltinEnemyOverrides=function()" not in v164
assert "oldApplyOverrides164" not in v164

p.write_bytes(after)
print({"size":len(after),"blob":git_blob(after),"phase6_builtin_boundary":"target"})
