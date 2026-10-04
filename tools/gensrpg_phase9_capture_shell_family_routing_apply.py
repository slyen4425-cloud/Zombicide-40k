from pathlib import Path
import hashlib

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
OLD_BYTES=8167007
NEW_BYTES=8167187
OLD_BLOB="9eff1bfddc9e4fab82f7a181eb9996ecce9c6ae4"
NEW_BLOB="99d7784676669b629cae6070df8c02606d67002f"

def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

data=INDEX.read_bytes()
assert len(data)==OLD_BYTES,(len(data),OLD_BYTES)
assert git_blob(data)==OLD_BLOB,git_blob(data)
text=data.decode("utf-8")

replacements=[
(
'const all=loadGameProfiles(),rpg=all.filter(p=>p.gameStyle==="dungeon").map(ensureRpgProfileData);',
'const all=loadGameProfiles(),rpg=all.filter(p=>{const f=gensContentFamilyForProfile(p);return f==="rpg"||f==="manga"||f==="creature"}).map(ensureRpgProfileData);'
),
(
'const raw=loadGameProfiles().filter(p=>p?.gameStyle==="dungeon");',
'const raw=loadGameProfiles().filter(p=>{const f=gensContentFamilyForProfile(p);return f==="rpg"||f==="manga"||f==="creature"});'
),
(
'return p?.gameStyle==="dungeon"?"adventure":"survival";',
'const f=gensContentFamilyForProfile(p);return (f==="rpg"||f==="manga"||f==="creature")?"adventure":"survival";'
),
]

for old,new in replacements:
    assert text.count(old)==1,(old,text.count(old))
    text=text.replace(old,new,1)

new_data=text.encode("utf-8")
assert len(new_data)==NEW_BYTES,(len(new_data),NEW_BYTES)
assert git_blob(new_data)==NEW_BLOB,git_blob(new_data)
INDEX.write_bytes(new_data)

# Cumulative sentinels pin the exact committed runtime. Repin fingerprints only.
for p in sorted((ROOT/"tests").rglob("*.test.cjs")):
    s=p.read_text(encoding="utf-8")
    n=s.replace(OLD_BLOB,NEW_BLOB).replace(str(OLD_BYTES),str(NEW_BYTES))
    if n!=s:
        p.write_text(n,encoding="utf-8")

for rel in [
    "docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json",
    "docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv",
    "docs/GENSRPG_PHASE2_INLINE_OWNERS.json",
    "docs/GENSRPG_PHASE2_STORAGE_OWNERS.json",
]:
    p=ROOT/rel
    s=p.read_text(encoding="utf-8")
    n=s.replace(OLD_BLOB,NEW_BLOB).replace(str(OLD_BYTES),str(NEW_BYTES))
    if n!=s:
        p.write_text(n,encoding="utf-8")

print("prepared",NEW_BLOB,NEW_BYTES)
